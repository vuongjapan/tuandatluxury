import { lazy, Suspense, useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
const Promotions = lazy(() => import("./pages/Promotions"));
const Offers = lazy(() => import("./pages/Offers"));
const OfferDetail = lazy(() => import("./pages/OfferDetail"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Discovery = lazy(() => import("./pages/Discovery"));
const About = lazy(() => import("./pages/About"));
const Transport = lazy(() => import("./pages/Transport"));
const Live = lazy(() => import("./pages/Live"));

// Auto-apply voucher code redirect
const ApplyVoucher = lazy(() => import("./pages/ApplyVoucher"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s – keep data fresh
      gcTime: 5 * 60 * 1000, // garbage collect after 5 min
      retry: 1,
      refetchOnWindowFocus: true, // refetch when tab regains focus
    },
  },
});

const ScrollToHash = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Small delay to ensure DOM is ready (lazy-loaded sections)
      const timer = setTimeout(() => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          const headerHeight = document.querySelector('header')?.getBoundingClientRect().height || 80;
          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]);
  return null;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Đang tải...</p>
    </div>
  </div>
);

const App = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToHash />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/room/:id" element={<RoomDetail />} />
                    <Route path="/booking" element={<Booking />} />
                    <Route path="/dining" element={<Dining />} />
                    <Route path="/cuisine" element={<Cuisine />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/food-order" element={<FoodOrder />} />
                    <Route path="/food-invoice/:foodOrderId" element={<FoodInvoice />} />
                    <Route path="/invoice/:bookingCode" element={<InvoicePage />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/seafood" element={<Seafood />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/promotions" element={<Offers />} />
                    <Route path="/uu-dai" element={<Offers />} />
                    <Route path="/uu-dai/:slug" element={<OfferDetail />} />
                    <Route path="/khuyen-mai" element={<Offers />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/danh-gia" element={<Reviews />} />
                    <Route path="/discovery" element={<Discovery />} />
                    <Route path="/kham-pha" element={<Discovery />} />
                    <Route path="/gioi-thieu" element={<About />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/member" element={<MemberAuth />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/apply" element={<ApplyVoucher />} />
                    <Route path="/dat-xe" element={<Transport />} />
                    <Route path="/transport" element={<Transport />} />
                    <Route path="/live" element={<Live />} />
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
};

export default App;
