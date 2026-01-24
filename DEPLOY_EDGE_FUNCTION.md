# Supabase Edge Function 배포 가이드

## 📋 목차
1. [Supabase Edge Function이란?](#supabase-edge-function이란)
2. [배포 방법](#배포-방법)
3. [환경변수 설정](#환경변수-설정)
4. [프론트엔드 연동](#프론트엔드-연동)

---

## Supabase Edge Function이란?

Supabase Edge Function은 Deno 런타임을 사용하는 서버리스 함수입니다. 
클라이언트에 노출되지 않아야 하는 시크릿 키(토스페이먼츠 시크릿 키)를 안전하게 관리할 수 있습니다.

---

## 배포 방법

### 방법 1: Supabase CLI 사용 (권장)

#### 1단계: Supabase CLI 설치

```bash
npm install -g supabase
```

#### 2단계: Supabase 프로젝트 연결

```bash
# Supabase Dashboard > Settings > API에서 Project URL 확인
supabase link --project-ref fyyywvbhktfolpibknnd
```

#### 3단계: Edge Function 배포

```bash
# approve-payment 함수 배포
supabase functions deploy approve-payment

# 또는 특정 프로젝트에 직접 배포
supabase functions deploy approve-payment --project-ref fyyywvbhktfolpibknnd
```

### 방법 2: Supabase Dashboard 사용

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택: `fyyywvbhktfolpibknnd`

2. **Edge Functions 메뉴 이동**
   - 좌측 메뉴에서 **Edge Functions** 클릭
   - 또는 URL: https://supabase.com/dashboard/project/fyyywvbhktfolpibknnd/functions

3. **새 함수 생성**
   - **Create a new function** 버튼 클릭
   - 함수 이름: `approve-payment`

4. **코드 복사/붙여넣기**
   - `supabase/functions/approve-payment/index.ts` 파일의 내용 전체 복사
   - Dashboard의 코드 에디터에 붙여넣기

5. **배포**
   - **Deploy** 버튼 클릭

---

## 환경변수 설정

### Supabase Dashboard에서 설정

1. **Settings 메뉴 이동**
   - Supabase Dashboard > Settings > Edge Functions

2. **Secrets 추가**
   - **Add secret** 버튼 클릭
   - Name: `TOSS_SECRET_KEY`
   - Value: `test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG`
   - **Save** 클릭

### CLI를 사용한 설정

```bash
# Secret 추가
supabase secrets set TOSS_SECRET_KEY=test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG --project-ref fyyywvbhktfolpibknnd

# Secret 확인
supabase secrets list --project-ref fyyywvbhktfolpibknnd
```

**참고**: 
- `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 자동으로 제공되므로 별도 설정이 필요하지 않습니다.
- 프로덕션 환경에서는 실제 시크릿 키로 변경하세요.

---

## 프론트엔드 연동

프론트엔드는 이미 `PaymentSuccess.tsx`에서 Edge Function을 호출하도록 수정되었습니다.

### 호출 예시

```typescript
const { data, error } = await supabase.functions.invoke('approve-payment', {
  body: {
    paymentKey: 'tgen_free_...',
    orderId: 'order_1234567890_abc123',
    amount: 12000,
    userId: 'user-uuid',
    items: [
      {
        product_id: 1,
        product_name: '시그니처 플래너',
        product_price: 12000,
        quantity: 1,
      },
    ],
  },
});
```

---

## 테스트 방법

### 1. 로컬 테스트 (Supabase CLI 사용)

```bash
# 로컬에서 Edge Function 실행
supabase functions serve approve-payment

# 다른 터미널에서 테스트 요청
curl -X POST http://localhost:54321/functions/v1/approve-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{
    "paymentKey": "test-payment-key",
    "orderId": "test-order-id",
    "amount": 12000,
    "userId": "test-user-id",
    "items": [
      {
        "product_id": 1,
        "product_name": "테스트 상품",
        "product_price": 12000,
        "quantity": 1
      }
    ]
  }'
```

### 2. 프로덕션 테스트

1. 결제 테스트 진행
2. 결제 성공 후 리다이렉트 페이지 확인
3. 브라우저 콘솔에서 로그 확인
4. Supabase Dashboard > Table Editor에서 `orders` 테이블 확인

---

## 트러블슈팅

### "TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다" 오류

**해결 방법:**
- Supabase Dashboard > Settings > Edge Functions > Secrets에서 환경변수 확인
- CLI를 사용한 경우: `supabase secrets list` 명령어로 확인

### "결제 승인에 실패했습니다" 오류

**해결 방법:**
- 토스페이먼츠 시크릿 키가 올바른지 확인
- `orderId`와 `amount`가 토스페이먼츠 결제 요청 시와 동일한지 확인
- Supabase Dashboard > Edge Functions > Logs에서 상세 오류 확인

### "주문 번호 생성 실패" 오류

**해결 방법:**
- 데이터베이스에 `generate_order_number` 함수가 있는지 확인
- SQL Editor에서 `database/complete-schema.sql` 파일 실행 여부 확인

### "주문 생성 실패" 오류

**해결 방법:**
- `orders` 테이블이 존재하는지 확인
- RLS 정책이 올바르게 설정되어 있는지 확인
- `database/add-payment-fields.sql` 파일 실행 여부 확인

---

## 보안 주의사항

1. **시크릿 키 보호**
   - `TOSS_SECRET_KEY`는 절대 클라이언트 코드에 포함하지 마세요
   - Supabase Secrets에만 저장하세요
   - GitHub 등 공개 저장소에 커밋하지 마세요

2. **RLS 정책 확인**
   - 데이터베이스의 RLS 정책이 올바르게 설정되어 있는지 확인
   - 사용자는 자신의 주문만 조회/생성할 수 있어야 합니다

3. **에러 처리**
   - 결제 승인 후 DB 저장 실패 시 롤백 처리
   - 사용자에게 명확한 오류 메시지 제공

---

## 완료!

Edge Function이 성공적으로 배포되면:
1. 결제 승인이 서버에서 안전하게 처리됩니다
2. 주문 정보가 자동으로 데이터베이스에 저장됩니다
3. 마이페이지에서 주문 내역을 확인할 수 있습니다

문제가 발생하면 Supabase Dashboard > Edge Functions > Logs에서 상세 로그를 확인하세요.

