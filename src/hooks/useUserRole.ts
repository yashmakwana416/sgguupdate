import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserRole {
  id: string;
  user_id: string;
  role: 'superadmin' | 'distributor';
  created_at?: string;
  updated_at?: string;
}

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      console.log('[useUserRole] Fetched role from database:', data?.role);
      
      // If no role found, user is pending approval (null)
      // Only set a role if one exists in the database
      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null); // No role on error means pending approval
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => false; // No admin role anymore
  const isDistributor = () => userRole === 'distributor';
  const isSuperAdmin = () => {
    const result = userRole === 'superadmin' || user?.email === 'smitmodi416@gmail.com';
    console.log('[useUserRole] isSuperAdmin() check:', { userRole, email: user?.email, result });
    return result;
  };
  const isViewer = () => false; // No viewer role anymore

  const isPendingApproval = () => userRole === null && user && !isSuperAdmin();

  const hasAccessToPage = (pagePath: string): boolean => {
    console.log('[useUserRole] hasAccessToPage() called for:', pagePath);
    
    // Superadmin has access to everything
    if (isSuperAdmin()) {
      console.log('[useUserRole] hasAccessToPage() -> true (superadmin)');
      return true;
    }

    // If user is pending approval, no access to any pages
    if (isPendingApproval()) return false;

    // Define superadmin-only pages
    const superAdminPages = [
      '/inventory',
      '/operations',
      '/packaging',
      '/distributors-data',
      '/admin-panel'
    ];

    // Define page access rules for distributors
    const distributorPages = [
      '/',
      '/dashboard',
      '/parties',
      '/products', 
      '/create-invoice',
      '/invoices',
      '/returns',
      '/settings'
    ];

    // Check superadmin pages (fallback if isSuperAdmin() doesn't catch it)
    if (superAdminPages.includes(pagePath)) {
      const result = isSuperAdmin();
      console.log('[useUserRole] hasAccessToPage() -> superadmin page check:', result);
      return result;
    }

    // Distributor has access to specific pages only
    if (isDistributor()) {
      const result = distributorPages.includes(pagePath);
      console.log('[useUserRole] hasAccessToPage() -> distributor page check:', result);
      return result;
    }

    // Default: no access
    console.log('[useUserRole] hasAccessToPage() -> false (no access)');
    return false;
  };

  return {
    userRole,
    loading,
    isAdmin,
    isDistributor,
    isSuperAdmin,
    isViewer,
    isPendingApproval,
    hasAccessToPage,
    refetch: fetchUserRole
  };
};