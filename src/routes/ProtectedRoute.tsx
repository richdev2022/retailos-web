import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useBusinessStore } from '@/stores/business-store';

interface Props {
  children: ReactNode;
  /** When false, allow access even without an active business (used by onboarding). */
  requireBusiness?: boolean;
}

export function ProtectedRoute({ children, requireBusiness = true }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { businesses } = useBusinessStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireBusiness && businesses.length === 0) {
    return <Navigate to="/onboarding/business" replace />;
  }

  return <>{children}</>;
}
