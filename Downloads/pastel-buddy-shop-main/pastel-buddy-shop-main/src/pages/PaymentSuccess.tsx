import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Home, User } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const clearCart = useCartStore((state) => state.clearCart);
  const [isSaving, setIsSaving] = useState(true);
  
  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");
  const paymentId = searchParams.get("paymentId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    const approvePayment = async () => {
      if (!orderId || !user) {
        setIsSaving(false);
        return;
      }

      // paymentKey는 토스페이먼츠에서 필수로 전달됨
      if (!paymentKey) {
        console.error("결제 키가 없습니다.");
        setIsSaving(false);
        return;
      }

      try {
        // sessionStorage에서 주문 정보 가져오기
        const orderDataStr = sessionStorage.getItem(`order_${orderId}`);
        if (!orderDataStr) {
          console.error("주문 정보를 찾을 수 없습니다:", orderId);
          toast({
            title: "주문 정보 오류",
            description: "주문 정보를 찾을 수 없습니다. 마이페이지에서 확인해주세요.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        const orderData = JSON.parse(orderDataStr);

        // Edge Function을 통해 결제 승인 및 주문 저장
        const { data, error } = await supabase.functions.invoke('approve-payment', {
          body: {
            paymentKey,
            orderId,
            amount: orderData.totalAmount,
            userId: user.id,
            items: orderData.items,
          },
        });

        if (error) {
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || '결제 승인에 실패했습니다.');
        }

        // sessionStorage에서 주문 정보 삭제
        sessionStorage.removeItem(`order_${orderId}`);

        // 장바구니 비우기
        clearCart();

        console.log("결제 승인 및 주문 저장 완료:", data);
        toast({
          title: "결제 완료! 🎉",
          description: `주문 번호: ${data.order.order_number}`,
        });
      } catch (error: any) {
        console.error("결제 승인 오류:", error);
        toast({
          title: "결제 승인 실패",
          description: error.message || "결제 승인 중 오류가 발생했습니다. 고객센터로 문의해주세요.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    approvePayment();
  }, [orderId, paymentKey, paymentId, user, clearCart]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container max-w-2xl">
          <div className="bg-card rounded-3xl shadow-soft p-8 md:p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <CheckCircle className="h-24 w-24 text-primary animate-bounce" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              </div>
            </div>
            
            <h1 className="font-cute text-4xl md:text-5xl text-foreground mb-4">
              결제가 완료되었어요! 🎉
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              {isSaving ? "주문 정보를 저장하고 있어요..." : "주문해주셔서 감사합니다!"}
            </p>

            {orderId && (
              <div className="bg-muted/50 rounded-2xl p-4 mb-8">
                <p className="text-sm text-muted-foreground mb-2">주문 번호</p>
                <p className="font-mono text-lg font-semibold text-foreground break-all">
                  {orderId}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="bear"
                size="lg"
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <Home className="h-5 w-5" />
                홈으로 돌아가기
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/mypage")}
                className="flex items-center gap-2"
              >
                <User className="h-5 w-5" />
                마이페이지
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;

