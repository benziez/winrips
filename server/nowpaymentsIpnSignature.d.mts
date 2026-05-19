import type { IncomingMessage } from "node:http";

export function getNowPaymentsSignatureHeader(req: IncomingMessage): string;

export function verifyNowPaymentsIpnSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean;
