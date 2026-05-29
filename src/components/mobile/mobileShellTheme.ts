/** App shell + header — pure black canvas. */
export const APP_SHELL_BG = "#000000";

export const MOBILE_HEADER_BG = APP_SHELL_BG;

export const mobileHeaderSafePaddingStyle = {
  paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)",
} as const;
