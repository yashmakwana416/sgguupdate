import { ChefHat, Plus } from 'lucide-react';
import RawMaterialInventory from '@/components/RawMaterialInventory';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Inventory = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    current_stock_kg: '',
    current_stock_grams: '',
    minimum_stock_kg: '',
    minimum_stock_grams: '',
    unit_cost_per_kg: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      current_stock_kg: '',
      current_stock_grams: '',
      minimum_stock_kg: '',
      minimum_stock_grams: '',
      unit_cost_per_kg: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const kg = Number(formData.current_stock_kg) || 0;
      const grams = Number(formData.current_stock_grams) || 0;

      const materialData = {
        name: formData.name,
        current_stock_kg: kg,
        current_stock_grams: grams,
        // total_stock_grams is generated, so we don't include it
        minimum_stock_kg: Number(formData.minimum_stock_kg) || 0,
        minimum_stock_grams: Number(formData.minimum_stock_grams) || 0,
        unit_cost_per_kg: Number(formData.unit_cost_per_kg) || 0
      };

      const { error } = await supabase
        .from('raw_materials')
        .insert([materialData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Inventory item added successfully'
      });

      setShowAddDialog(false);
      resetForm();

      // Trigger a re-render of the RawMaterialInventory component
      // by using a key or forcing a remount
      window.dispatchEvent(new Event('inventoryUpdated'));
    } catch (error: any) {
      console.error('Error saving material:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save inventory item',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 glass-card">
            <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-responsive-lg font-bold text-foreground">{t('rawMaterialsInventory')}</h1>
            <p className="text-responsive-sm text-muted-foreground">{t('trackAndManageRawMaterials')}</p>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Inventory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Inventory Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Wheat Flour"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_stock_kg">Current Stock (kg) *</Label>
                  <Input
                    id="current_stock_kg"
                    type="number"
                    min="0"
                    value={formData.current_stock_kg}
                    onChange={(e) => setFormData({ ...formData, current_stock_kg: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_stock_grams">Current Stock (grams) *</Label>
                  <Input
                    id="current_stock_grams"
                    type="number"
                    min="0"
                    max="999"
                    value={formData.current_stock_grams}
                    onChange={(e) => setFormData({ ...formData, current_stock_grams: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimum_stock_kg">Minimum Stock (kg) *</Label>
                  <Input
                    id="minimum_stock_kg"
                    type="number"
                    min="0"
                    value={formData.minimum_stock_kg}
                    onChange={(e) => setFormData({ ...formData, minimum_stock_kg: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_stock_grams">Minimum Stock (grams) *</Label>
                  <Input
                    id="minimum_stock_grams"
                    type="number"
                    min="0"
                    max="999"
                    value={formData.minimum_stock_grams}
                    onChange={(e) => setFormData({ ...formData, minimum_stock_grams: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_cost_per_kg">Unit Cost Per KG (₹) *</Label>
                <Input
                  id="unit_cost_per_kg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_cost_per_kg}
                  onChange={(e) => setFormData({ ...formData, unit_cost_per_kg: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Inventory
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <RawMaterialInventory />
    </div>
  );
};

export default Inventory;