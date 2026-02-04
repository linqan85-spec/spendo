import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import SaaS from "./pages/SaaS";
import Vendors from "./pages/Vendors";
import Integration from "./pages/Integration";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminArchivedCompanies from "./pages/admin/AdminArchivedCompanies";
import AdminArchivedUsers from "./pages/admin/AdminArchivedUsers";
import AdminCompanyDetail from "./pages/admin/AdminCompanyDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/saas" element={<SaaS />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/settings" element={<Settings />} />
            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<AdminCompanies />} />
            <Route path="/admin/companies/:companyId" element={<AdminCompanyDetail />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/archived-companies" element={<AdminArchivedCompanies />} />
            <Route path="/admin/archived-users" element={<AdminArchivedUsers />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
