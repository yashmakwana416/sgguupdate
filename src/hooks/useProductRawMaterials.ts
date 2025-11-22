import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProductRawMaterial {
  id: string;
  product_id: string;
  raw_material_id: string;
  quantity_grams: number;
  created_at: string;
  updated_at: string;
}

export const useProductRawMaterials = (productId?: string) => {
  return useQuery({
    queryKey: ['product-raw-materials', productId],
    queryFn: async () => {
      let query = supabase
        .from('product_raw_materials')
        .select('*');
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProductRawMaterial[];
    },
    enabled: !!productId,
  });
};

export const useSaveProductRawMaterials = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      productId, 
      materials 
    }: { 
      productId: string; 
      materials: Array<{ raw_material_id: string; quantity_grams: number }> 
    }) => {
      // First, delete all existing materials for this product
      const { error: deleteError } = await supabase
        .from('product_raw_materials')
        .delete()
        .eq('product_id', productId);
      
      if (deleteError) throw deleteError;
      
      // Then insert the new materials
      if (materials.length > 0) {
        const { data, error } = await supabase
          .from('product_raw_materials')
          .insert(
            materials.map(m => ({
              product_id: productId,
              raw_material_id: m.raw_material_id,
              quantity_grams: m.quantity_grams,
            }))
          )
          .select();
        
        if (error) throw error;
        return data;
      }
      
      return [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-raw-materials'] });
      toast({ title: 'Recipe saved successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error saving recipe', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};
