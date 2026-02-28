import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProducts } from "@/lib/api";
import { getChatResponse, checkUserLogin } from "@/lib/openai";
import { useCartStore } from "@/stores/cartStore";
import { Product, formatPrice } from "@/data/products";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  products?: Product[]; // 검색 결과 상품 목록
}

interface ChatBotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatBot = ({ open, onOpenChange }: ChatBotProps) => {
  const { user } = useAuth();
  const addToCart = useCartStore((state) => state.addToCart);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "안녕하세요! Timeline 상담봇입니다. 무엇을 도와드릴까요? 😊",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 챗봇 시작 시 로그인 정보 확인
  useEffect(() => {
    checkUserLogin();
  }, []);

  // Supabase에서 이전 메시지 불러오기
  useEffect(() => {
    if (open) {
      loadMessages();
    }
  }, [open, user]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        // 테이블이 없거나 권한 오류인 경우 기본 메시지만 표시
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // 테이블이 없는 경우
          setMessages([
            {
              id: "1",
              text: "안녕하세요! Timeline 상담봇입니다. 무엇을 도와드릴까요? 😊",
              sender: "bot",
              timestamp: new Date(),
            },
          ]);
        }
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.message,
          sender: msg.sender as "user" | "bot",
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      } else {
        // 기본 환영 메시지만 표시
        setMessages([
          {
            id: "1",
            text: "안녕하세요! Timeline 상담봇입니다. 무엇을 도와드릴까요? 😊",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('메시지 로드 중 오류:', error);
      // 오류 발생 시 기본 메시지만 표시
      setMessages([
        {
          id: "1",
          text: "안녕하세요! Timeline 상담봇입니다. 무엇을 도와드릴까요? 😊",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // 인사말
    if (lowerMessage.includes("안녕") || lowerMessage.includes("하이") || lowerMessage.includes("헬로")) {
      return "안녕하세요! 무엇을 도와드릴까요? 😊";
    }

    // 배송 관련
    if (lowerMessage.includes("배송") || lowerMessage.includes("배달") || lowerMessage.includes("언제")) {
      return "배송은 평일 기준 주문 후 2-3일 내 배송됩니다. 무료배송 서비스를 제공하고 있어요! 🚚";
    }

    // 환불/교환 관련
    if (lowerMessage.includes("환불") || lowerMessage.includes("반품") || lowerMessage.includes("교환")) {
      return "제품 수령 후 7일 이내에 교환이나 환불이 가능합니다. 자세한 내용은 고객센터로 문의해주세요! 💝";
    }

    // 상품 관련
    if (lowerMessage.includes("상품") || lowerMessage.includes("제품") || lowerMessage.includes("어떤")) {
      return "갓생템, 플래너, 스터디용 타이머, 간식 키트 등 다양한 상품을 준비했어요! 상품 목록에서 확인해보세요! ✨";
    }

    // 가격 관련
    if (lowerMessage.includes("가격") || lowerMessage.includes("비용") || lowerMessage.includes("얼마")) {
      return "각 상품 페이지에서 정확한 가격을 확인하실 수 있어요. 다양한 가격대의 상품을 준비했습니다! 💰";
    }

    // 주문 관련
    if (lowerMessage.includes("주문") || lowerMessage.includes("구매") || lowerMessage.includes("결제")) {
      return "장바구니에 상품을 담으신 후 주문하시면 됩니다. 안전한 결제 시스템을 사용하고 있어요! 🛒";
    }

    // 감사 인사
    if (lowerMessage.includes("고마워") || lowerMessage.includes("감사") || lowerMessage.includes("땡큐")) {
      return "천만에요! 다른 궁금한 점이 있으면 언제든 물어보세요! 💖";
    }

    // 기본 응답
    return "죄송해요, 더 구체적으로 질문해주시면 정확한 답변을 드릴 수 있어요! 😅 궁금한 점이 있으면 언제든 물어보세요!";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput("");
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Supabase에 사용자 메시지 저장 (오류가 있어도 계속 진행)
    try {
      const { error: userError } = await supabase
        .from('chat_messages')
        .insert({
          message: userMessageText,
          sender: 'user',
          user_id: user?.id || null,
        });

      if (userError) {
        // 테이블이 없거나 권한 오류인 경우 무시하고 계속 진행
        if (userError.code !== 'PGRST116' && userError.code !== '42P01') {
          console.error('사용자 메시지 저장 오류:', userError);
        }
      }
    } catch (error) {
      // 오류가 있어도 계속 진행
      console.error('사용자 메시지 저장 중 오류:', error);
    }

    // 봇 응답 생성
    let botResponseText: string;
    
    // "테스트" 입력 시 상품 목록 가져오기
    if (userMessageText.toLowerCase().trim() === "테스트") {
      try {
        const products = await fetchProducts();
        if (products && products.length > 0) {
          const productNames = products.map(p => p.name).join(", ");
          botResponseText = `현재 판매 중인 상품 목록입니다:\n\n${productNames}\n\n총 ${products.length}개의 상품이 있습니다! 🛍️`;
        } else {
          botResponseText = "현재 판매 중인 상품이 없습니다. 😢";
        }
      } catch (error) {
        console.error('상품 목록 가져오기 오류:', error);
        botResponseText = "상품 목록을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 😅";
      }
    } else {
      // OpenAI를 사용하여 응답 생성
      try {
        // 이전 대화 내용을 OpenAI 형식으로 변환
        const conversationHistory = messages
          .slice(-10) // 최근 10개 메시지만 사용 (컨텍스트 제한)
          .map((msg) => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.text,
          }));
        
        // 현재 사용자 메시지 추가
        conversationHistory.push({
          role: 'user',
          content: userMessageText,
        });

        // OpenAI API 호출 (Function Calling 지원)
        const response = await getChatResponse(conversationHistory, user?.id);
        botResponseText = response.text;
        
        // 검색 결과가 있으면 상품 정보 추출
        let foundProducts: Product[] = [];
        if (response.products && response.products.length > 0) {
          foundProducts = response.products;
        }
        
        // 약간의 딜레이 후 봇 응답 표시
        setTimeout(async () => {
          const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: botResponseText,
            sender: "bot",
            timestamp: new Date(),
            products: foundProducts.length > 0 ? foundProducts : undefined,
          };
          setMessages((prev) => [...prev, botResponse]);
          
          // Supabase에 봇 응답 저장 (오류가 있어도 계속 진행)
          try {
            const { error: botError } = await supabase
              .from('chat_messages')
              .insert({
                message: botResponseText,
                sender: 'bot',
                user_id: user?.id || null,
              });

            if (botError) {
              // 테이블이 없거나 권한 오류인 경우 무시하고 계속 진행
              if (botError.code !== 'PGRST116' && botError.code !== '42P01') {
                console.error('봇 메시지 저장 오류:', botError);
              }
            }
          } catch (error) {
            // 오류가 있어도 계속 진행
            console.error('봇 메시지 저장 중 오류:', error);
          }
          
          setIsLoading(false);
        }, 500);
        return; // 조기 반환
      } catch (error) {
        console.error('OpenAI 응답 생성 오류:', error);
        // OpenAI 오류 시 기본 응답 사용
        botResponseText = getBotResponse(userMessageText);
      }
    }
    
    // 약간의 딜레이 후 봇 응답 표시 (기본 응답)
    setTimeout(async () => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);

      // Supabase에 봇 응답 저장 (오류가 있어도 계속 진행)
      try {
        const { error: botError } = await supabase
          .from('chat_messages')
          .insert({
            message: botResponseText,
            sender: 'bot',
            user_id: user?.id || null,
          });

        if (botError) {
          // 테이블이 없거나 권한 오류인 경우 무시하고 계속 진행
          if (botError.code !== 'PGRST116' && botError.code !== '42P01') {
            console.error('봇 메시지 저장 오류:', botError);
          }
        }
      } catch (error) {
        // 오류가 있어도 계속 진행
        console.error('봇 메시지 저장 중 오류:', error);
      }
      
      setIsLoading(false);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out ${
        open 
          ? "w-[90vw] sm:w-[380px] h-[70vh] sm:h-[600px] opacity-100 scale-100" 
          : "w-0 h-0 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      {open && (
        <div className="w-full h-full bg-card border-2 border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-bounce-in">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-cute text-lg font-semibold text-foreground">상담하기</h3>
                <p className="text-xs text-muted-foreground">무엇이든 물어보세요! 😊</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"} animate-slide-up gap-2`}
              >
                {/* 텍스트 메시지 */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                
                {/* 상품 카드 (검색 결과) */}
                {message.sender === "bot" && message.products && message.products.length > 0 && (
                  <div className="w-full max-w-[85%] grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {message.products.map((product, index) => (
                      <ProductCardInChat key={product.id} product={product} index={index + 1} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-background p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "응답 중..." : "메시지를 입력하세요..."}
                className="flex-1 rounded-full border-2 focus-visible:ring-2 focus-visible:ring-primary"
                autoFocus={open}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 shadow-lg hover:scale-110 active:scale-95 transition-transform"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 챗봇용 상품 카드 컴포넌트
interface ProductCardInChatProps {
  product: Product & { stock?: number };
  index: number;
}

const ProductCardInChat = ({ product, index }: ProductCardInChatProps) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const stock = (product as any).stock ?? 0;

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`${product.name}을(를) 장바구니에 담았어요! 🛒`);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col">
      {/* 번호 배지 */}
      <div className="relative">
        <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          {index}
        </div>
        
        {/* 상품 이미지 */}
        {product.image_url ? (
          <div className="w-full h-40 sm:h-48 bg-muted overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        ) : (
          <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">이미지 없음</span>
          </div>
        )}
      </div>
      
      {/* 상품 정보 */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* 상품 이름 */}
        <h4 className="font-bold text-base text-foreground line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h4>
        
        {/* 가격 및 재고 */}
        <div className="flex flex-col gap-2">
          {/* 가격 */}
          <p className="text-primary font-bold text-lg">
            {formatPrice(product.price)}
          </p>
          
          {/* 재고 수량 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">재고:</span>
            <span className={`text-sm font-semibold ${
              stock > 10 
                ? 'text-green-600 dark:text-green-400' 
                : stock > 0 
                ? 'text-orange-600 dark:text-orange-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {stock > 0 ? `${stock.toLocaleString()}개` : '품절'}
            </span>
          </div>
        </div>
        
        {/* 장바구니 담기 버튼 */}
        <Button
          onClick={handleAddToCart}
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-9 mt-auto"
          disabled={stock === 0}
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          {stock > 0 ? '장바구니 담기' : '품절'}
        </Button>
      </div>
    </div>
  );
};

