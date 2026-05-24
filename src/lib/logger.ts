const isDevelopment = import.meta.env.MODE === "development";

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

/** @alias logger.log */
export const log = logger.log;
