import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatBot } from "./ChatBot";

export const FloatingChatButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 채팅 버튼 - 열려있을 때는 숨김 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-[#FEE500] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FEE500] text-black shadow-2xl hover:shadow-[#FEE500]/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border-2 border-black/10 focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2"
          aria-label="상담하기"
        >
          <MessageCircle className="h-7 w-7" strokeWidth={2.5} />
        </button>
      )}
      <ChatBot open={open} onOpenChange={setOpen} />
    </>
  );
};

