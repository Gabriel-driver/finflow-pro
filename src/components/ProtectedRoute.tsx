import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // Se não tem token, redirecionar para login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // Se é admin only, verificar se user id é 1
  if (adminOnly) {
    try {
      const user = JSON.parse(userStr);
      if (user.id !== 1) {
        return <Navigate to="/" replace />;
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
