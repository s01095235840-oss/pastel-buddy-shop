import { Product, products } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { ProductSkeleton } from "./ProductSkeleton";

export const WeeklyBest = () => {
  const [weeklyBestProducts, setWeeklyBestProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      // 로컬 제품 데이터 로딩 (DB 사용 안함)
      await new Promise(resolve => setTimeout(resolve, 300));
      // 상위 4개 상품을 Weekly Best로 표시
      setWeeklyBestProducts(products.slice(0, 4));
      setIsLoading(false);
    };

    loadProducts();
  }, []);

  return (
    <section id="weekly-best" className="py-12 md:py-16 bg-muted/30">
      <div className="container">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-6 px-4 md:px-0">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="font-cute text-2xl md:text-3xl text-foreground">
            Weekly Best
          </h2>
        </div>

        {/* Product cards - 가로 스크롤 */}
        <div className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-4 md:grid md:grid-cols-4 md:gap-6 w-max md:w-full">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="flex-shrink-0 w-[280px] snap-start md:w-auto md:snap-none"
                  >
                    <ProductSkeleton index={index} />
                  </div>
                ))
              : weeklyBestProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[280px] snap-start md:w-auto md:snap-none"
                  >
                    <ProductCard product={product} index={index} />
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};

