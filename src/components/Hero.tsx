import { Sparkles, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToWeeklyBest = () => {
    document.getElementById("weekly-best")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-24 dark:bg-gradient-to-br dark:from-sidebar dark:to-card">

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 animate-float">
          <Star className="h-6 w-6 text-primary/40" />
        </div>
        <div className="absolute top-20 right-20 animate-float" style={{ animationDelay: "1s" }}>
          <Sparkles className="h-8 w-8 text-secondary/50" />
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float" style={{ animationDelay: "0.5s" }}>
          <Crown className="h-5 w-5 text-accent/50" />
        </div>
        <div className="absolute top-1/3 right-10 animate-float" style={{ animationDelay: "1.5s" }}>
          <Star className="h-4 w-4 text-lavender" />
        </div>
        <div className="absolute bottom-10 right-1/3 animate-float" style={{ animationDelay: "2s" }}>
          <Sparkles className="h-6 w-6 text-mint" />
        </div>
      </div>

      <div className="container relative">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/60 backdrop-blur-sm rounded-full mb-6 animate-bounce-in">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              2026 갓생러들의 선택
            </span>
            <Sparkles className="h-4 w-4 text-secondary" />
          </div>

          {/* Main heading */}
          <h1 className="font-cute text-4xl md:text-6xl lg:text-7xl text-foreground mb-4 animate-slide-up">
            나만의{" "}
            <span className="text-primary relative">
              갓생
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 8 Q 25 0, 50 8 T 100 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary/30"
                />
              </svg>
            </span>
            을 시작해요
          </h1>

          {/* Subheading */}
          <p
            className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            시간관리부터 공부템까지, 당신의 갓생을 응원하는
            <br className="hidden sm:block" />
            귀여운 아이템들이 기다리고 있어요 💖
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button variant="bear" size="xl" onClick={scrollToProducts}>
              쇼핑 시작하기 🐻
            </Button>
            <Button variant="outline" size="xl" onClick={scrollToWeeklyBest}>
              베스트 보기 ✨
            </Button>
          </div>

          {/* Stats */}
          <div
            className="flex items-center gap-8 mt-12 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="text-center">
              <p className="font-cute text-2xl md:text-3xl text-primary">5,000+</p>
              <p className="text-sm text-muted-foreground">갓생러</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="font-cute text-2xl md:text-3xl text-secondary">4.9</p>
              <p className="text-sm text-muted-foreground">평점</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="font-cute text-2xl md:text-3xl text-accent">100%</p>
              <p className="text-sm text-muted-foreground">만족</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
