import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { WeeklyBest } from "@/components/WeeklyBest";
import { ProductGrid } from "@/components/ProductGrid";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <WeeklyBest />
        <ProductGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
