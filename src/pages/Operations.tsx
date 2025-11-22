import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/hooks/useProducts';
import { useGroupedRawMaterials } from '@/hooks/useRawMaterials';
import { useProductRawMaterials, useSaveProductRawMaterials } from '@/hooks/useProductRawMaterials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProductRecipe {
  product_id: string;
  recipe_count: number;
  recipe_details: string | null;
}

const Operations = () => {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, number>>({});
  const [productRecipes, setProductRecipes] = useState<Record<string, ProductRecipe>>({});

  const { products, isLoading: productsLoading } = useProducts();
  const { data: groupedMaterials, isLoading: materialsLoading } = useGroupedRawMaterials();
  const { data: existingMaterials, isLoading: existingLoading } = useProductRawMaterials(selectedProduct?.id);
  const saveMaterials = useSaveProductRawMaterials();

  // Fetch all product recipes on mount
  useEffect(() => {
    fetchProductRecipes();
  }, []);

  // Refetch recipes when dialog closes (after saving)
  useEffect(() => {
    if (!showDialog && selectedProduct) {
      fetchProductRecipes();
    }
  }, [showDialog]);

  const fetchProductRecipes = async () => {
    try {
      const { data, error } = await supabase.rpc('get_product_recipes' as any);
      
      if (error) {
        // Fallback: query directly if RPC doesn't exist
        const { data: recipeData, error: recipeError } = await supabase
          .from('product_raw_materials')
          .select(`
            product_id,
            quantity_grams,
            raw_materials!inner(name)
          `);

        if (recipeError) throw recipeError;

        // Group by product
        const grouped: Record<string, ProductRecipe> = {};
        recipeData?.forEach((item: any) => {
          if (!grouped[item.product_id]) {
            grouped[item.product_id] = {
              product_id: item.product_id,
              recipe_count: 0,
              recipe_details: '',
            };
          }
          grouped[item.product_id].recipe_count++;
          const detail = `${item.raw_materials.name} (${item.quantity_grams}g)`;
          grouped[item.product_id].recipe_details = grouped[item.product_id].recipe_details
            ? `${grouped[item.product_id].recipe_details}, ${detail}`
            : detail;
        });

        setProductRecipes(grouped);
      } else {
        // Format RPC data
        const formatted: Record<string, ProductRecipe> = {};
        data?.forEach((recipe: any) => {
          formatted[recipe.product_id] = recipe;
        });
        setProductRecipes(formatted);
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
    }
  };

  const handleDescribeClick = (product: any) => {
    setSelectedProduct(product);
    setShowDialog(true);
    
    // Load existing materials for this product
    if (existingMaterials) {
      const materialMap: Record<string, number> = {};
      existingMaterials.forEach(em => {
        materialMap[em.raw_material_id] = em.quantity_grams;
      });
      setSelectedMaterials(materialMap);
    }
  };

  const handleCheckboxChange = (materialId: string, checked: boolean) => {
    setSelectedMaterials(prev => {
      if (checked) {
        return { ...prev, [materialId]: prev[materialId] || 0 };
      } else {
        const { [materialId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleQuantityChange = (materialId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSelectedMaterials(prev => ({
      ...prev,
      [materialId]: numValue,
    }));
  };

  const handleSave = async () => {
    if (!selectedProduct) return;

    const materials = Object.entries(selectedMaterials)
      .filter(([_, qty]) => qty > 0)
      .map(([raw_material_id, quantity_grams]) => ({
        raw_material_id,
        quantity_grams,
      }));

    await saveMaterials.mutateAsync({
      productId: selectedProduct.id,
      materials,
    });

    setShowDialog(false);
    setSelectedMaterials({});
    setSelectedProduct(null);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setSelectedMaterials({});
    setSelectedProduct(null);
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
        <p className="text-muted-foreground">
          Define raw material requirements for each product
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Recipes
          </CardTitle>
          <CardDescription>
            Click "Describe" to specify which raw materials are needed for each product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Recipe Status</TableHead>
                <TableHead>Recipe Details</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => {
                const recipe = productRecipes[product.id];
                const hasRecipe = recipe && recipe.recipe_count > 0;

                return (
                  <TableRow key={product.id} className={hasRecipe ? '' : 'opacity-60'}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {hasRecipe ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {recipe.recipe_count} ingredient{recipe.recipe_count > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          No recipe
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">
                      {hasRecipe ? (
                        <span className="text-sm text-muted-foreground">
                          {recipe.recipe_details}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Click "Edit Recipe" to define
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell className="text-muted-foreground">{product.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={hasRecipe ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleDescribeClick(product)}
                      >
                        {hasRecipe ? 'Edit Recipe' : 'Define Recipe'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Define Recipe for: {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Select raw materials and specify quantity (in grams) needed for 1 packet
            </DialogDescription>
          </DialogHeader>

          {materialsLoading || existingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {groupedMaterials?.map((group) => (
                  <div key={group.material_id} className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      {group.base_material_name}
                    </h3>
                    <div className="space-y-2">
                      {group.variants.map((variant) => {
                        const isChecked = variant.id in selectedMaterials;
                        const quantity = selectedMaterials[variant.id] || 0;

                        return (
                          <div
                            key={variant.id}
                            className="flex items-center gap-4 p-3 border rounded-lg bg-card"
                          >
                            <Checkbox
                              id={`material-${variant.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(variant.id, checked as boolean)
                              }
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`material-${variant.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {variant.display_name || variant.name}
                                {variant.variant_name && (
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    ({variant.variant_type}: {variant.variant_name})
                                  </span>
                                )}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Available: {variant.current_stock_kg} kg {variant.current_stock_grams}g
                              </p>
                            </div>
                            <div className="w-40 flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Quantity"
                                value={quantity || ''}
                                onChange={(e) =>
                                  handleQuantityChange(variant.id, e.target.value)
                                }
                                disabled={!isChecked}
                                min="0"
                                step="0.01"
                                className="flex-1"
                              />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                grams
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMaterials.isPending}>
              {saveMaterials.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Operations;
