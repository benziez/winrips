export type DepositPayCurrency = "btc" | "sol" | "ltc";

export interface CreateDepositPaymentRequest {
  priceAmount: number;
  payCurrency: DepositPayCurrency;
  userId: string;
}

export interface DepositPaymentResponse {
  paymentId: string;
  orderId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: DepositPayCurrency;
  priceAmount: number;
  priceCurrency: string;
}

export interface AccountBalanceResponse {
  userId: string;
  gemBalance: number;
  tokenBalance: number;
}
