import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PAGE_ROUTES } from "../../constant/routes";
import { useBoundStore } from "../../store/BoundedStore";

interface ProtectedRouteProps {
  children?: ReactNode;
  allowedRoles: string[];
  redirectPath?: string;
}

const normalizeRole = (role?: string | null): string | null => {
  if (!role) {
    return null;
  }

  return role.trim().toLowerCase();
};

export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectPath = "/",
}: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);
  const userRole = useBoundStore((state) => state.userData?.role.name ?? null);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={PAGE_ROUTES.Login}
        state={{ from: location }}
        replace
      />
    );
  }

  const normalizedRole = normalizeRole(userRole);
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.trim().toLowerCase(),
  );

  if (
    normalizedAllowedRoles.length > 0 &&
    (!normalizedRole || !normalizedAllowedRoles.includes(normalizedRole))
  ) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
