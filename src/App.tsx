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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookieConsent from "./components/connect2/CookieConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<FreelancerAuth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
