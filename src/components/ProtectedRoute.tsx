import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken, getUser, clearAuth } from "@/lib/finance-store";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  const isTokenExpired = () => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        clearAuth();
        return true;
      }
    } catch {
      clearAuth();
      return true;
    }
    return false;
  };

  if (isTokenExpired()) {
    return <Navigate to="/login" replace />;
  }


  // Se é admin only, verificar se user id é 1
  if (adminOnly) {
    if (!user || user.id !== 1) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
