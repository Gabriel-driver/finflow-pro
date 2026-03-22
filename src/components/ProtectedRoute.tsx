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

  // Verificar expiração do token JWT
  const isTokenExpired = () => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return true;
      }
    } catch {
      return true;
    }
    return false;
  };

  if (isTokenExpired()) {
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
