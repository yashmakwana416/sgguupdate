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
  const isSuperAdmin = () => userRole === 'superadmin' || user?.email === 'smitmodi416@gmail.com';
  const isViewer = () => false; // No viewer role anymore

  const isPendingApproval = () => userRole === null && user && !isSuperAdmin();

  const hasAccessToPage = (pagePath: string): boolean => {
    // Superadmin has access to everything
    if (isSuperAdmin()) return true;

    // If user is pending approval, no access to any pages
    if (isPendingApproval()) return false;

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

    // Distributor has access to specific pages only
    if (isDistributor()) {
      return distributorPages.includes(pagePath);
    }

    // Default: no access
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