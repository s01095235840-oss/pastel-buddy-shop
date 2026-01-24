import { loadTossPayments } from '@tosspayments/sdk';

const CLIENT_KEY = 'test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm';

export interface PaymentInfo {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
}

/**
 * 토스페이먼츠 결제 요청
 */
export async function requestTossPayment(paymentInfo: PaymentInfo) {
  try {
    const tossPayments = await loadTossPayments(CLIENT_KEY);
    
    await tossPayments.requestPayment('카드', {
      amount: paymentInfo.amount,
      orderId: paymentInfo.orderId,
      orderName: paymentInfo.orderName,
      customerName: paymentInfo.customerName || '고객',
      customerEmail: paymentInfo.customerEmail,
      successUrl: paymentInfo.successUrl,
      failUrl: paymentInfo.failUrl,
    });
  } catch (error) {
    console.error('토스페이먼츠 결제 오류:', error);
    throw error;
  }
}

/**
 * 주문 ID 생성 (타임스탬프 기반)
 */
export function generateOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

