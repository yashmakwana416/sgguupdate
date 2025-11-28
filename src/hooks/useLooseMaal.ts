import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface LooseMaalStock {
  id: string;
  product_id: string;
  product_name: string;
  current_stock_kg: number;
  current_stock_grams: number;
  minimum_stock_kg: number;
  minimum_stock_grams: number;
  unit_cost_per_kg: number;
  created_at: string;
  updated_at: string;
}

export const useLooseMaalStock = () => {
  return useQuery({
    queryKey: ['loose-maal-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loose_maal_stock')
        .select('*')
        .order('product_name');
      
      if (error) {
        console.error('Error fetching loose maal stock:', error);
        throw error;
      }
      return data as LooseMaalStock[];
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddLooseMaalStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stock: {
      product_id: string;
      product_name: string;
      kg: number;
      grams: number;
      minimum_stock_kg?: number;
      minimum_stock_grams?: number;
      unit_cost_per_kg?: number;
    }) => {
      // Check if stock already exists for this product
      const { data: existing } = await supabase
        .from('loose_maal_stock')
        .select('*')
        .eq('product_id', stock.product_id)
        .single();

      if (existing) {
        // Update existing stock by adding to it
        const newTotalGrams = (existing.current_stock_kg * 1000 + existing.current_stock_grams) + (stock.kg * 1000 + stock.grams);
        const newKg = Math.floor(newTotalGrams / 1000);
        const newGrams = newTotalGrams % 1000;

        const { data, error } = await supabase
          .from('loose_maal_stock')
          .update({
            current_stock_kg: newKg,
            current_stock_grams: newGrams,
            minimum_stock_kg: stock.minimum_stock_kg ?? existing.minimum_stock_kg,
            minimum_stock_grams: stock.minimum_stock_grams ?? existing.minimum_stock_grams,
            unit_cost_per_kg: stock.unit_cost_per_kg ?? existing.unit_cost_per_kg,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new stock record
        const { data, error } = await supabase
          .from('loose_maal_stock')
          .insert({
            product_id: stock.product_id,
            product_name: stock.product_name,
            current_stock_kg: stock.kg,
            current_stock_grams: stock.grams,
            minimum_stock_kg: stock.minimum_stock_kg || 0,
            minimum_stock_grams: stock.minimum_stock_grams || 0,
            unit_cost_per_kg: stock.unit_cost_per_kg || 0,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loose-maal-stock'] });
      toast({ title: 'Loose maal stock updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating stock', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};

export const useUpdateLooseMaalStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LooseMaalStock> }) => {
      const { data, error } = await supabase
        .from('loose_maal_stock')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loose-maal-stock'] });
      toast({ title: 'Stock updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating stock', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};

export const useDeleteLooseMaalStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loose_maal_stock')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loose-maal-stock'] });
      toast({ title: 'Stock record deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error deleting stock', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};
