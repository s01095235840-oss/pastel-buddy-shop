import { Minus, Plus, Trash2, ShoppingBag, Sparkles, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/data/products";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createOrder } from "@/lib/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestTossPayment, generateOrderId } from "@/lib/tossPayment";

export const CartSheet = () => {
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const totalPrice = getTotalPrice();

  const handleCheckout = async () => {
    // 로그인 확인
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "주문하시려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // 장바구니가 비어있는지 확인
    if (items.length === 0) {
      toast({
        title: "장바구니가 비어있습니다",
        description: "상품을 담아주세요!",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // 주문 아이템 데이터 준비
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
      }));

      // 주문 생성
      await createOrder(user.id, totalPrice, orderItems);

      // 성공 메시지
      toast({
        title: "주문 완료! 🎉",
        description: "감사합니다! 마이페이지에서 주문 내역을 확인하실 수 있습니다.",
      });

      // 장바구니 비우기
      clearCart();

      // 마이페이지로 이동 (선택사항)
      setTimeout(() => {
        navigate("/mypage");
      }, 1500);
    } catch (error) {
      console.error("주문 생성 오류:", error);
      toast({
        title: "주문 실패",
        description: "주문 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    // 로그인 확인
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "구매하시려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // 장바구니가 비어있는지 확인
    if (items.length === 0) {
      toast({
        title: "장바구니가 비어있습니다",
        description: "상품을 담아주세요!",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const orderId = generateOrderId();
      const orderName = items.length === 1 
        ? items[0].product.name 
        : `${items[0].product.name} 외 ${items.length - 1}개`;

      // 주문 정보를 sessionStorage에 저장 (결제 성공 시 사용)
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
      }));

      const orderData = {
        orderId,
        userId: user.id,
        totalAmount: totalPrice,
        items: orderItems,
        orderName,
      };
      sessionStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));

      await requestTossPayment({
        amount: totalPrice,
        orderId,
        orderName,
        customerName: user.email?.split('@')[0] || '고객',
        customerEmail: user.email,
        successUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
        failUrl: `${window.location.origin}/payment/fail?orderId=${orderId}`,
      });
    } catch (error: any) {
      console.error('결제 오류:', error);
      toast({
        title: "결제 실패",
        description: error?.message || "결제 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <ShoppingBag className="h-20 w-20 text-muted-foreground/30" />
          <Sparkles className="h-8 w-8 text-primary absolute -top-2 -right-2 animate-sparkle" />
        </div>
        <p className="text-muted-foreground font-cute text-lg">
          장바구니가 비어있어요~
        </p>
        <p className="text-sm text-muted-foreground">
          예쁜 아이템들을 담아보세요! 💖
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto py-4 space-y-4">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex gap-3 p-3 bg-muted/50 rounded-2xl animate-fade-in"
          >
            <img
              src={item.product.image_url}
              alt={item.product.name}
              className="w-20 h-20 object-cover rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-cute text-sm truncate">{item.product.name}</h4>
              <p className="text-primary font-semibold text-sm mt-1">
                {formatPrice(item.product.price)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => removeFromCart(item.product.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">총 금액</span>
          <span className="font-cute text-xl text-primary">
            {formatPrice(totalPrice)}
          </span>
        </div>
        <Button
          variant="bear"
          size="lg"
          className="w-full"
          onClick={handlePurchase}
          disabled={isProcessing}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          {isProcessing ? "처리중..." : "구매하기 💳"}
        </Button>
      </div>
    </div>
  );
};
