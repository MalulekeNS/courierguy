import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Props {
  children: ReactNode;
  requireRole?: AppRole | AppRole[];
}

const ProtectedRoute = ({ children, requireRole }: Props) => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requireRole) {
    const required = Array.isArray(requireRole) ? requireRole : [requireRole];
    const ok = required.some((r) => roles.includes(r));
    if (!ok) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
