/** Native shell uses the same gem-balance toasts as web. */
export function shouldSuppressMobileGemToast(_message: string): boolean {
  return false;
}
