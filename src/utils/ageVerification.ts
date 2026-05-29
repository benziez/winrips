export const UNDERAGE_ERROR = "You must be 18 or older to use WinRips";

/** Age in full years on today's date (UTC calendar). */
export function ageFromDateOfBirth(dobIso: string, asOf: Date = new Date()): number | null {
  const parts = dobIso.trim().split("-");
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) {
    return null;
  }

  const today = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  if (birth > today) return null;

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return age;
}

export function isAtLeast18(dobIso: string): boolean {
  const age = ageFromDateOfBirth(dobIso);
  return age !== null && age >= 18;
}

export function validateDateOfBirthInput(dobIso: string): string | null {
  if (!dobIso.trim()) return "Date of birth is required.";
  const age = ageFromDateOfBirth(dobIso);
  if (age === null) return "Enter a valid date of birth.";
  if (age < 18) return UNDERAGE_ERROR;
  return null;
}
