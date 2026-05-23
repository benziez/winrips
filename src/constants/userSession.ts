export const USER_SESSION_STORAGE_KEY = "winrips-user-session";

export function readLoggedInFromStorage(): boolean {
  try {
    return localStorage.getItem(USER_SESSION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistLoggedIn(): void {
  try {
    localStorage.setItem(USER_SESSION_STORAGE_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

export function clearLoggedIn(): void {
  try {
    localStorage.removeItem(USER_SESSION_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
