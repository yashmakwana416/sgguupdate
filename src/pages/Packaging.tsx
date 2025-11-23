import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProducts } from '@/hooks/useProducts';
import { usePackagingLogs, useCreatePackagingEntry } from '@/hooks/usePackaging';
import { useProductRawMaterials, useSaveProductRawMaterials } from '@/hooks/useProductRawMaterials';
import { useRawMaterials } from '@/hooks/useRawMaterials';
import { Package, History, Settings, Edit } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

const Packaging = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [kgPacked, setKgPacked] = useState<string>('');
  const [editRecipeProductId, setEditRecipeProductId] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, number>>({});
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const { products, isLoading: productsLoading } = useProducts();
  const { data: packagingLogs, isLoading: logsLoading } = usePackagingLogs({
    startDate: filterStartDate,
    endDate: filterEndDate,
  });
  const { data: productRecipe } = useProductRawMaterials(editRecipeProductId);
  const { data: allRawMaterials, isLoading: rawMaterialsLoading } = useRawMaterials();
  const createEntry = useCreatePackagingEntry();
  const saveRecipe = useSaveProductRawMaterials();

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  // Load existing recipe when editing
  useEffect(() => {
    if (isEditDialogOpen && productRecipe) {
      const materials: Record<string, number> = {};
      productRecipe.forEach((item) => {
        materials[item.raw_material_id] = item.quantity_grams;
      });
      setSelectedMaterials(materials);
    }
  }, [isEditDialogOpen, productRecipe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || !selectedProduct) {
      return;
    }

    const kgValue = parseFloat(kgPacked);
    if (isNaN(kgValue) || kgValue <= 0) {
      return;
    }

    await createEntry.mutateAsync({
      productId: selectedProductId,
      productName: selectedProduct.name,
      kgPacked: kgValue,
    });

    // Reset form
    setKgPacked('');
  };

  const handleEditRecipe = (productId: string) => {
    setEditRecipeProductId(productId);
    setIsEditDialogOpen(true);
    setSelectedMaterials({});
  };

  const handleMaterialToggle = (materialId: string) => {
    setSelectedMaterials((prev) => {
      const newMaterials = { ...prev };
      if (newMaterials[materialId] !== undefined) {
        delete newMaterials[materialId];
      } else {
        newMaterials[materialId] = 0;
      }
      return newMaterials;
    });
  };

  const handleQuantityChange = (materialId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setSelectedMaterials((prev) => ({
        ...prev,
        [materialId]: numValue,
      }));
    }
  };

  const handleSaveRecipe = async () => {
    const materials = Object.entries(selectedMaterials)
      .filter(([_, qty]) => qty > 0)
      .map(([raw_material_id, quantity_grams]) => ({
        raw_material_id,
        quantity_grams,
      }));

    if (materials.length === 0) {
      toast({
        title: 'No materials selected',
        description: 'Please select at least one raw material with a quantity greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    await saveRecipe.mutateAsync({
      productId: editRecipeProductId,
      materials,
    });

    setIsEditDialogOpen(false);
    setSelectedMaterials({});
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Packaging Module</h1>
      </div>

      <Tabs defaultValue="entry" className="space-y-6">
        <TabsList>
          <TabsTrigger value="entry">Daily Entry</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* Daily Packaging Entry */}
        <TabsContent value="entry">
          <Card>
            <CardHeader>
              <CardTitle>Record Daily Packaging</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product">Select Product</Label>
                    <Select
                      value={selectedProductId}
                      onValueChange={setSelectedProductId}
                    >
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : (
                          products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="kg">KG Packed Today</Label>
                      <Input
                        id="kg"
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="Enter quantity in KG"
                        value={kgPacked}
                        onChange={(e) => setKgPacked(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!selectedProductId || !kgPacked || createEntry.isPending}
                    className="w-full md:w-auto"
                  >
                    {createEntry.isPending ? 'Saving...' : 'Save Packaging Entry'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packaging History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Packaging History
                  </CardTitle>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      placeholder="Start date"
                      className="w-40"
                    />
                    <Input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      placeholder="End date"
                      className="w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <p>Loading history...</p>
                ) : !packagingLogs || packagingLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No packaging history found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>KG Packed</TableHead>
                          <TableHead>Raw Materials Used</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packagingLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {format(new Date(log.packaging_date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {log.product_name}
                            </TableCell>
                            <TableCell>{log.kg_packed} kg</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {log.raw_materials_used.map((rm: any, idx: number) => (
                                  <Badge key={idx} variant="outline">
                                    {rm.raw_material_name}: {rm.quantity_deducted_kg.toFixed(3)} kg
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products & Raw Materials */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Product Raw Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <p>Loading products...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products?.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRecipe(product.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Recipe
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Recipe Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Recipe: {products?.find((p) => p.id === editRecipeProductId)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select raw materials and enter the quantity (in grams) required for 1 KG of this product.
              </p>
              
              {rawMaterialsLoading ? (
                <p>Loading raw materials...</p>
              ) : !allRawMaterials || allRawMaterials.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No raw materials found in inventory.
                </p>
              ) : (
                <div className="space-y-3">
                  {allRawMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <Checkbox
                        id={material.id}
                        checked={selectedMaterials[material.id] !== undefined}
                        onCheckedChange={() => handleMaterialToggle(material.id)}
                      />
                      <label
                        htmlFor={material.id}
                        className="flex-1 text-sm font-medium cursor-pointer"
                      >
                        {material.name}
                        <span className="text-muted-foreground ml-2">
                          (Stock: {material.current_stock_kg} kg {material.current_stock_grams} g)
                        </span>
                      </label>
                      {selectedMaterials[material.id] !== undefined && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="Grams"
                            value={selectedMaterials[material.id] || ''}
                            onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">grams</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedMaterials({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRecipe}
                  disabled={saveRecipe.isPending || Object.keys(selectedMaterials).length === 0}
                >
                  {saveRecipe.isPending ? 'Saving...' : 'Save Recipe'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
};

export default Packaging;
