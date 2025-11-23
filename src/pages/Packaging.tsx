import { useState } from 'react';

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
import { useProductRawMaterials } from '@/hooks/useProductRawMaterials';
import { Package, History, Settings } from 'lucide-react';
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

const Packaging = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [kgPacked, setKgPacked] = useState<string>('');
  const [viewRecipeProductId, setViewRecipeProductId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const { products, isLoading: productsLoading } = useProducts();
  const { data: packagingLogs, isLoading: logsLoading } = usePackagingLogs({
    startDate: filterStartDate,
    endDate: filterEndDate,
  });
  const { data: productRecipe } = useProductRawMaterials(viewRecipeProductId);
  const createEntry = useCreatePackagingEntry();

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

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
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewRecipeProductId(product.id)}
                                  >
                                    View Recipe
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Raw Material Recipe: {product.name}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-2">
                                    {!productRecipe || productRecipe.length === 0 ? (
                                      <p className="text-muted-foreground text-center py-4">
                                        No recipe configured. Please configure on the Products page.
                                      </p>
                                    ) : (
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Raw Material</TableHead>
                                            <TableHead>Qty per 1 KG Product</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {productRecipe.map((rm) => (
                                            <TableRow key={rm.id}>
                                              <TableCell>{rm.raw_material_id}</TableCell>
                                              <TableCell>
                                                {(rm.quantity_grams / 1000).toFixed(3)} kg
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
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
      </div>
    );
};

export default Packaging;
