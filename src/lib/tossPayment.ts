import { loadTossPayments } from '@tosspayments/sdk';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

if (!CLIENT_KEY) {
  console.warn('VITE_TOSS_CLIENT_KEY 환경 변수가 설정되지 않았습니다. 결제 기능이 작동하지 않을 수 있습니다.');
}

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
  if (!CLIENT_KEY) {
    throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다. VITE_TOSS_CLIENT_KEY 환경 변수를 확인해주세요.');
  }

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

