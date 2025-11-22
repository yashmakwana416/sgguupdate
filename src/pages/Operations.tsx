import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/Layout';
import { useProducts } from '@/hooks/useProducts';
import { useGroupedRawMaterials } from '@/hooks/useRawMaterials';
import { useProductRawMaterials, useSaveProductRawMaterials } from '@/hooks/useProductRawMaterials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Package, Loader2 } from 'lucide-react';

const Operations = () => {
  const { t } = useTranslation();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, number>>({});

  const { products, isLoading: productsLoading } = useProducts();
  const { data: groupedMaterials, isLoading: materialsLoading } = useGroupedRawMaterials();
  const { data: existingMaterials, isLoading: existingLoading } = useProductRawMaterials(selectedProduct?.id);
  const saveMaterials = useSaveProductRawMaterials();

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
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDescribeClick(product)}
                      >
                        Describe
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

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
    </Layout>
  );
};

export default Operations;
