import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  mrp: number;
  stock_quantity: number;
  unit: string;
  hsn?: string;
  tax_rate: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  sku: string;
  price: number;
  mrp: number;
  stock_quantity?: number;
  unit?: string;
  hsn?: string;
  tax_rate?: number;
  image_url?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  sku?: string;
  price?: number;
  mrp?: number;
  stock_quantity?: number;
  unit?: string;
  hsn?: string;
  tax_rate?: number;
  image_url?: string;
}

export const useProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all products with real-time updates
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Set up real-time subscription for products
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          // Invalidate and refetch products when any change occurs
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create product
  const createProduct = useMutation({
    mutationFn: async (productData: CreateProductData): Promise<Product> => {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  // Update product
  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateProductData & { id: string }): Promise<Product> => {
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Delete product (safe delete with dependency checking)
  const deleteProduct = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data, error } = await supabase.rpc('safe_delete_product', {
        product_uuid: id
      });

      if (error) throw error;

      // Show appropriate message based on deletion type
      const isHardDelete = data;
      if (!isHardDelete) {
        toast({
          title: "Product Archived",
          description: "Product has been archived due to existing purchase records.",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  return {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};