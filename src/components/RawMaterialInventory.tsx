import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Plus, ChefHat, TrendingDown, TrendingUp, Package } from 'lucide-react';
import { useGroupedRawMaterials, useUpdateRawMaterial, useAddRawMaterialUsage, GroupedMaterial } from '@/hooks/useRawMaterials';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface StockUpdateForm {
  current_stock_kg: number | string;
  current_stock_grams: number | string;
  minimum_stock_kg: number | string;
  minimum_stock_grams: number | string;
  unit_cost_per_kg: number | string;
}

interface UsageForm {
  raw_material_id: string;
  raw_material_name: string;
  used_kg: number | undefined;
  used_grams: number | undefined;
  usage_date: string;
  notes?: string;
}

const RawMaterialInventory = () => {
  const { t } = useTranslation();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const { data: groupedMaterials, isLoading, error } = useGroupedRawMaterials();
  const updateMaterial = useUpdateRawMaterial();
  const addUsage = useAddRawMaterialUsage();

  const stockForm = useForm<StockUpdateForm>();
  const usageForm = useForm<UsageForm>({
    defaultValues: {
      usage_date: new Date().toISOString().split('T')[0],
      used_kg: undefined,
      used_grams: undefined,
    },
  });

  const formatStock = (kg: number, grams: number) => {
    return `${kg}kg ${grams}g`;
  };

  const getStockStatus = (currentKg: number, currentGrams: number, minKg: number, minGrams: number) => {
    const currentTotal = currentKg * 1000 + currentGrams;
    const minTotal = minKg * 1000 + minGrams;
    
    if (currentTotal <= 0) return { status: t('outOfStock'), color: 'destructive' };
    if (currentTotal <= minTotal) return { status: t('lowStock'), color: 'secondary' };
    return { status: t('inStock'), color: 'default' };
  };

  const handleVariantSelect = (materialName: string, variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [materialName]: variantId
    }));
  };

  const getSelectedVariant = (material: GroupedMaterial) => {
    const selectedId = selectedVariants[material.base_material_name];
    return material.variants.find(v => v.id === selectedId) || material.variants[0];
  };

  const handleEditStock = (variant: any, materialName: string) => {
    setEditingMaterial({ ...variant, base_material_name: materialName });
    stockForm.reset({
      current_stock_kg: variant.current_stock_kg && variant.current_stock_kg > 0 ? variant.current_stock_kg : '',
      current_stock_grams: variant.current_stock_grams && variant.current_stock_grams > 0 ? variant.current_stock_grams : '',
      minimum_stock_kg: variant.minimum_stock_kg && variant.minimum_stock_kg > 0 ? variant.minimum_stock_kg : '',
      minimum_stock_grams: variant.minimum_stock_grams && variant.minimum_stock_grams > 0 ? variant.minimum_stock_grams : '',
      unit_cost_per_kg: variant.unit_cost_per_kg && variant.unit_cost_per_kg > 0 ? variant.unit_cost_per_kg : '',
    });
  };

  const handleUpdateStock = (data: StockUpdateForm) => {
    if (!editingMaterial) return;
    
    // Convert empty strings to 0 for submission
    const updates = {
      current_stock_kg: data.current_stock_kg === '' ? 0 : Number(data.current_stock_kg),
      current_stock_grams: data.current_stock_grams === '' ? 0 : Number(data.current_stock_grams),
      minimum_stock_kg: data.minimum_stock_kg === '' ? 0 : Number(data.minimum_stock_kg),
      minimum_stock_grams: data.minimum_stock_grams === '' ? 0 : Number(data.minimum_stock_grams),
      unit_cost_per_kg: data.unit_cost_per_kg === '' ? 0 : Number(data.unit_cost_per_kg),
    };
    
    updateMaterial.mutate({
      id: editingMaterial.id,
      updates,
    }, {
      onSuccess: () => {
        setEditingMaterial(null);
        stockForm.reset();
      },
    });
  };

  const handleAddUsage = (data: UsageForm) => {
    // Convert undefined values to 0 for API submission
    const submissionData = {
      ...data,
      used_kg: data.used_kg || 0,
      used_grams: data.used_grams || 0,
    };

    addUsage.mutate(submissionData, {
      onSuccess: () => {
        setShowUsageDialog(false);
        usageForm.reset({
          usage_date: new Date().toISOString().split('T')[0],
          used_kg: undefined,
          used_grams: undefined,
        });
      },
    });
  };

  const openUsageDialog = (variant: any) => {
    usageForm.setValue('raw_material_id', variant.id);
    usageForm.setValue('raw_material_name', variant.name);
    setShowUsageDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="glass-card border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{t('failedLoadMaterials')}</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            {error.message?.includes('permission') && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>{t('authIssue')}</strong> {t('signOutSignIn')}
                </p>
              </div>
            )}
            <Button onClick={() => window.location.reload()} variant="outline">
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats from all variants
  const allVariants = groupedMaterials?.flatMap(material => material.variants) || [];
  const totalValue = allVariants.reduce((sum, variant) => 
    sum + (variant.current_stock_kg * variant.unit_cost_per_kg) + 
    ((variant.current_stock_grams / 1000) * variant.unit_cost_per_kg), 0);

  const lowStockItems = allVariants.filter(variant => {
    const { status } = getStockStatus(
      variant.current_stock_kg,
      variant.current_stock_grams,
      variant.minimum_stock_kg,
      variant.minimum_stock_grams
    );
    return status === 'Low Stock';
  }).length;

  const outOfStockItems = allVariants.filter(variant => {
    const { status } = getStockStatus(
      variant.current_stock_kg,
      variant.current_stock_grams,
      variant.minimum_stock_kg,
      variant.minimum_stock_grams
    );
    return status === 'Out of Stock';
  }).length;

  // Show empty state if no materials
  if (!groupedMaterials || groupedMaterials.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noRawMaterialsFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('autoCreateMaterials')}
            </p>
            <Button onClick={() => window.location.reload()}>
              {t('refreshPage')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalMaterials')}</p>
                <p className="text-2xl font-bold">{groupedMaterials?.length || 0}</p>
              </div>
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('lowStock')}</p>
                <p className="text-2xl font-bold text-destructive">{lowStockItems}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('outOfStock')}</p>
                <p className="text-2xl font-bold text-destructive">{outOfStockItems}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalValue')}</p>
                <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">{t('currentInventory')}</TabsTrigger>
          <TabsTrigger value="usage">{t('recordUsage')}</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t('rawMaterialInventory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('materialVariants')}</TableHead>
                    <TableHead>{t('currentStock')}</TableHead>
                    <TableHead>{t('minimumStock')}</TableHead>
                    <TableHead>{t('unitCostPerKg')}</TableHead>
                    <TableHead>{t('totalValue')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedMaterials?.map((material) => {
                    const selectedVariant = getSelectedVariant(material);
                    const stockStatus = getStockStatus(
                      selectedVariant.current_stock_kg,
                      selectedVariant.current_stock_grams,
                      selectedVariant.minimum_stock_kg,
                      selectedVariant.minimum_stock_grams
                    );
                    const totalValue = (selectedVariant.current_stock_kg * selectedVariant.unit_cost_per_kg) + 
                      ((selectedVariant.current_stock_grams / 1000) * selectedVariant.unit_cost_per_kg);

                    return (
                      <TableRow key={material.base_material_name}>
                        <TableCell>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="font-medium">{material.base_material_name}</span>
                            </div>
                            {material.has_variants && material.variants.length > 1 && (
                              <div className="flex flex-wrap gap-2">
                                {material.variants.map((variant) => (
                                  <Button
                                    key={variant.id}
                                    variant={selectedVariant.id === variant.id ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                      "rounded-full text-xs h-7 px-3 transition-all",
                                      selectedVariant.id === variant.id 
                                        ? "bg-primary text-primary-foreground shadow-md" 
                                        : "bg-background hover:bg-muted border-muted-foreground/20"
                                    )}
                                    onClick={() => handleVariantSelect(material.base_material_name, variant.id)}
                                  >
                                    {variant.variant_name || variant.name.split(' - ').pop()}
                                  </Button>
                                ))}
                              </div>
                            )}
                            {!material.has_variants && (
                              <div className="text-sm text-muted-foreground">{t('noVariants')}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatStock(selectedVariant.current_stock_kg, selectedVariant.current_stock_grams)}</TableCell>
                        <TableCell>{formatStock(selectedVariant.minimum_stock_kg, selectedVariant.minimum_stock_grams)}</TableCell>
                        <TableCell>₹{selectedVariant.unit_cost_per_kg}</TableCell>
                        <TableCell>₹{totalValue.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.color as any}>{stockStatus.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditStock(selectedVariant, material.base_material_name)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUsageDialog(selectedVariant)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{t('recordDailyUsage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedMaterials?.map((material) => {
                  const selectedVariant = getSelectedVariant(material);
                  return (
                    <Card key={material.base_material_name} className="glass-card">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{material.base_material_name}</h4>
                              {material.has_variants && selectedVariant.variant_name && (
                                <span className="text-xs text-muted-foreground">
                                  {selectedVariant.variant_name}
                                </span>
                              )}
                            </div>
                            <Badge variant="outline">
                              {formatStock(selectedVariant.current_stock_kg, selectedVariant.current_stock_grams)}
                            </Badge>
                          </div>
                          {material.has_variants && material.variants.length > 1 && (
                            <div className="flex flex-wrap gap-1">
                              {material.variants.map((variant) => (
                                <Button
                                  key={variant.id}
                                  variant={selectedVariant.id === variant.id ? "default" : "outline"}
                                  size="sm"
                                  className={cn(
                                    "rounded-full text-xs h-6 px-2",
                                    selectedVariant.id === variant.id 
                                      ? "bg-primary text-primary-foreground" 
                                      : "bg-background hover:bg-muted border-muted-foreground/20"
                                  )}
                                  onClick={() => handleVariantSelect(material.base_material_name, variant.id)}
                                >
                                  {variant.variant_name || variant.name.split(' - ').pop()}
                                </Button>
                              ))}
                            </div>
                          )}
                          <Button
                            onClick={() => openUsageDialog(selectedVariant)}
                            className="w-full"
                            variant="outline"
                          >
                            {t('recordUsageBtn')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Stock Dialog */}
      <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('updateStock')} - {editingMaterial?.name || editingMaterial?.base_material_name}</DialogTitle>
          </DialogHeader>
          <Form {...stockForm}>
            <form onSubmit={stockForm.handleSubmit(handleUpdateStock)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stockForm.control}
                  name="current_stock_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('currentStock')} (kg)</FormLabel>
                      <FormControl> 
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value)}
                          placeholder={t('enterKg')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockForm.control}
                  name="current_stock_grams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('currentStock')} (grams)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="999" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value)}
                          placeholder={t('enterGrams')}
                        />
                      </FormControl>
                      <FormMessage />   
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField    
                  control={stockForm.control}
                  name="minimum_stock_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('minimumStock')} (kg)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value)}
                          placeholder={t('enterKg')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stockForm.control}
                  name="minimum_stock_grams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('minimumStock')} (grams)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="999" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value)}
                          placeholder={t('enterGrams')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={stockForm.control}
                name="unit_cost_per_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('unitCostPerKg')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                        onChange={e => field.onChange(e.target.value)}
                        placeholder={t('enterCost')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingMaterial(null)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={updateMaterial.isPending}>
                  {t('updateStock')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Usage Dialog */}
      <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('recordUsage')}</DialogTitle>
          </DialogHeader>
          <Form {...usageForm}>
            <form onSubmit={usageForm.handleSubmit(handleAddUsage)} className="space-y-4">
              <FormField
                control={usageForm.control}
                name="usage_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('usageDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={usageForm.control}
                  name="used_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('usedKg')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={field.value || ''} 
                          onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} 
                          placeholder={t('enterKgUsed')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={usageForm.control}
                  name="used_grams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('usedGrams')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="999" 
                          value={field.value || ''} 
                          onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} 
                          placeholder={t('enterGramsUsed')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={usageForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('notesOptional')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('usageNotes')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowUsageDialog(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={addUsage.isPending}>
                  {t('recordUsageBtn')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RawMaterialInventory;