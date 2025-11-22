import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReplacementItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  replacement_date: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReplacementItemData {
  invoice_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  replacement_date?: string;
  reason?: string;
}

export const useReplacementItems = (invoiceId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch replacement items for a specific invoice
  const { data: replacementItems, isLoading, error } = useQuery({
    queryKey: ['replacement-items', invoiceId],
    queryFn: async (): Promise<ReplacementItem[]> => {
      if (!invoiceId) return [];
      
      const { data, error } = await supabase
        .from('replacement_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('replacement_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!invoiceId,
  });

  // Create replacement item
  const createReplacementItem = useMutation({
    mutationFn: async (itemData: CreateReplacementItemData): Promise<ReplacementItem> => {
      const { data, error } = await supabase
        .from('replacement_items')
        .insert([itemData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replacement-items'] });
      toast({
        title: "Success",
        description: "Replacement item added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add replacement item",
        variant: "destructive",
      });
    },
  });

  // Delete replacement item
  const deleteReplacementItem = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('replacement_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replacement-items'] });
      toast({
        title: "Success",
        description: "Replacement item removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove replacement item",
        variant: "destructive",
      });
    },
  });

  return {
    replacementItems,
    isLoading,
    error,
    createReplacementItem,
    deleteReplacementItem,
  };
};