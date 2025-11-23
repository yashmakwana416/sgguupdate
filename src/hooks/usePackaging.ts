import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PackagingLog {
  id: string;
  product_id: string;
  product_name: string;
  kg_packed: number;
  raw_materials_used: Array<{
    raw_material_id: string;
    raw_material_name: string;
    quantity_deducted_kg: number;
  }>;
  packaging_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const usePackagingLogs = (filters?: { 
  startDate?: string; 
  endDate?: string; 
  productId?: string;
}) => {
  return useQuery({
    queryKey: ['packaging-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('packaging_logs')
        .select('*')
        .order('packaging_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('packaging_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('packaging_date', filters.endDate);
      }
      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PackagingLog[];
    },
  });
};

export const useCreatePackagingEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      productName,
      kgPacked,
    }: {
      productId: string;
      productName: string;
      kgPacked: number;
    }) => {
      // 1. Fetch product's raw material recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('product_raw_materials')
        .select(`
          raw_material_id,
          quantity_grams,
          raw_materials (
            id,
            name,
            current_stock_kg,
            current_stock_grams
          )
        `)
        .eq('product_id', productId);

      if (recipeError) throw recipeError;

      if (!recipe || recipe.length === 0) {
        throw new Error('No raw material recipe found for this product. Please configure raw materials first.');
      }

      // 2. Calculate required quantities and check stock
      const rawMaterialsUsed: Array<{
        raw_material_id: string;
        raw_material_name: string;
        quantity_deducted_kg: number;
        new_stock_kg: number;
        new_stock_grams: number;
      }> = [];

      for (const item of recipe) {
        const rawMaterial = item.raw_materials as any;
        const requiredGrams = item.quantity_grams * kgPacked;
        const requiredKg = requiredGrams / 1000;

        // Current stock in grams
        const currentTotalGrams = 
          (rawMaterial.current_stock_kg * 1000) + 
          rawMaterial.current_stock_grams;

        // Check if sufficient stock
        if (currentTotalGrams < requiredGrams) {
          throw new Error(
            `Insufficient stock for ${rawMaterial.name}. ` +
            `Required: ${requiredKg.toFixed(3)} kg, ` +
            `Available: ${(currentTotalGrams / 1000).toFixed(3)} kg`
          );
        }

        // Calculate new stock after deduction
        const newTotalGrams = currentTotalGrams - requiredGrams;
        const newStockKg = Math.floor(newTotalGrams / 1000);
        const newStockGrams = newTotalGrams % 1000;

        rawMaterialsUsed.push({
          raw_material_id: item.raw_material_id,
          raw_material_name: rawMaterial.name,
          quantity_deducted_kg: requiredKg,
          new_stock_kg: newStockKg,
          new_stock_grams: newStockGrams,
        });
      }

      // 3. Create packaging log
      const { data: log, error: logError } = await supabase
        .from('packaging_logs')
        .insert({
          product_id: productId,
          product_name: productName,
          kg_packed: kgPacked,
          raw_materials_used: rawMaterialsUsed.map(rm => ({
            raw_material_id: rm.raw_material_id,
            raw_material_name: rm.raw_material_name,
            quantity_deducted_kg: rm.quantity_deducted_kg,
          })),
        })
        .select()
        .single();

      if (logError) throw logError;

      // 4. Update raw material stocks
      for (const rm of rawMaterialsUsed) {
        const { error: updateError } = await supabase
          .from('raw_materials')
          .update({
            current_stock_kg: rm.new_stock_kg,
            current_stock_grams: rm.new_stock_grams,
          })
          .eq('id', rm.raw_material_id);

        if (updateError) throw updateError;
      }

      return log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-logs'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      toast({
        title: 'Packaging entry saved',
        description: 'Raw materials have been deducted from inventory.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving packaging entry',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
