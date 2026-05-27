export type DeleteAccountResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      code?: string;
      error: string;
    };

import { apiUrl } from "../utils/apiBaseUrl";

export async function deleteAccount(accessToken: string): Promise<DeleteAccountResult> {
  const trimmedToken = accessToken.trim();
  const requestUrl = apiUrl("/api/account/delete");
  console.log("[deleteAccountApi] sending request", {
    requestUrl,
    hasToken: trimmedToken.length > 0,
    tokenLength: trimmedToken.length,
  });

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${trimmedToken}`,
      },
      body: JSON.stringify({ confirm: true }),
    });

    const rawBody = await response.text();
    console.log("[deleteAccountApi] response received", {
      requestUrl,
      status: response.status,
      rawBody,
    });

    let payload: { ok?: boolean; error?: string; code?: string } | null = null;
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody) as { ok?: boolean; error?: string; code?: string };
      } catch (error) {
        console.error("[deleteAccountApi] failed to parse response JSON", {
          requestUrl,
          status: response.status,
          rawBody,
          error,
        });
      }
    }

    if (response.ok && payload?.ok !== false) {
      return { ok: true };
    }

    return {
      ok: false,
      status: response.status,
      code: typeof payload?.code === "string" ? payload.code : undefined,
      error: payload?.error ?? "Account could not be deleted. Try again or contact support.",
    };
  } catch (error) {
    console.error("[deleteAccountApi] request failed", {
      requestUrl,
      error,
    });
    return {
      ok: false,
      status: 0,
      error: "Account could not be deleted. Try again or contact support.",
    };
  }
}
