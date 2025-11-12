import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GeminiLiveChat from "./pages/GeminiLiveChat";
import ProductPurchase from "./pages/ProductPurchase";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import ProductInsights from "./pages/ProductInsights";
import GenerateProductImages from "./pages/GenerateProductImages";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/purchase" element={<ProductPurchase />} />
          <Route path="/home" element={<Index />} />
          <Route path="/gemini-live" element={<GeminiLiveChat />} />
          <Route path="/voice-review" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:handle" element={<ProductDetail />} />
          <Route path="/insights/:handle" element={<ProductInsights />} />
          <Route path="/generate-images" element={<GenerateProductImages />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
