import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ClientNewNeed from "./pages/ClientNewNeed";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RolePage from "./pages/RolePage";
import BlogIndex from "./pages/BlogIndex";
import ModelPage from "./pages/ModelPage";
import FreelancesPage from "./pages/FreelancesPage";
import WhyKistone from "./pages/WhyKistone";
import ComparisonPage, { COMPARISON_PATH } from "./pages/ComparisonPage";
import SessionGuard from "./components/SessionGuard";
import { LEGACY_COMPARISON_SLUG } from "./content/comparison";
import BlogPost from "./pages/BlogPost";
import CookieConsent from "./components/platform/CookieConsent";
import CrispChat from "./components/CrispChat";

// Espaces connectés (freelance, client, admin) : chargés à la demande, pour que les pages
// publiques ne téléchargent pas tout le code de l'application.
const FreelancerAuth = lazy(() => import("./pages/FreelancerAuth"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ClientAuth = lazy(() => import("./pages/ClientAuth"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientOnboarding = lazy(() => import("./pages/ClientOnboarding"));
const ClientEditNeed = lazy(() => import("./pages/ClientEditNeed"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const OpenNeeds = lazy(() => import("./pages/OpenNeeds"));

const queryClient = new QueryClient();

/** Les routes du site, partagées par le navigateur et le pré-rendu (scripts/prerender.mjs). */
export const AppRoutes = () => (
  <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
  <Routes>
    <Route path="/" element={<Home />} />
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
    <Route path={`/ressources/${LEGACY_COMPARISON_SLUG}`} element={<Navigate to={COMPARISON_PATH} replace />} />
    <Route path="/ressources/:slug" element={<BlogPost />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
  </Suspense>
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
      <SessionGuard />
      <AppRoutes />
      <CookieConsent />
      <CrispChat />
    </BrowserRouter>
  </AppProviders>
);

export default App;
