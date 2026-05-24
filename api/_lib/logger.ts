const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = {
  log(...args: unknown[]): void {
    if (isDevelopment) console.log(...args);
  },

  warn(...args: unknown[]): void {
    if (isDevelopment) console.warn(...args);
  },

  error(...args: unknown[]): void {
    if (isDevelopment) console.error(...args);
  },

  /** Production-safe — generic message only; never pass IDs, payloads, or PII. */
  critical(message: string): void {
    console.error(message);
  },
};

export const log = logger.log;
