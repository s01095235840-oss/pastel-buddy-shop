import { Product, products } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { ProductSkeleton } from "./ProductSkeleton";
import { Sparkles, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";

export const ProductGrid = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // 로컬 제품 데이터 로딩 (DB 사용 안함)
    const loadProducts = async () => {
      setIsLoading(true);
      // 로딩 효과를 위한 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadedProducts(products);
      setIsLoading(false);
    };

    loadProducts();
  }, []);

  // 검색어로 상품 필터링
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return loadedProducts;
    }
    return loadedProducts.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [loadedProducts, searchQuery]);

  return (
    <section id="products" className="py-16 md:py-24">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary animate-sparkle" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Best Items
            </span>
            <Sparkles className="h-5 w-5 text-primary animate-sparkle" />
          </div>
          <h2 className="font-cute text-3xl md:text-4xl text-foreground">
            인기 갓생템 🔥
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            갓생러들이 가장 사랑하는 아이템들을 모았어요!
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="상품 이름으로 검색하기..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base rounded-full border-2 focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? // 로딩 중일 때 스켈레톤 카드 표시 (8개)
              Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={`skeleton-${index}`} index={index} />
              ))
            : // 검색어로 필터링된 상품 카드 표시
              filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground font-cute text-lg">
                    검색 결과가 없어요 😢
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    다른 검색어를 입력해보세요!
                  </p>
                </div>
              )}
        </div>
      </div>
    </section>
  );
};
