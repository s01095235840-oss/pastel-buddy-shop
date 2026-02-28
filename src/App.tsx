import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import MyPage from "./pages/MyPage";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";

const queryClient = new QueryClient();

// 내부 링크 스크롤 처리 컴포넌트
const SmoothScrollHandler = () => {
  const location = useLocation();

  useEffect(() => {
    // 해시가 있는 경우 해당 요소로 스크롤
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location]);

  useEffect(() => {
    // 모든 내부 링크에 대한 클릭 이벤트 처리
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href^='#']") as HTMLAnchorElement;
      
      if (anchor && anchor.hash) {
        e.preventDefault();
        const targetId = anchor.hash.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
          // URL 업데이트 (해시 변경)
          window.history.pushState(null, "", anchor.hash);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return null;
};

const AppContent = () => (
  <>
    <SmoothScrollHandler />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/fail" element={<PaymentFail />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <FloatingChatButton />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
