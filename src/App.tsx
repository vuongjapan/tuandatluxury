import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";

// Lazy load all non-homepage routes
const MemberAuth = lazy(() => import("./pages/MemberAuth"));
const RoomDetail = lazy(() => import("./pages/RoomDetail"));
const Booking = lazy(() => import("./pages/Booking"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const Dining = lazy(() => import("./pages/Dining"));
const Services = lazy(() => import("./pages/Services"));
const FoodOrder = lazy(() => import("./pages/FoodOrder"));
const FoodInvoice = lazy(() => import("./pages/FoodInvoice"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Cuisine = lazy(() => import("./pages/Cuisine"));
const Seafood = lazy(() => import("./pages/Seafood"));
const Terms = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Đang tải...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/room/:id" element={<RoomDetail />} />
                  <Route path="/booking" element={<Booking />} />
                  <Route path="/dining" element={<Dining />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/food-order" element={<FoodOrder />} />
                  <Route path="/food-invoice/:foodOrderId" element={<FoodInvoice />} />
                  <Route path="/invoice/:bookingCode" element={<InvoicePage />} />
                  <Route path="/member" element={<MemberAuth />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
