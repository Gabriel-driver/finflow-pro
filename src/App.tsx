import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
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
import RecurringTransactions from "./pages/RecurringTransactions";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ImportPage from "./pages/Import";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
  },
});

const router = createBrowserRouter(
  [
    { path: '/login', element: <Login /> },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Accounts />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/accounts',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/transactions',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <RecurringTransactions />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/recurring',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/categories',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/goals',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <CreditCards />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/credit-cards',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <MonthlyPlan />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/monthly-plan',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/notifications',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/settings',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/reports',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <Budgets />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/budgets',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute adminOnly>
            <Admin />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/admin',
    },
    {
      element: (
        <FinanceProvider>
          <ProtectedRoute>
            <ImportPage />
          </ProtectedRoute>
        </FinanceProvider>
      ),
      path: '/import',
    },
    { path: '*', element: <NotFound /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
