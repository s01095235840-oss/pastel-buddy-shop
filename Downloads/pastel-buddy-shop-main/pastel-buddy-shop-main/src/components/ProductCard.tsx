import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Product, formatPrice } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard = ({ product, index }: ProductCardProps) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const [isLiked, setIsLiked] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "장바구니에 담았어요! 🛒",
      description: `${product.name}을(를) 추가했어요~`,
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (!isLiked) {
      toast({
        title: "찜했어요! 💕",
        description: `${product.name}을(를) 찜 목록에 추가했어요~`,
      });
    }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-500 hover:-translate-y-2 dark:bg-sidebar dark:shadow-none">

        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Overlay buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card"
              onClick={handleLike}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isLiked ? "fill-primary text-primary" : "text-foreground"
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-card/80 backdrop-blur-sm rounded-full hover:bg-card"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </div>
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-card/80 backdrop-blur-sm rounded-full text-xs font-medium text-foreground">
              {product.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Name */}
          <h3 className="font-cute text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Price */}
          <p className="mt-2 font-bold text-primary text-lg">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
};
