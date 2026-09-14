import { PayOS } from '@payos/node';
import { randomInt } from 'crypto';
import type { PremiumPlan } from '../types';

let _payos: PayOS | null = null;

function getPayOS(): PayOS {
  if (!_payos) {
    _payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID!,
      apiKey: process.env.PAYOS_API_KEY!,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
    });
  }
  return _payos;
}

export const PLAN_CONFIG: Record<PremiumPlan, { amount: number; label: string; durationDays: number | null }> = {
  vip: { amount: 39000, label: 'Combo VIP', durationDays: null },
  monthly: { amount: 49000, label: 'Hàng tháng', durationDays: 30 },
  yearly: { amount: 399000, label: 'Hàng năm', durationDays: 365 },
};

function generateOrderCode(): number {
  return randomInt(100000000, 999999999);
}

export async function createPaymentLink(params: {
  userId: string;
  planId: PremiumPlan;
}) {
  const { planId } = params;
  const config = PLAN_CONFIG[planId];
  const orderCode = generateOrderCode();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const description = `FocusMate ${config.label}`;

  const paymentLinkData = await getPayOS().paymentRequests.create({
    orderCode,
    amount: config.amount,
    description,
    returnUrl: `${appUrl}/premium?payment=success&orderCode=${orderCode}`,
    cancelUrl: `${appUrl}/premium?payment=cancelled`,
  });

  return {
    orderCode,
    checkoutUrl: paymentLinkData.checkoutUrl,
    qrCode: paymentLinkData.qrCode,
    amount: config.amount,
    description,
  };
}

export async function verifyWebhookPayload(payload: Record<string, unknown>) {
  const verifiedData = await getPayOS().webhooks.verify(payload as any);
  return verifiedData;
}

export { getPayOS as payos };
