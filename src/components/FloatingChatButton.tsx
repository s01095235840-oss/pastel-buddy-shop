import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { ChatBot } from "./ChatBot";

export const FloatingChatButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-black shadow-lg hover:scale-110 active:scale-95 transition-transform duration-300 flex items-center justify-center cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2"
        aria-label="상담하기"
      >
        <MessageCircle className="h-6 w-6" strokeWidth={2} />
      </button>
      <ChatBot open={open} onOpenChange={setOpen} />
    </>
  );
};

