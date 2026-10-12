import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import FreelancerAuth from "./pages/FreelancerAuth";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ClientAuth from "./pages/ClientAuth";
import ClientDashboard from "./pages/ClientDashboard";
import ClientOnboarding from "./pages/ClientOnboarding";
import ClientNewNeed from "./pages/ClientNewNeed";
import ClientEditNeed from "./pages/ClientEditNeed";
import ClientProfile from "./pages/ClientProfile";
import OpenNeeds from "./pages/OpenNeeds";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RolePage from "./pages/RolePage";
import BlogIndex from "./pages/BlogIndex";
import ModelPage from "./pages/ModelPage";
import FreelancesPage from "./pages/FreelancesPage";
import WhyKistone from "./pages/WhyKistone";
import ComparisonPage, { COMPARISON_PATH } from "./pages/ComparisonPage";
import BlogPost from "./pages/BlogPost";
import CookieConsent from "./components/platform/CookieConsent";

const queryClient = new QueryClient();

/** Les routes du site, partagées par le navigateur et le pré-rendu (scripts/prerender.mjs). */
export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/studio" element={<Studio />} />
    <Route path="/register" element={<FreelancerAuth />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/client" element={<ClientAuth />} />
    <Route path="/client/onboarding" element={<ClientOnboarding />} />
    <Route path="/client/dashboard" element={<ClientDashboard />} />
    <Route path="/besoin" element={<ClientNewNeed />} />
    <Route path="/client/new-need" element={<ClientNewNeed />} />
    <Route path="/client/edit-need/:id" element={<ClientEditNeed />} />
    <Route path="/client/profile" element={<ClientProfile />} />
    <Route path="/open-needs" element={<OpenNeeds />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/recruter/:slug" element={<RolePage />} />
    <Route path="/modeles/:slug" element={<ModelPage />} />
    <Route path="/freelances" element={<FreelancesPage />} />
    <Route path="/pourquoi-kistone" element={<WhyKistone />} />
    <Route path="/ressources" element={<BlogIndex />} />
    <Route path={COMPARISON_PATH} element={<ComparisonPage />} />
    <Route path="/ressources/:slug" element={<BlogPost />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

/** Fournisseurs communs ; le routeur est passé en enfant (navigateur ou pré-rendu). */
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {children}
    </TooltipProvider>
  </QueryClientProvider>
);

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <AppRoutes />
      <CookieConsent />
    </BrowserRouter>
  </AppProviders>
);

export default App;
