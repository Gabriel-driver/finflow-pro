import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FinanceProvider } from "@/lib/finance-store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Goals from "./pages/Goals";
import CreditCards from "./pages/CreditCards";
import MonthlyPlan from "./pages/MonthlyPlan";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Budgets from "./pages/Budgets";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FinanceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/credit-cards" element={<ProtectedRoute><CreditCards /></ProtectedRoute>} />
            <Route path="/monthly-plan" element={<ProtectedRoute><MonthlyPlan /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
