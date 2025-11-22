import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import PendingApproval from '@/pages/PendingApproval';
import Auth from '@/pages/Auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isPendingApproval, loading: roleLoading } = useUserRole();

  // Only block if we definitively know user is not authenticated
  if (!authLoading && !user) {
    return <Auth />;
  }

  // Only block if we definitively know user is pending approval
  if (!authLoading && !roleLoading && user && isPendingApproval()) {
    return <PendingApproval />;
  }

  // Always render children - no loading screen that causes flicker
  return <>{children}</>;
};