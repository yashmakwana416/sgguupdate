import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RawMaterial {
    id: string;
    material_name: string;
    material_code?: string;
    category?: string;
    unit_of_measurement: string;
    current_stock: number;
    minimum_stock_level: number;
    maximum_stock_level?: number;
    unit_price: number;
    supplier_name?: string;
    supplier_contact?: string;
    storage_location?: string;
    description?: string;
    last_restocked_at?: string;
    created_at: string;
    updated_at: string;
}

const UNITS_OF_MEASUREMENT = [
    'kg', 'grams', 'liters', 'milliliters', 'pieces', 'meters', 'centimeters',
    'boxes', 'bags', 'bottles', 'cans', 'packets', 'rolls', 'sheets',
    'tons', 'pounds', 'gallons', 'units'
];

const CATEGORIES = [
    'Raw Materials', 'Packaging Materials', 'Chemicals', 'Ingredients',
    'Supplies', 'Tools & Equipment', 'Other'
];

export const RawMaterialsInventory: React.FC = () => {
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        material_name: '',
        material_code: '',
        category: '',
        unit_of_measurement: 'kg',
        current_stock: 0,
        minimum_stock_level: 0,
        maximum_stock_level: 0,
        unit_price: 0,
        supplier_name: '',
        supplier_contact: '',
        storage_location: '',
        description: ''
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('raw_materials_inventory' as any)
                .select('*')
                .order('material_name', { ascending: true });

            if (error) throw error;
            setMaterials((data as any) || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch raw materials',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: 'Error',
                    description: 'You must be logged in',
                    variant: 'destructive'
                });
                return;
            }

            const materialData = {
                ...formData,
                user_id: user.id,
                current_stock: Number(formData.current_stock),
                minimum_stock_level: Number(formData.minimum_stock_level),
                maximum_stock_level: formData.maximum_stock_level ? Number(formData.maximum_stock_level) : null,
                unit_price: Number(formData.unit_price)
            };

            if (editingMaterial) {
                const { error } = await supabase
                    .from('raw_materials_inventory' as any)
                    .update(materialData)
                    .eq('id', editingMaterial.id);

                if (error) throw error;

                toast({
                    title: 'Success',
                    description: 'Raw material updated successfully'
                });
            } else {
                const { error } = await supabase
                    .from('raw_materials_inventory' as any)
                    .insert([materialData]);

                if (error) throw error;

                toast({
                    title: 'Success',
                    description: 'Raw material added successfully'
                });
            }

            setDialogOpen(false);
            resetForm();
            fetchMaterials();
        } catch (error) {
            console.error('Error saving material:', error);
            toast({
                title: 'Error',
                description: 'Failed to save raw material',
                variant: 'destructive'
            });
        }
    };

    const handleEdit = (material: RawMaterial) => {
        setEditingMaterial(material);
        setFormData({
            material_name: material.material_name,
            material_code: material.material_code || '',
            category: material.category || '',
            unit_of_measurement: material.unit_of_measurement,
            current_stock: material.current_stock,
            minimum_stock_level: material.minimum_stock_level,
            maximum_stock_level: material.maximum_stock_level || 0,
            unit_price: material.unit_price,
            supplier_name: material.supplier_name || '',
            supplier_contact: material.supplier_contact || '',
            storage_location: material.storage_location || '',
            description: material.description || ''
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this raw material?')) return;

        try {
            const { error } = await supabase
                .from('raw_materials_inventory' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Raw material deleted successfully'
            });
            fetchMaterials();
        } catch (error) {
            console.error('Error deleting material:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete raw material',
                variant: 'destructive'
            });
        }
    };

    const resetForm = () => {
        setFormData({
            material_name: '',
            material_code: '',
            category: '',
            unit_of_measurement: 'kg',
            current_stock: 0,
            minimum_stock_level: 0,
            maximum_stock_level: 0,
            unit_price: 0,
            supplier_name: '',
            supplier_contact: '',
            storage_location: '',
            description: ''
        });
        setEditingMaterial(null);
    };

    const getStockStatus = (material: RawMaterial) => {
        if (material.current_stock <= material.minimum_stock_level) {
            return { status: 'Low Stock', variant: 'destructive' as const, icon: AlertTriangle };
        } else if (material.maximum_stock_level && material.current_stock >= material.maximum_stock_level) {
            return { status: 'Overstock', variant: 'secondary' as const, icon: TrendingUp };
        }
        return { status: 'Normal', variant: 'outline' as const, icon: Package };
    };

    const getTotalInventoryValue = () => {
        return materials.reduce((total, material) => {
            return total + (material.current_stock * material.unit_price);
        }, 0);
    };

    const getLowStockCount = () => {
        return materials.filter(m => m.current_stock <= m.minimum_stock_level).length;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{materials.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{getTotalInventoryValue().toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{getLowStockCount()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-bold">Raw Materials Inventory</CardTitle>
                        <Dialog open={dialogOpen} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) resetForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Raw Material
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="material_name">Material Name *</Label>
                                            <Input
                                                id="material_name"
                                                value={formData.material_name}
                                                onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                                                required
                                                placeholder="e.g., Wheat Flour"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="material_code">Material Code</Label>
                                            <Input
                                                id="material_code"
                                                value={formData.material_code}
                                                onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                                                placeholder="e.g., WF-001"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CATEGORIES.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="unit_of_measurement">Unit of Measurement *</Label>
                                            <Select
                                                value={formData.unit_of_measurement}
                                                onValueChange={(value) => setFormData({ ...formData, unit_of_measurement: value })}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNITS_OF_MEASUREMENT.map((unit) => (
                                                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current_stock">Current Stock *</Label>
                                            <Input
                                                id="current_stock"
                                                type="number"
                                                step="0.01"
                                                value={formData.current_stock}
                                                onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="minimum_stock_level">Min Stock Level *</Label>
                                            <Input
                                                id="minimum_stock_level"
                                                type="number"
                                                step="0.01"
                                                value={formData.minimum_stock_level}
                                                onChange={(e) => setFormData({ ...formData, minimum_stock_level: parseFloat(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="maximum_stock_level">Max Stock Level</Label>
                                            <Input
                                                id="maximum_stock_level"
                                                type="number"
                                                step="0.01"
                                                value={formData.maximum_stock_level}
                                                onChange={(e) => setFormData({ ...formData, maximum_stock_level: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="unit_price">Unit Price (₹) *</Label>
                                        <Input
                                            id="unit_price"
                                            type="number"
                                            step="0.01"
                                            value={formData.unit_price}
                                            onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="supplier_name">Supplier Name</Label>
                                            <Input
                                                id="supplier_name"
                                                value={formData.supplier_name}
                                                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                                placeholder="e.g., ABC Suppliers"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="supplier_contact">Supplier Contact</Label>
                                            <Input
                                                id="supplier_contact"
                                                value={formData.supplier_contact}
                                                onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                                                placeholder="Phone or email"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="storage_location">Storage Location</Label>
                                        <Input
                                            id="storage_location"
                                            value={formData.storage_location}
                                            onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                                            placeholder="e.g., Warehouse A, Shelf 3"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Additional notes about this material"
                                            rows={3}
                                        />
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            {editingMaterial ? 'Update Material' : 'Add Material'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : materials.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No raw materials found. Click "Add Raw Material" to get started.
                        </div>
                    ) : (
                        <ScrollArea className="h-[600px]">
                            <div className="space-y-4">
                                {materials.map((material) => {
                                    const stockStatus = getStockStatus(material);
                                    const StatusIcon = stockStatus.icon;
                                    const totalValue = material.current_stock * material.unit_price;

                                    return (
                                        <Card key={material.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-semibold">{material.material_name}</h3>
                                                            {material.material_code && (
                                                                <Badge variant="outline">{material.material_code}</Badge>
                                                            )}
                                                            {material.category && (
                                                                <Badge variant="secondary">{material.category}</Badge>
                                                            )}
                                                            <Badge variant={stockStatus.variant} className="gap-1">
                                                                <StatusIcon className="h-3 w-3" />
                                                                {stockStatus.status}
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground">Current Stock:</span>
                                                                <div className="font-semibold">
                                                                    {material.current_stock} {material.unit_of_measurement}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Min Level:</span>
                                                                <div className="font-semibold">
                                                                    {material.minimum_stock_level} {material.unit_of_measurement}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Unit Price:</span>
                                                                <div className="font-semibold">₹{material.unit_price.toFixed(2)}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">Total Value:</span>
                                                                <div className="font-semibold">₹{totalValue.toFixed(2)}</div>
                                                            </div>
                                                        </div>

                                                        {(material.supplier_name || material.storage_location) && (
                                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                                {material.supplier_name && (
                                                                    <span>Supplier: {material.supplier_name}</span>
                                                                )}
                                                                {material.storage_location && (
                                                                    <span>Location: {material.storage_location}</span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {material.description && (
                                                            <p className="text-sm text-muted-foreground">{material.description}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2 ml-4">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleEdit(material)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleDelete(material.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default RawMaterialsInventory;
