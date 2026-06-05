import {
  PaymentSheetEventsEnum,
  type CreatePaymentSheetOption,
} from "@capacitor-community/stripe";
import type { PluginListenerHandle } from "@capacitor/core";
import { Capacitor } from "@capacitor/core";
import { waitForDepositPaymentSuccess } from "./stripeDepositApi";
import { ensureStripeInitialized, getStripeKeyDiagnostics, Stripe } from "./stripeClient";

/** Must match CFBundleURLSchemes in ios/App/App/Info.plist (Stripe 3DS / redirect return). */
export const STRIPE_IOS_RETURN_URL = "com.winrips.app://stripe-redirect";

const APPLE_PAY_MERCHANT_ID = "merchant.com.winrips.app";

export class StripePaymentSheetError extends Error {
  readonly paymentResult?: PaymentSheetEventsEnum;
  readonly nativeError?: string;

  constructor(
    message: string,
    options?: { paymentResult?: PaymentSheetEventsEnum; nativeError?: string; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "StripePaymentSheetError";
    this.paymentResult = options?.paymentResult;
    this.nativeError = options?.nativeError;
  }
}

export type DepositPaymentSheetOutcome = "completed" | "canceled";

/** Normalize Capacitor plugin listener payloads (`string` or `{ error: string }`). */
export function normalizeStripeListenerPayload(payload: unknown): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
    try {
      return JSON.stringify(payload);
    } catch {
      return String(payload);
    }
  }
  return payload == null ? "" : String(payload);
}

/** Extract the native bridge / Capacitor rejection message for logging and toasts. */
export function formatCapacitorStripeError(error: unknown): string {
  if (error instanceof StripePaymentSheetError) {
    return error.nativeError?.trim() || error.message;
  }

  if (error instanceof Error) {
    const cap = error as Error & {
      code?: string;
      errorMessage?: string;
      data?: unknown;
    };
    const parts: string[] = [];
    if (cap.message?.trim()) parts.push(cap.message.trim());
    if (cap.errorMessage?.trim() && cap.errorMessage !== cap.message) {
      parts.push(cap.errorMessage.trim());
    }
    if (cap.code?.trim()) parts.push(`code=${cap.code.trim()}`);
    if (cap.data != null) {
      try {
        parts.push(JSON.stringify(cap.data));
      } catch {
        parts.push(String(cap.data));
      }
    }
    if (parts.length > 0) return parts.join(" — ");
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message =
      (typeof record.message === "string" && record.message) ||
      (typeof record.error === "string" && record.error) ||
      (typeof record.errorMessage === "string" && record.errorMessage);
    if (message) return message;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return error == null ? "Payment failed." : String(error);
}

function redactClientSecret(secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) return "(empty)";
  const parts = trimmed.split("_secret_");
  if (parts.length >= 2) {
    return `${parts[0]}_secret_[redacted]`;
  }
  return `${trimmed.slice(0, 12)}…`;
}

type PaymentSheetDiagnosticState = {
  failedToLoad: string | null;
  failed: string | null;
  loaded: boolean;
  completed: boolean;
};

type PaymentSheetDiagnosticHandles = {
  state: PaymentSheetDiagnosticState;
  waitForNativeFailure: (timeoutMs?: number) => Promise<string | null>;
  remove: () => Promise<void>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attachPaymentSheetDiagnosticListeners(): Promise<PaymentSheetDiagnosticHandles> {
  const state: PaymentSheetDiagnosticState = {
    failedToLoad: null,
    failed: null,
    loaded: false,
    completed: false,
  };

  const failureWaiters: Array<(message: string) => void> = [];

  const notifyFailureWaiters = (message: string): void => {
    const trimmed = message.trim();
    if (!trimmed) return;
    while (failureWaiters.length > 0) {
      failureWaiters.shift()?.(trimmed);
    }
  };

  const handles: PluginListenerHandle[] = [];

  handles.push(
    await Stripe.addListener(PaymentSheetEventsEnum.Loaded, () => {
      state.loaded = true;
      console.info("[Stripe] paymentSheetLoaded");
    }),
  );

  handles.push(
    await Stripe.addListener(PaymentSheetEventsEnum.Completed, () => {
      state.completed = true;
      console.info("[Stripe] paymentSheetCompleted (listener)");
    }),
  );

  handles.push(
    await Stripe.addListener(PaymentSheetEventsEnum.FailedToLoad, (payload) => {
      state.failedToLoad = normalizeStripeListenerPayload(payload);
      console.error("[Stripe] paymentSheetFailedToLoad", state.failedToLoad);
      notifyFailureWaiters(state.failedToLoad);
    }),
  );

  handles.push(
    await Stripe.addListener(PaymentSheetEventsEnum.Failed, (payload) => {
      state.failed = normalizeStripeListenerPayload(payload);
      console.error("[Stripe] paymentSheetFailed (native)", state.failed);
      notifyFailureWaiters(state.failed);
    }),
  );

  return {
    state,
    waitForNativeFailure: async (timeoutMs = 750) => {
      const existing = state.failed ?? state.failedToLoad;
      if (existing?.trim()) return existing.trim();

      return new Promise<string | null>((resolve) => {
        const timer = window.setTimeout(() => {
          const idx = failureWaiters.findIndex((w) => w === onFailure);
          if (idx >= 0) failureWaiters.splice(idx, 1);
          resolve(state.failed ?? state.failedToLoad);
        }, timeoutMs);

        const onFailure = (message: string) => {
          window.clearTimeout(timer);
          resolve(message);
        };

        failureWaiters.push(onFailure);
      });
    },
    remove: async () => {
      failureWaiters.length = 0;
      await Promise.all(handles.map((handle) => handle.remove()));
    },
  };
}

/** User-visible message for deposit failures (prefers native Stripe SDK text). */
export function getDepositPaymentErrorMessage(error: unknown): string {
  if (error instanceof StripePaymentSheetError) {
    const native = error.nativeError?.trim();
    if (native) return native;
    return error.message.trim() || "Payment failed.";
  }
  return formatCapacitorStripeError(error);
}

async function resolveNativePaymentSheetFailure(
  diagnostics: PaymentSheetDiagnosticHandles,
  paymentResult: PaymentSheetEventsEnum,
): Promise<string> {
  const immediate =
    diagnostics.state.failed?.trim() || diagnostics.state.failedToLoad?.trim() || "";
  if (immediate) return immediate;

  const waited = await diagnostics.waitForNativeFailure();
  if (waited?.trim()) return waited.trim();

  await sleep(50);
  const afterTick =
    diagnostics.state.failed?.trim() || diagnostics.state.failedToLoad?.trim() || "";
  if (afterTick) return afterTick;

  if (paymentResult === PaymentSheetEventsEnum.Failed) {
    return "Payment sheet failed (native error did not arrive — retry and check Stripe keys).";
  }

  return "Payment sheet failed.";
}

export interface PresentDepositPaymentSheetOptions {
  paymentIntentClientSecret: string;
  paymentIntentId: string;
  merchantDisplayName?: string;
  enableApplePay?: boolean;
}

function sheetIndicatesSuccess(
  sheetListeners: PaymentSheetDiagnosticHandles,
  sheetResult: PaymentSheetEventsEnum,
): boolean {
  return (
    sheetResult === PaymentSheetEventsEnum.Completed || sheetListeners.state.completed
  );
}

/**
 * Configures and presents Stripe PaymentSheet for a balance deposit.
 * Ensures SDK init, attaches native listeners, and surfaces bridge error text.
 */
export async function presentDepositPaymentSheet(
  options: PresentDepositPaymentSheetOptions,
): Promise<DepositPaymentSheetOutcome> {
  const {
    paymentIntentClientSecret,
    paymentIntentId,
    merchantDisplayName = "WinRips",
    enableApplePay = true,
  } = options;

  await ensureStripeInitialized();

  const keyDiagnostics = getStripeKeyDiagnostics();
  console.info("[Stripe] presentDepositPaymentSheet", {
    platform: Capacitor.getPlatform(),
    ...keyDiagnostics,
    clientSecret: redactClientSecret(paymentIntentClientSecret),
    returnURL: Capacitor.getPlatform() === "ios" ? STRIPE_IOS_RETURN_URL : undefined,
    enableApplePay,
    applePayMerchantId: enableApplePay ? APPLE_PAY_MERCHANT_ID : undefined,
  });

  if (!keyDiagnostics.configured) {
    throw new StripePaymentSheetError(
      "Stripe publishable key is missing from this build (VITE_STRIPE_PUBLISHABLE_KEY).",
    );
  }

  if (!keyDiagnostics.initialized) {
    throw new StripePaymentSheetError("Stripe SDK failed to initialize before payment.");
  }

  if (Capacitor.getPlatform() === "ios" && enableApplePay) {
    try {
      await Stripe.isApplePayAvailable();
      console.info("[Stripe] isApplePayAvailable: yes");
    } catch (applePayError) {
      console.warn(
        "[Stripe] isApplePayAvailable rejected:",
        formatCapacitorStripeError(applePayError),
      );
    }
  }

  const sheetConfig: CreatePaymentSheetOption = {
    paymentIntentClientSecret: paymentIntentClientSecret.trim(),
    merchantDisplayName,
    style: "alwaysDark",
    countryCode: "US",
    enableApplePay,
    ...(enableApplePay ? { applePayMerchantId: APPLE_PAY_MERCHANT_ID } : {}),
    ...(Capacitor.getPlatform() === "ios"
      ? { returnURL: STRIPE_IOS_RETURN_URL }
      : {}),
  };

  const sheetListeners = await attachPaymentSheetDiagnosticListeners();

  try {
    try {
      await Stripe.createPaymentSheet(sheetConfig);
    } catch (createError) {
      const native =
        sheetListeners.state.failedToLoad ?? formatCapacitorStripeError(createError);
      console.error("[Stripe] createPaymentSheet rejected", {
        native,
        bridge: formatCapacitorStripeError(createError),
      });
      throw new StripePaymentSheetError(
        native || "Could not load payment sheet.",
        { nativeError: native, cause: createError },
      );
    }

    if (sheetListeners.state.failedToLoad) {
      throw new StripePaymentSheetError(sheetListeners.state.failedToLoad, {
        nativeError: sheetListeners.state.failedToLoad,
      });
    }

    let paymentResult: PaymentSheetEventsEnum;
    try {
      const result = await Stripe.presentPaymentSheet();
      paymentResult = result.paymentResult as PaymentSheetEventsEnum;
      console.info("[Stripe] presentPaymentSheet resolved", { paymentResult, result });
    } catch (presentError) {
      console.error("[Stripe] presentPaymentSheet threw", presentError);

      const poll = await waitForDepositPaymentSuccess(paymentIntentId);
      if (poll.confirmed || sheetListeners.state.completed) {
        console.info(
          "[Stripe] Payment succeeded on server despite presentPaymentSheet throw",
        );
        return "completed";
      }

      if (poll.notFoundAfterTimeout) {
        throw new StripePaymentSheetError(
          "Payment could not be confirmed. If your balance did not update, try again or contact support.",
          { nativeError: "Payment not found after verification timeout" },
        );
      }

      const native =
        (await sheetListeners.waitForNativeFailure()) ??
        sheetListeners.state.failed ??
        sheetListeners.state.failedToLoad ??
        formatCapacitorStripeError(presentError);

      throw new StripePaymentSheetError(
        native || "Payment sheet could not be presented.",
        { nativeError: native, cause: presentError },
      );
    }

    if (sheetIndicatesSuccess(sheetListeners, paymentResult)) {
      return "completed";
    }

    if (paymentResult === PaymentSheetEventsEnum.Canceled) {
      return "canceled";
    }

    // paymentSheetFailed (or unknown) — confirm with Stripe API before showing error UI
    console.info(
      "[Stripe] Sheet result not success; verifying PaymentIntent on server:",
      paymentResult,
    );
    const poll = await waitForDepositPaymentSuccess(paymentIntentId);
    if (poll.confirmed) {
      console.info(
        "[Stripe] Payment succeeded on server despite sheet result:",
        paymentResult,
      );
      return "completed";
    }

    if (poll.notFoundAfterTimeout) {
      throw new StripePaymentSheetError(
        "Payment could not be confirmed. If your balance did not update, try again or contact support.",
        {
          paymentResult: paymentResult as PaymentSheetEventsEnum,
          nativeError: "Payment not found after verification timeout",
        },
      );
    }

    const native = await resolveNativePaymentSheetFailure(sheetListeners, paymentResult);

    throw new StripePaymentSheetError(native, {
      paymentResult: paymentResult as PaymentSheetEventsEnum,
      nativeError: native,
    });
  } finally {
    await sheetListeners.remove();
  }
}
