import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Party {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  location_link?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePartyData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  location_link?: string;
}

export interface UpdatePartyData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  location_link?: string;
}

export const useParties = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  // Fetch all parties, scoped to the current user via RLS and per-user cache key
  const { data: parties, isLoading, error } = useQuery({
    queryKey: ['parties', user?.id || 'anon'],
    enabled: !authLoading && !!user,
    queryFn: async (): Promise<Party[]> => {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create party
  const createParty = useMutation({
    mutationFn: async (partyData: CreatePartyData): Promise<Party> => {
      const { data, error } = await supabase
        .from('parties')
        .insert([partyData as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast({
        title: "Success",
        description: "Party created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create party",
        variant: "destructive",
      });
    },
  });

  // Bulk create parties for CSV import
  const bulkCreateParties = useMutation({
    mutationFn: async (partiesData: CreatePartyData[]): Promise<Party[]> => {
      const { data, error } = await supabase
        .from('parties')
        .insert(partiesData as any[])
        .select();
      
      if (error) throw error;
      return data || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import parties",
        variant: "destructive",
      });
    },
  });

  // Update party
  const updateParty = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdatePartyData & { id: string }): Promise<Party> => {
      const { data, error } = await supabase
        .from('parties')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast({
        title: "Success",
        description: "Party updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update party",
        variant: "destructive",
      });
    },
  });

  // Hard delete party (for distributors)
  const deleteParty = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast({
        title: "Success",
        description: "Party deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete party",
        variant: "destructive",
      });
    },
  });

  return {
    parties,
    isLoading,
    error,
    createParty,
    updateParty,
    deleteParty,
    bulkCreateParties,
  };
};