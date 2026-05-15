import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface RoleRouteProps {
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * Route guard that restricts access based on profile_type.
 * Renders children (via Outlet) only if the authenticated user's
 * profile_type is included in allowedRoles.
 *
 * Usage in App.tsx:
 *   <Route element={<RoleRoute allowedRoles={["admin"]} />}>
 *     <Route path="/admin" element={<AdminDashboard />} />
 *   </Route>
 */
const RoleRoute = ({ allowedRoles, redirectTo = "/" }: RoleRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userRoles = Array.isArray(profile?.profile_type) 
    ? profile.profile_type 
    : [profile?.profile_type].filter(Boolean) as string[];

  if (!profile || !allowedRoles.some(role => userRoles.includes(role))) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
