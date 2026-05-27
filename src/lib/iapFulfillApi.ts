interface FulfillIapPackOpenParams {
  packId: string;
  gemCost: number;
  quantity: number;
  productId: string;
  transactionId: string;
  accessToken: string;
}

export type FulfillIapResult = { ok: true } | { ok: false; error: string };

export async function fulfillIapPackOpen(
  params: FulfillIapPackOpenParams,
): Promise<FulfillIapResult> {
  try {
    const response = await fetch("/api/iap/fulfill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        packId: params.packId,
        gemCost: params.gemCost,
        quantity: params.quantity,
        productId: params.productId,
        transactionId: params.transactionId,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    if (!response.ok) {
      return { ok: false, error: payload?.error ?? `Fulfillment failed (${response.status})` };
    }

    if (payload?.ok === false) {
      return { ok: false, error: payload.error ?? "Fulfillment failed." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server to complete your purchase." };
  }
}
