import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RawMaterial {
  id: string;
  name: string;
  current_stock_kg: number;
  current_stock_grams: number;
  total_stock_grams: number;
  minimum_stock_kg: number;
  minimum_stock_grams: number;
  unit_cost_per_kg: number;
  material_id?: string;
  material_variant_id?: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupedMaterial {
  base_material_name: string;
  material_id: string;
  has_variants: boolean;
  variants: Array<{
    id: string;
    name: string;
    variant_name?: string;
    variant_type?: string;
    current_stock_kg: number;
    current_stock_grams: number;
    minimum_stock_kg: number;
    minimum_stock_grams: number;
    unit_cost_per_kg: number;
    total_stock_grams: number;
    display_name?: string;
  }>;
}

export interface RawMaterialUsage {
  id: string;
  raw_material_id: string;
  raw_material_name: string;
  usage_date: string;
  used_kg: number;
  used_grams: number;
  total_used_grams: number;
  notes?: string;
  entered_by?: string;
  created_at: string;
}

export const useRawMaterials = () => {
  return useQuery({
    queryKey: ['raw-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_materials')
        .select(`
          *,
          materials!material_id(name, has_variants),
          material_variants!material_variant_id(variant_name, variant_type)
        `)
        .order('name');
      
      if (error) {
        console.error('Error fetching raw materials:', error);
        throw error;
      }
      return data as RawMaterial[];
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGroupedRawMaterials = () => {
  return useQuery({
    queryKey: ['grouped-raw-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_materials')
        .select(`
          *,
          materials!material_id(name, has_variants),
          material_variants!material_variant_id(variant_name, variant_type)
        `)
        .order('name');
      
      if (error) {
        console.error('Error fetching raw materials:', error);
        throw error;
      }

      // Group materials by base material name
      const grouped = data.reduce((acc: Record<string, GroupedMaterial>, item: any) => {
        const baseName = item.materials?.name || item.name;
        const materialId = item.material_id || item.id;
        
        if (!acc[baseName]) {
          acc[baseName] = {
            base_material_name: baseName,
            material_id: materialId,
            has_variants: item.materials?.has_variants || false,
            variants: []
          };
        }
        
        acc[baseName].variants.push({
          id: item.id,
          name: item.name,
          variant_name: item.material_variants?.variant_name,
          variant_type: item.material_variants?.variant_type,
          current_stock_kg: item.current_stock_kg,
          current_stock_grams: item.current_stock_grams,
          minimum_stock_kg: item.minimum_stock_kg,
          minimum_stock_grams: item.minimum_stock_grams,
          unit_cost_per_kg: item.unit_cost_per_kg,
          total_stock_grams: item.total_stock_grams,
          display_name: item.display_name
        });
        
        return acc;
      }, {});

      return Object.values(grouped);
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RawMaterial> }) => {
      console.log('Updating raw material:', id, updates);
      
      const { data, error } = await supabase
        .from('raw_materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from update - likely permissions issue');
        throw new Error('Update failed - please check your permissions or contact administrator');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['grouped-raw-materials'] });
      toast({ title: 'Raw material updated successfully' });
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      toast({ 
        title: 'Error updating raw material', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
};

export const useRawMaterialUsage = (materialId?: string, date?: string) => {
  return useQuery({
    queryKey: ['raw-material-usage', materialId, date],
    queryFn: async () => {
      let query = supabase
        .from('raw_material_usage')
        .select('*')
        .order('usage_date', { ascending: false });
      
      if (materialId) {
        query = query.eq('raw_material_id', materialId);
      }
      
      if (date) {
        query = query.eq('usage_date', date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as RawMaterialUsage[];
    },
  });
};

export const useAddRawMaterialUsage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (usage: Omit<RawMaterialUsage, 'id' | 'total_used_grams' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('raw_material_usage')
        .insert(usage)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['grouped-raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['raw-material-usage'] });
      toast({ title: 'Daily usage recorded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error recording usage', description: error.message, variant: 'destructive' });
    },
  });
};