import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLooseMaalStock, useAddLooseMaalStock, useDeleteLooseMaalStock } from '@/hooks/useLooseMaal';
import { useProducts } from '@/hooks/useProducts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function LooseMaal() {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [kg, setKg] = useState('');
  const [grams, setGrams] = useState('');
  const [minKg, setMinKg] = useState('');
  const [minGrams, setMinGrams] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: looseMaalStock = [], isLoading } = useLooseMaalStock();
  const { products = [] } = useProducts();
  const addStock = useAddLooseMaalStock();
  const deleteStock = useDeleteLooseMaalStock();

  const handleAddStock = async () => {
    if (!selectedProduct || !kg) {
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    await addStock.mutateAsync({
      product_id: selectedProduct,
      product_name: product.name,
      kg: parseFloat(kg) || 0,
      grams: parseFloat(grams) || 0,
      minimum_stock_kg: parseFloat(minKg) || 0,
      minimum_stock_grams: parseFloat(minGrams) || 0,
      unit_cost_per_kg: parseFloat(unitCost) || 0,
    });

    // Reset form
    setSelectedProduct('');
    setKg('');
    setGrams('');
    setMinKg('');
    setMinGrams('');
    setUnitCost('');
    setIsAddDialogOpen(false);
  };

  const isLowStock = (stock: typeof looseMaalStock[0]) => {
    const currentTotal = stock.current_stock_kg * 1000 + stock.current_stock_grams;
    const minimumTotal = stock.minimum_stock_kg * 1000 + stock.minimum_stock_grams;
    return currentTotal <= minimumTotal;
  };

  const totalProducts = looseMaalStock.length;
  const lowStockCount = looseMaalStock.filter(isLowStock).length;
  const totalValue = looseMaalStock.reduce((sum, stock) => {
    const totalKg = stock.current_stock_kg + stock.current_stock_grams / 1000;
    return sum + (totalKg * stock.unit_cost_per_kg);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('looseMaal')}</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage bulk product inventory
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Loose Maal Stock</DialogTitle>
              <DialogDescription>
                Add or update bulk product inventory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('product')}</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('kg')}</Label>
                  <Input
                    type="number"
                    value={kg}
                    onChange={e => setKg(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label>{t('grams')}</Label>
                  <Input
                    type="number"
                    value={grams}
                    onChange={e => setGrams(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min {t('kg')}</Label>
                  <Input
                    type="number"
                    value={minKg}
                    onChange={e => setMinKg(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Min {t('grams')}</Label>
                  <Input
                    type="number"
                    value={minGrams}
                    onChange={e => setMinGrams(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="999"
                  />
                </div>
              </div>

              <div>
                <Label>{t('unitCost')}</Label>
                <Input
                  type="number"
                  value={unitCost}
                  onChange={e => setUnitCost(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <Button onClick={handleAddStock} disabled={addStock.isPending} className="w-full">
                {addStock.isPending ? 'Adding...' : 'Add Stock'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Products with loose stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items below minimum level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalValue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loose Stock Inventory</CardTitle>
          <CardDescription>
            Real-time bulk product stock levels - automatically deducted during packaging
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : looseMaalStock.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No loose stock records found. Add your first stock entry.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Minimum Stock</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {looseMaalStock.map(stock => {
                    const lowStock = isLowStock(stock);
                    return (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.product_name}</TableCell>
                        <TableCell>
                          {stock.current_stock_kg} kg {stock.current_stock_grams}g
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {stock.minimum_stock_kg} kg {stock.minimum_stock_grams}g
                        </TableCell>
                        <TableCell>₹{stock.unit_cost_per_kg}/kg</TableCell>
                        <TableCell>
                          {lowStock ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="default">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(stock.id)}
                          >
                            {t('delete')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stock record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteStock.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
