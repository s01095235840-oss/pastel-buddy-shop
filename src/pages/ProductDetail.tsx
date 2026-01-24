import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, Star, Truck, Shield, RotateCcw, CreditCard } from "lucide-react";
import { Product, formatPrice, products } from "@/data/products";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { requestTossPayment, generateOrderId } from "@/lib/tossPayment";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const addToCart = useCartStore((state) => state.addToCart);
  const [isLiked, setIsLiked] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      setIsLoading(true);
      // 로컬 제품 데이터에서 찾기 (DB 사용 안함)
      await new Promise(resolve => setTimeout(resolve, 300));
      const foundProduct = products.find(p => p.id === Number(id));
      setProduct(foundProduct || null);
      setIsLoading(false);
    };

    loadProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-cute text-2xl text-foreground mb-4">
              상품을 찾을 수 없어요 😢
            </h1>
            <Link to="/">
              <Button variant="bear">홈으로 돌아가기 🏠</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    // 수량만큼 장바구니에 추가
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast({
      title: "장바구니에 담았어요! 🛒",
      description: `${product.name} ${quantity}개를 추가했어요~`,
    });
  };

  const handlePurchase = async () => {
    if (!product) return;

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

    try {
      setIsProcessing(true);
      const totalAmount = product.price * quantity;
      const orderId = generateOrderId();
      const orderName = quantity > 1 ? `${product.name} 외 ${quantity - 1}개` : product.name;

      // 주문 정보를 sessionStorage에 저장 (결제 성공 시 사용)
      const orderData = {
        orderId,
        userId: user.id,
        totalAmount,
        items: [{
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          quantity: quantity,
        }],
        orderName,
      };
      sessionStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));

      await requestTossPayment({
        amount: totalAmount,
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">뒤로가기</span>
          </Link>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Image */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden bg-muted shadow-card">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Like button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-12 w-12 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card shadow-soft"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isLiked ? "fill-primary text-primary" : "text-foreground"
                  }`}
                />
              </Button>
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {/* Category & Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-secondary/50 rounded-full text-xs font-medium text-secondary-foreground">
                  {product.category}
                </span>
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Product ID */}
              <p className="text-sm text-muted-foreground mb-2">
                상품 ID: {id}
              </p>

              {/* Name */}
              <h1 className="font-cute text-3xl md:text-4xl text-foreground mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(128 리뷰)</span>
              </div>

              {/* Price */}
              <p className="font-cute text-3xl text-primary mb-6">
                {formatPrice(product.price)}
              </p>

              {/* Description */}
              <p className="text-foreground leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-foreground">수량</span>
                <div className="flex items-center gap-3 bg-muted rounded-full px-4 py-2">
                  <button
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors disabled:opacity-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <button
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 mb-8">
                <Button
                  variant="outline"
                  size="xl"
                  className="flex-1"
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  장바구니 담기 🐻
                </Button>
                <Button
                  variant="bear"
                  size="xl"
                  className="flex-1"
                  onClick={handlePurchase}
                  disabled={isProcessing}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {isProcessing ? "처리중..." : "구매하기 💳"}
                </Button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-2xl">
                <div className="flex flex-col items-center text-center">
                  <Truck className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">무료배송</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Shield className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">안전결제</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <RotateCcw className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">7일 교환</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
