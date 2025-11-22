import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useProducts, Product } from '@/hooks/useProducts';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useUserRole } from '@/hooks/useUserRole';

export default function Products() {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin, isDistributor } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    mrp: '',
    stock_quantity: '',
    unit: 'pcs',
    hsn: '',
    tax_rate: '18',
    image_url: '',
  });
  
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { toast } = useToast();

  // Check if user can manage products (admin/superadmin only)
  const canManageProducts = isAdmin() || isSuperAdmin();

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      price: '',
      mrp: '',
      stock_quantity: '',
      unit: 'pcs',
      hsn: '',
      tax_rate: '18',
      image_url: '',
    });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price || !formData.mrp) {
      return;
    }

    try {
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        price: parseFloat(formData.price),
        mrp: parseFloat(formData.mrp),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        unit: formData.unit,
        hsn: formData.hsn,
        tax_rate: parseFloat(formData.tax_rate),
        image_url: imageUrl,
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...productData,
        });
      } else {
        await createProduct.mutateAsync(productData);
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      price: product.price.toString(),
      mrp: product.mrp.toString(),
      stock_quantity: product.stock_quantity.toString(),
      unit: product.unit,
      hsn: product.hsn || '',
      tax_rate: product.tax_rate.toString(),
      image_url: product.image_url || '',
    });
    setImagePreview(product.image_url || null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct.mutateAsync(productId);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: t('outOfStock'), variant: 'destructive' as const };
    if (quantity < 10) return { label: t('lowStock'), variant: 'secondary' as const };
    return { label: t('inStock'), variant: 'default' as const };
  };
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 glass-card bg-accent-glass">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('products')}</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              {isDistributor() ? t('browseProducts') : t('manageYourProductInventory')}
            </p>
          </div>
        </div>
        
        {canManageProducts && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glass-button bg-primary/80 text-primary-foreground w-full sm:w-auto shadow-xl shadow-primary/30 border border-primary/40" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="sm:inline">{t('addProduct')}</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="glass-card max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-card-foreground text-lg sm:text-xl">
                {editingProduct ? t('editProduct') : t('addNewProduct')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-card-foreground">{t('productName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku" className="text-card-foreground">{t('sku')}</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="glass-input"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-card-foreground">{t('description')}</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-input"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <Label className="text-card-foreground">{t('productImage')}</Label>
                <div className="space-y-4">
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="w-32 h-32 object-cover rounded-lg border border-glass-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 glass-button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          setFormData({...formData, image_url: ''});
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="glass-input"
                    />
                    {isUploading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="price" className="text-card-foreground">RATE *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="glass-input"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mrp" className="text-card-foreground">MRP *</Label>
                  <Input
                    id="mrp"
                    type="number"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="glass-input"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock_quantity" className="text-card-foreground">{t('stockQuantity')}</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="unit" className="text-card-foreground">{t('unit')}</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                    <SelectTrigger className="glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="pcs">{t('pieces')}</SelectItem>
                      <SelectItem value="kg">{t('kilograms')}</SelectItem>
                      <SelectItem value="ltr">{t('liters')}</SelectItem>
                      <SelectItem value="box">{t('box')}</SelectItem>
                      <SelectItem value="set">{t('set')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hsn" className="text-card-foreground">{t('hsnCode')}</Label>
                  <Input
                    id="hsn"
                    value={formData.hsn}
                    onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_rate" className="text-card-foreground">{t('taxRate')} (%)</Label>
                  <Select value={formData.tax_rate} onValueChange={(value) => setFormData({ ...formData, tax_rate: value })}>
                    <SelectTrigger className="glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  {editingProduct ? t('edit') : t('add')} {t('product')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="glass-button"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('totalProducts')}</p>
                <p className="text-lg sm:text-2xl font-bold text-card-foreground">{products?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('lowStock')}</p>
                <p className="text-lg sm:text-2xl font-bold text-card-foreground">
                  {products?.filter(p => p.stock_quantity < 10 && p.stock_quantity > 0).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('outOfStock')}</p>
                <p className="text-lg sm:text-2xl font-bold text-card-foreground">
                  {products?.filter(p => p.stock_quantity === 0).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('totalValue')}</p>
                <p className="text-lg sm:text-2xl font-bold text-card-foreground">
                  ₹{products?.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0).toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CardTitle className="text-card-foreground text-lg sm:text-xl">{t('productCatalog')}</CardTitle>
            <div className="relative flex-1 max-w-sm sm:ml-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchProducts')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock_quantity);
              return (
                <Card key={product.id} className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg border border-glass-border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-card-foreground truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          <p className="text-sm font-medium text-card-foreground">MRP: ₹{product.mrp.toLocaleString()}</p>
                          <p className="text-sm font-medium text-card-foreground">Rate: ₹{product.price.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {canManageProducts && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="glass-button p-2"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="glass-button text-destructive hover:text-destructive p-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass-card border-destructive/20">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-card-foreground flex items-center gap-2">
                                      <Trash2 className="h-5 w-5 text-destructive" />
                                      Delete Product
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">
                                      Are you sure you want to delete <span className="font-semibold text-card-foreground">"{product.name}"</span>? 
                                      This action cannot be undone and will remove the product from your inventory.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Product
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={stockStatus.variant}
                          className="text-xs"
                        >
                          {stockStatus.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Stock: {product.stock_quantity} {product.unit}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Tax: {product.tax_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-lg glass-card p-1">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border">
                  <TableHead className="text-muted-foreground font-semibold">{t('product')}</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">{t('sku')}</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">MRP</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">{t('rate')}</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">{t('stock')}</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">{t('status')}</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">{t('tax')}</TableHead>
                  {canManageProducts && (
                    <TableHead className="text-muted-foreground font-semibold">{t('actions')}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity);
                  return (
                    <TableRow key={product.id} className="border-glass-border hover:bg-accent-glass/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-card-foreground">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-card-foreground font-mono">{product.sku}</TableCell>
                      <TableCell className="text-card-foreground font-semibold">₹{product.mrp.toLocaleString()}</TableCell>
                      <TableCell className="text-card-foreground font-semibold">₹{product.price.toLocaleString()}</TableCell>
                      <TableCell className="text-card-foreground">{product.stock_quantity} {product.unit}</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      </TableCell>
                      <TableCell className="text-card-foreground">{product.tax_rate}%</TableCell>
                      {canManageProducts && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="glass-button hover:bg-accent-glass"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="glass-button text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass-card border-destructive/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-card-foreground flex items-center gap-2">
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                    Delete Product
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Are you sure you want to delete <span className="font-semibold text-card-foreground">"{product.name}"</span>? 
                                    This action cannot be undone and will remove the product from your inventory.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Product
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManageProducts ? 8 : 7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? t('noProductsFound') : t('noProductsAdded')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}