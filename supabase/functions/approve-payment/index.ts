// ============================================
// 토스페이먼츠 결제 승인 Edge Function
// 함수 이름: approve-payment
// ============================================
// 
// 사용 방법:
// 1. Supabase CLI로 배포: supabase functions deploy approve-payment
// 2. 또는 Supabase Dashboard > Edge Functions에서 직접 배포
// 
// 환경변수 설정 필요:
// - TOSS_SECRET_KEY: 토스페이먼츠 시크릿 키 (test_sk_ORzdMaqN3wxBzK4gNPEYV5AkYXQG)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmRequest {
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
}

serve(async (req) => {
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 환경변수에서 토스페이먼츠 시크릿 키 가져오기
    const secretKey = Deno.env.get("TOSS_SECRET_KEY");
    if (!secretKey) {
      throw new Error("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.");
    }

    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 요청 본문 파싱
    const {
      paymentKey,
      orderId,
      amount,
      userId,
      items,
    }: PaymentConfirmRequest = await req.json();

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount || !userId || !items) {
      return new Response(
        JSON.stringify({
          error: "필수 파라미터가 누락되었습니다.",
          required: ["paymentKey", "orderId", "amount", "userId", "items"],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const tossPaymentResponse = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(secretKey + ":")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    );

    const paymentResult = await tossPaymentResponse.json();

    // 토스페이먼츠 API 오류 처리
    if (!tossPaymentResponse.ok) {
      console.error("토스페이먼츠 결제 승인 실패:", paymentResult);
      return new Response(
        JSON.stringify({
          error: "결제 승인에 실패했습니다.",
          details: paymentResult,
        }),
        {
          status: tossPaymentResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 결제 승인 성공 시 DB에 주문 저장
    try {
      // 주문 번호 생성 함수 호출
      const { data: orderNumberData, error: orderNumberError } =
        await supabaseClient.rpc("generate_order_number");

      if (orderNumberError) {
        throw new Error(`주문 번호 생성 실패: ${orderNumberError.message}`);
      }

      const orderNumber = orderNumberData;

      // 주문 생성
      const { data: order, error: orderError } = await supabaseClient
        .from("orders")
        .insert({
          user_id: userId,
          order_number: orderNumber,
          total_amount: amount,
          status: "completed",
          payment_key: paymentKey,
          payment_id: paymentResult.paymentId || orderId,
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`주문 생성 실패: ${orderError.message}`);
      }

      // 주문 상품 추가
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        subtotal: item.product_price * item.quantity,
      }));

      const { error: itemsError } = await supabaseClient
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        // 주문은 생성되었지만 상품 추가 실패 - 주문 롤백
        await supabaseClient.from("orders").delete().eq("id", order.id);
        throw new Error(`주문 상품 추가 실패: ${itemsError.message}`);
      }

      // 성공 응답
      return new Response(
        JSON.stringify({
          success: true,
          message: "결제 승인 및 주문 저장 완료",
          order: {
            id: order.id,
            order_number: order.order_number,
            total_amount: order.total_amount,
            status: order.status,
          },
          payment: {
            paymentKey: paymentResult.paymentKey,
            paymentId: paymentResult.paymentId,
            orderId: paymentResult.orderId,
            method: paymentResult.method,
            totalAmount: paymentResult.totalAmount,
            status: paymentResult.status,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (dbError: any) {
      console.error("DB 저장 오류:", dbError);
      
      // 결제는 승인되었지만 DB 저장 실패 - 사용자에게 알림 필요
      return new Response(
        JSON.stringify({
          error: "결제는 승인되었으나 주문 저장에 실패했습니다.",
          details: dbError.message,
          payment: paymentResult,
          warning: "관리자에게 문의하여 주문을 확인해주세요.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Edge Function 오류:", error);
    return new Response(
      JSON.stringify({
        error: "서버 오류가 발생했습니다.",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

