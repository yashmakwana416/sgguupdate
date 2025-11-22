import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRole {
  id: string;
  user_id: string;
  role: 'superadmin' | 'distributor';
  created_at?: string;
  updated_at?: string;
}

export const useRoles = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user roles",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: 'superadmin' | 'distributor') => {
    try {
      // Check if role already exists for this user
      const existingRole = userRoles.find(r => r.user_id === userId);

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('id', existingRole.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "User role updated successfully",
        });
      } else {
        // Create new role assignment
        const { error } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: userId,
              role
            }
          ]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "User role assigned successfully",
        });
      }

      fetchUserRoles();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign role",
      });
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Role assignment removed successfully",
      });
      fetchUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove role assignment",
      });
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  return {
    userRoles,
    loading,
    assignRole,
    removeRole,
    refetch: fetchUserRoles
  };
};