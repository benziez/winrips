export function usdToGems(usdAmount: number | string): number;

export function parseWinripsOrderId(
  orderId: string,
): { userId: string; timestamp: string } | null;

export function getUserBalance(userId: string): {
  userId: string;
  gemBalance: number;
  tokenBalance: number;
};

export function registerDepositOrder(input: {
  orderId: string;
  userId: string;
  priceAmountUsd: number;
  paymentId: string;
}): {
  orderId: string;
  userId: string;
  paymentId: string | null;
  priceAmountUsd: number;
  gemsExpected: number;
  status: string;
  createdAt: string;
};

export function hasProcessedPayment(paymentId: string): boolean;

export function creditGemsFromDeposit(input: {
  userId: string;
  gems: number;
  paymentId: string | null;
  orderId: string;
  paymentStatus: string;
}): {
  credited: boolean;
  duplicate: boolean;
  gemBalance: number;
  gems: number;
};
