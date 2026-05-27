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

  try {
    const response = await fetch(apiUrl("/api/account/delete"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${trimmedToken}`,
      },
      body: JSON.stringify({ confirm: true }),
    });

    const rawBody = await response.text();

    let payload: { ok?: boolean; error?: string; code?: string } | null = null;
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody) as { ok?: boolean; error?: string; code?: string };
      } catch {}
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
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Account could not be deleted. Try again or contact support.",
    };
  }
}
