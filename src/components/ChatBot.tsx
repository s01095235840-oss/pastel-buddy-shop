import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatBotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatBot = ({ open, onOpenChange }: ChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "안녕하세요! Timeline 상담봇입니다. 무엇을 도와드릴까요? 😊",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // 봇 응답을 약간의 딜레이 후 추가
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(input),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <SheetTitle className="font-cute text-xl">상담하기</SheetTitle>
          </div>
          <SheetDescription>무엇이든 물어보세요! 친절하게 도와드릴게요 😊</SheetDescription>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="rounded-full"
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

