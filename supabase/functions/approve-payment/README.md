# 토스페이먼츠 결제 승인 Edge Function

## 개요
이 Edge Function은 토스페이먼츠 결제 승인을 처리하고 주문 정보를 데이터베이스에 저장합니다.

## 배포 방법

### 1. Supabase CLI를 사용한 배포

```bash
# Supabase CLI 설치 (미설치 시)
npm install -g supabase

# Supabase 프로젝트 연결
supabase link --project-ref <your-project-ref>

# Edge Function 배포
supabase functions deploy approve-payment
```

### 2. Supabase Dashboard를 사용한 배포

1. Supabase Dashboard 접속
2. 좌측 메뉴에서 **Edge Functions** 클릭
3. **Create a new function** 클릭
4. 함수 이름: `approve-payment`
5. `index.ts` 파일의 내용을 복사하여 붙여넣기
6. **Deploy** 클릭

## 환경변수 설정

Supabase Dashboard > Settings > Edge Functions > Secrets에서 다음 환경변수를 설정하세요:

```
TOSS_SECRET_KEY=your_toss_secret_key
```

**참고**: `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 자동으로 제공되므로 별도 설정이 필요하지 않습니다.

## API 사용 방법

### 요청

```typescript
POST https://<your-project-ref>.supabase.co/functions/v1/approve-payment
Content-Type: application/json
Authorization: Bearer <anon-key>

{
  "paymentKey": "tgen_free_...",
  "orderId": "order_1234567890_abc123",
  "amount": 12000,
  "userId": "user-uuid",
  "items": [
    {
      "product_id": 1,
      "product_name": "시그니처 플래너",
      "product_price": 12000,
      "quantity": 1
    }
  ]
}
```

### 성공 응답 (200)

```json
{
  "success": true,
  "message": "결제 승인 및 주문 저장 완료",
  "order": {
    "id": "order-uuid",
    "order_number": "ORD-2024-01-001",
    "total_amount": 12000,
    "status": "completed"
  },
  "payment": {
    "paymentKey": "tgen_free_...",
    "paymentId": "payment-id",
    "orderId": "order_1234567890_abc123",
    "method": "카드",
    "totalAmount": 12000,
    "status": "DONE"
  }
}
```

### 오류 응답

#### 400 - 잘못된 요청
```json
{
  "error": "필수 파라미터가 누락되었습니다.",
  "required": ["paymentKey", "orderId", "amount", "userId", "items"]
}
```

#### 500 - 서버 오류
```json
{
  "error": "서버 오류가 발생했습니다.",
  "details": "오류 상세 내용"
}
```

## 프론트엔드 연동 예시

```typescript
import { supabase } from '@/lib/supabase';

async function approvePayment(paymentData: {
  paymentKey: string;
  orderId: string;
  amount: number;
  userId: string;
  items: Array<{
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
  }>;
}) {
  const { data, error } = await supabase.functions.invoke('approve-payment', {
    body: paymentData,
  });

  if (error) {
    throw error;
  }

  return data;
}
```

## 보안 주의사항

1. **시크릿 키 보호**: `TOSS_SECRET_KEY`는 반드시 Supabase Secrets에만 저장하세요.
2. **RLS 정책**: 데이터베이스의 RLS 정책이 올바르게 설정되어 있는지 확인하세요.
3. **사용자 인증**: Edge Function 호출 시 사용자 인증을 확인하세요.

## 트러블슈팅

### "TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다" 오류
- Supabase Dashboard > Settings > Edge Functions > Secrets에서 환경변수를 확인하세요.

### "주문 번호 생성 실패" 오류
- 데이터베이스에 `generate_order_number` 함수가 있는지 확인하세요.
- SQL Editor에서 `database/complete-schema.sql` 파일의 함수를 실행했는지 확인하세요.

### "주문 생성 실패" 오류
- 데이터베이스에 `orders` 테이블이 있는지 확인하세요.
- RLS 정책이 올바르게 설정되어 있는지 확인하세요.

