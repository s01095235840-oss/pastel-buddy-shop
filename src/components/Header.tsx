import { ShoppingBag, Sparkles, User, LogOut, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartSheet } from "./CartSheet";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Header = () => {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('로그아웃되었습니다');
    navigate('/');
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      // 같은 페이지에 있으면 맨 위로 스크롤
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", "/");
    }
    // 다른 페이지에 있으면 기본 링크 동작 (navigate to "/")
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    const targetId = hash.substring(1);
    
    if (location.pathname === "/") {
      // 같은 페이지에 있으면 스크롤만
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", hash);
      }
    } else {
      // 다른 페이지에 있으면 먼저 홈으로 이동 후 스크롤
      navigate("/");
      // 페이지 이동 후 스크롤 (약간의 딜레이 필요)
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", hash);
        }
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="relative">
            <Sparkles className="h-6 w-6 text-primary animate-sparkle" />
          </div>
          <span className="font-cute text-2xl text-foreground group-hover:text-primary transition-colors">
            Timeline
          </span>
        </a>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a 
            href="/"
            onClick={handleHomeClick}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            홈
          </a>
          <a 
            href="/#products"
            onClick={(e) => handleNavClick(e, "#products")}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            전체상품
          </a>
          <a 
            href="/#weekly-best"
            onClick={(e) => handleNavClick(e, "#weekly-best")}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            베스트
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Auth Buttons */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">내 계정</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/mypage')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>마이페이지</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="hidden sm:flex"
              >
                <LogIn className="mr-2 h-4 w-4" />
                로그인
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 hidden sm:flex"
              >
                회원가입
              </Button>
            </>
          )}

          {/* Cart */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold animate-bounce-in">
                    {totalItems}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="font-cute text-xl flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  장바구니
                </SheetTitle>
              </SheetHeader>
              <CartSheet />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
