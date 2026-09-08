import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FreelancerAuth from "./pages/FreelancerAuth";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import BlogEditor from "./pages/BlogEditor";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ClientAuth from "./pages/ClientAuth";
import ClientDashboard from "./pages/ClientDashboard";
import ClientNewNeed from "./pages/ClientNewNeed";
import ClientEditNeed from "./pages/ClientEditNeed";
import ClientProfile from "./pages/ClientProfile";
import OpenNeeds from "./pages/OpenNeeds";
import FreelanceTimesheets from "./pages/FreelanceTimesheets";
import ClientTimesheets from "./pages/ClientTimesheets";
import NotFound from "./pages/NotFound";
import Studio from "./pages/Studio";
import PourquoiKistone from "./pages/PourquoiKistone";
import ProductTour from "./pages/ProductTour";
import GotamProductTour from "./pages/GotamProductTour";
import Realisations from "./pages/Realisations";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Pricing from "./pages/Pricing";
import CookieConsent from "./components/connect2/CookieConsent";
import Assistant from "./pages/Assistant";
import AssistantWidget from "./components/assistant/AssistantWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route path="/talent" element={<Index />} />
          <Route path="/register" element={<FreelancerAuth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/new" element={<BlogEditor />} />
          <Route path="/blog/edit/:id" element={<BlogEditor />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/client" element={<ClientAuth />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/new-need" element={<ClientNewNeed />} />
          <Route path="/client/edit-need/:id" element={<ClientEditNeed />} />
          <Route path="/client/profile" element={<ClientProfile />} />
          <Route path="/client/timesheets" element={<ClientTimesheets />} />
          <Route path="/open-needs" element={<OpenNeeds />} />
          <Route path="/timesheets" element={<FreelanceTimesheets />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/pourquoi-kistone" element={<PourquoiKistone />} />
          <Route path="/realisations" element={<Realisations />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/product-tour/gotam" element={<GotamProductTour />} />
          <Route path="/product-tour/:slug" element={<ProductTour />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/assistant/:threadId" element={<Assistant />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
        <AssistantWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
