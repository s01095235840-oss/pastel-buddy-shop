import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, Home, RotateCcw } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PaymentFail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("errorCode");
  const errorMsg = searchParams.get("errorMsg");
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // 결제 실패 로그
    if (orderId) {
      console.error("결제 실패:", { orderId, errorCode, errorMsg });
    }
  }, [orderId, errorCode, errorMsg]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container max-w-2xl">
          <div className="bg-card rounded-3xl shadow-soft p-8 md:p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <XCircle className="h-24 w-24 text-destructive" />
                <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl" />
              </div>
            </div>
            
            <h1 className="font-cute text-4xl md:text-5xl text-foreground mb-4">
              결제에 실패했어요 😢
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              {errorMsg || "결제 처리 중 오류가 발생했습니다."}
            </p>

            {orderId && (
              <div className="bg-muted/50 rounded-2xl p-4 mb-8">
                <p className="text-sm text-muted-foreground mb-2">주문 번호</p>
                <p className="font-mono text-lg font-semibold text-foreground break-all">
                  {orderId}
                </p>
              </div>
            )}

            {errorCode && (
              <div className="bg-muted/50 rounded-2xl p-4 mb-8">
                <p className="text-sm text-muted-foreground mb-2">에러 코드</p>
                <p className="font-mono text-sm text-destructive">
                  {errorCode}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="bear"
                size="lg"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                다시 시도하기
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <Home className="h-5 w-5" />
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentFail;

