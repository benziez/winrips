export type DeleteAccountResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      code?: string;
      error: string;
    };

export async function deleteAccount(accessToken: string): Promise<DeleteAccountResult> {
  try {
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ confirm: true }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; code?: string }
      | null;

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
