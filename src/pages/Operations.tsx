import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroupedRawMaterials } from '@/hooks/useRawMaterials';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, FileText, Package, Info, Calendar, ChevronRight, Pencil, Trash2, MoreHorizontal, ClipboardList, X, Clock, User, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BatchSheetGenerator } from '@/components/BatchSheetGenerator';
const Operations = () => {
  const {
    t
  } = useTranslation();
  const {
    toast
  } = useToast();
  const {
    isSuperAdmin
  } = useUserRole();

  // Dialog States
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOrderConfirmDialog, setShowOrderConfirmDialog] = useState(false);
  const [showOrderMaterialsDialog, setShowOrderMaterialsDialog] = useState(false);
  const [selectedOrderLog, setSelectedOrderLog] = useState<any>(null);

  // Form States
  const [batchName, setBatchName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchDetails, setBatchDetails] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, {
    kg: string;
    grams: string;
    checked: boolean;
  }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Data States
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  // Batch Order Log State
  const [orderLogs, setOrderLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const {
    data: groupedMaterials,
    isLoading: materialsLoading
  } = useGroupedRawMaterials();
  useEffect(() => {
    fetchBatches();
    fetchOrderLogs();
  }, []);
  const fetchBatches = async () => {
    try {
      setIsLoadingBatches(true);
      const {
        data,
        error
      } = await supabase.from('batches').select(`
          *,
          batch_items (
            id,
            quantity_kg,
            quantity_grams,
            raw_materials (
              id,
              name,
              display_name
            )
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to load batches",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBatches(false);
    }
  };
  const fetchOrderLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const {
        data,
        error
      } = await supabase.from('batch_orders_log' as any).select('*').order('created_at', {
        ascending: false
      }).limit(50); // Limit to last 50 orders for performance

      if (error) throw error;
      setOrderLogs(data || []);
    } catch (error) {
      console.error('Error fetching order logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };
  const handleCheckboxChange = (materialId: string, checked: boolean) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        checked,
        kg: prev[materialId]?.kg || '',
        grams: prev[materialId]?.grams || ''
      }
    }));
  };
  const handleQuantityChange = (materialId: string, field: 'kg' | 'grams', value: string) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        checked: true,
        // Auto-check if user types
        [field]: value
      }
    }));
  };
  const resetForm = () => {
    setBatchName('');
    setBatchNumber('');
    setBatchDetails('');
    setSelectedMaterials({});
    setEditingBatchId(null);
  };
  const handleDialogClose = () => {
    setShowBatchDialog(false);
    resetForm();
  };
  const handleEditBatch = (batch: any) => {
    setEditingBatchId(batch.id);
    setBatchName(batch.batch_name);
    setBatchNumber(batch.batch_number || '');
    setBatchDetails(batch.batch_details || '');

    // Populate materials
    const materialsMap: Record<string, {
      kg: string;
      grams: string;
      checked: boolean;
    }> = {};

    // First, initialize with existing batch items
    batch.batch_items.forEach((item: any) => {
      if (item.raw_materials) {
        materialsMap[item.raw_materials.id] = {
          checked: true,
          kg: item.quantity_kg.toString(),
          grams: item.quantity_grams.toString()
        };
      }
    });
    setSelectedMaterials(materialsMap);
    setShowBatchDialog(true);
  };
  const handleDeleteClick = (batch: any) => {
    setSelectedBatch(batch);
    setShowDeleteDialog(true);
  };
  const confirmDelete = async () => {
    if (!selectedBatch) return;
    try {
      const {
        error
      } = await supabase.from('batches').delete().eq('id', selectedBatch.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Batch deleted successfully"
      });
      fetchBatches();
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      toast({
        title: "Error",
        description: "Failed to delete batch",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedBatch(null);
    }
  };
  const handleSaveBatch = async () => {
    if (!batchName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a batch name",
        variant: "destructive"
      });
      return;
    }
    const itemsToSave = Object.entries(selectedMaterials).filter(([_, data]) => data.checked).map(([materialId, data]) => ({
      raw_material_id: materialId,
      quantity_kg: parseFloat(data.kg) || 0,
      quantity_grams: parseFloat(data.grams) || 0
    })).filter(item => item.quantity_kg > 0 || item.quantity_grams > 0);
    if (itemsToSave.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one raw material with quantity",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      let batchId = editingBatchId;
      if (editingBatchId) {
        // Update existing batch
        const {
          error: updateError
        } = await supabase.from('batches').update({
          batch_name: batchName,
          batch_number: batchNumber || null,
          batch_details: batchDetails,
          updated_at: new Date().toISOString()
        }).eq('id', editingBatchId);
        if (updateError) throw updateError;

        // Delete existing items to replace with new ones (simpler than diffing)
        const {
          error: deleteItemsError
        } = await supabase.from('batch_items').delete().eq('batch_id', editingBatchId);
        if (deleteItemsError) throw deleteItemsError;
      } else {
        // Create new batch
        const {
          data: batchData,
          error: batchError
        } = await supabase.from('batches').insert({
          batch_name: batchName,
          batch_number: batchNumber || null,
          batch_details: batchDetails
        }).select().single();
        if (batchError) throw batchError;
        batchId = batchData.id;
      }
      if (!batchId) throw new Error("Failed to get batch ID");

      // Insert batch items
      const batchItems = itemsToSave.map(item => ({
        batch_id: batchId,
        raw_material_id: item.raw_material_id,
        quantity_kg: item.quantity_kg,
        quantity_grams: item.quantity_grams
      }));
      const {
        error: itemsError
      } = await supabase.from('batch_items').insert(batchItems);
      if (itemsError) throw itemsError;
      toast({
        title: "Success",
        description: `Batch ${editingBatchId ? 'updated' : 'created'} successfully!`
      });
      handleDialogClose();
      fetchBatches(); // Refresh list
    } catch (error: any) {
      console.error('Error saving batch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save batch",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleOrderClick = (batch: any) => {
    setSelectedBatch(batch);
    setShowOrderConfirmDialog(true);
  };
  const handleViewOrderMaterials = (orderLog: any) => {
    setSelectedOrderLog(orderLog);
    setShowOrderMaterialsDialog(true);
  };
  const handleConfirmOrder = async () => {
    if (!selectedBatch) return;
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();

      // Create snapshot of batch items with material details
      const batchItemsSnapshot = selectedBatch.batch_items?.map((item: any) => ({
        material_id: item.raw_materials?.id,
        material_name: item.raw_materials?.display_name || item.raw_materials?.name,
        quantity_kg: item.quantity_kg,
        quantity_grams: item.quantity_grams
      })) || [];

      // Call the database function to log order and deduct inventory atomically
      const {
        data,
        error
      } = (await supabase.rpc('deduct_inventory_for_batch_order' as any, {
        p_batch_id: selectedBatch.id,
        p_batch_name: selectedBatch.batch_name,
        p_batch_number: selectedBatch.batch_number || selectedBatch.id.substring(0, 8).toUpperCase(),
        p_user_id: user?.id,
        p_user_name: user?.email?.split('@')[0] || 'Unknown User',
        p_batch_items_snapshot: batchItemsSnapshot
      })) as any;
      if (error) throw error;

      // Check if the function returned an error
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to process batch order');
      }
      toast({
        title: "Order Logged & Inventory Updated",
        description: `Order for ${selectedBatch.batch_name} logged successfully. Raw materials inventory has been automatically deducted.`,
        duration: 5000
      });
      fetchOrderLogs(); // Refresh log list
    } catch (error: any) {
      console.error('Error logging order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to log order",
        variant: "destructive",
        duration: 6000
      });
    } finally {
      setShowOrderConfirmDialog(false);
      setSelectedBatch(null);
    }
  };
  return <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
          <p className="text-muted-foreground">
            Manage production batches and raw material usage
          </p>
        </div>
        {isSuperAdmin() && <Button onClick={() => setShowBatchDialog(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add Batch
          </Button>}
      </div>

      {isSuperAdmin()}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent Batches</h2>
        {isLoadingBatches ? <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> : batches.length === 0 ? <div className="text-center py-12 border rounded-lg bg-muted/10">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">No batches found</h3>
            <p className="text-muted-foreground">Create your first production batch to get started.</p>
          </div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batches.map(batch => <Card key={batch.id} className="hover:shadow-md transition-shadow group relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-semibold line-clamp-1" title={batch.batch_name}>
                        {batch.batch_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(batch.created_at), 'PPP')}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleOrderClick(batch)} title="Log Order">
                        <ClipboardList className="h-4 w-4" />
                      </Button>

                      {isSuperAdmin() && <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditBatch(batch)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClick(batch)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground line-clamp-2 mb-3 h-10">
                    {batch.batch_details || "No additional details provided."}
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <Badge variant="secondary" className="font-normal">
                      {batch.batch_items?.length || 0} Materials
                    </Badge>
                    <BatchSheetGenerator batch={batch}>
                      <Button variant="link" className="h-auto p-0 text-primary">
                        View Details <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </BatchSheetGenerator>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>

      {/* Recent Batch Orders Log */}
      <div className="space-y-4 pt-8 border-t">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Batch Orders</h2>
        </div>

        {isLoadingLogs ? <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div> : orderLogs.length === 0 ? <div className="text-center py-8 border rounded-lg bg-muted/5">
            <p className="text-muted-foreground">No orders logged yet.</p>
          </div> : <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Ordered By</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLogs.map(log => <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(log.created_at), 'PPP p')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">{log.batch_name}</span>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {log.batch_number || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {log.user_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleViewOrderMaterials(log)} title="View Materials Used">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>}
      </div>

      {/* Create/Edit Batch Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={open => !open && handleDialogClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingBatchId ? 'Edit Batch' : 'Add New Batch'}</DialogTitle>
            <DialogDescription>
              {editingBatchId ? 'Update batch details and raw materials.' : 'Enter batch details and select raw materials used.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="batchName">Batch Name *</Label>
                <Input id="batchName" placeholder="e.g., Morning Batch A-1" value={batchName} onChange={e => setBatchName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input id="batchNumber" placeholder="e.g., B-001 or 2024-001" value={batchNumber} onChange={e => setBatchNumber(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="batchDetails">Batch Details</Label>
                <Textarea id="batchDetails" placeholder="Any additional notes about this batch..." value={batchDetails} onChange={e => setBatchDetails(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Raw Materials</Label>
              {materialsLoading ? <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div> : <div className="space-y-6 border rounded-lg p-4">
                  {groupedMaterials?.map(group => <div key={group.material_id} className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {group.base_material_name}
                      </h3>
                      <div className="grid gap-3 pl-2">
                        {group.variants.map(variant => {
                    const state = selectedMaterials[variant.id] || {
                      checked: false,
                      kg: '',
                      grams: ''
                    };
                    return <div key={variant.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-lg transition-colors ${state.checked ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox id={`material-${variant.id}`} checked={state.checked} onCheckedChange={checked => handleCheckboxChange(variant.id, checked as boolean)} />
                                <div className="grid gap-1">
                                  <Label htmlFor={`material-${variant.id}`} className="font-medium cursor-pointer">
                                    {variant.display_name || variant.name}
                                    {variant.variant_name && <span className="ml-2 text-sm text-muted-foreground">
                                        ({variant.variant_type}: {variant.variant_name})
                                      </span>}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    Stock: {variant.current_stock_kg} kg {variant.current_stock_grams}g
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="grid gap-1 flex-1 sm:w-24">
                                  <Label htmlFor={`kg-${variant.id}`} className="text-xs text-muted-foreground">Kg</Label>
                                  <Input id={`kg-${variant.id}`} type="number" placeholder="0" value={state.kg} onChange={e => handleQuantityChange(variant.id, 'kg', e.target.value)} min="0" className="h-9" />
                                </div>
                                <div className="grid gap-1 flex-1 sm:w-24">
                                  <Label htmlFor={`gms-${variant.id}`} className="text-xs text-muted-foreground">Gms</Label>
                                  <Input id={`gms-${variant.id}`} type="number" placeholder="0" value={state.grams} onChange={e => handleQuantityChange(variant.id, 'grams', e.target.value)} min="0" max="999" className="h-9" />
                                </div>
                              </div>
                            </div>;
                  })}
                      </div>
                    </div>)}
                </div>}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveBatch} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBatchId ? 'Update Batch' : 'Save Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Horizontal Row for Date, Name, Details */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/10 items-start sm:items-center">
              <div className="flex flex-col min-w-[120px]">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedBatch && format(new Date(selectedBatch.created_at), 'PPP')}</span>
                </div>
              </div>

              <div className="hidden sm:block h-10 w-px bg-border" />

              <div className="flex flex-col min-w-[150px]">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Batch Name</span>
                <span className="font-medium text-primary">{selectedBatch?.batch_name}</span>
              </div>

              <div className="hidden sm:block h-10 w-px bg-border" />

              <div className="flex flex-col flex-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Details</span>
                <span className="text-sm text-muted-foreground">{selectedBatch?.batch_details || "No details provided"}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Raw Materials Used
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Material Name</TableHead>
                      <TableHead className="text-right">Quantity Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBatch?.batch_items?.map((item: any) => <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.raw_materials?.display_name || item.raw_materials?.name || 'Unknown Material'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">
                              {item.quantity_kg > 0 && `${item.quantity_kg} kg`}
                              {item.quantity_kg > 0 && item.quantity_grams > 0 && ' '}
                              {item.quantity_grams > 0 && `${item.quantity_grams} g`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total: {(item.quantity_kg * 1000 + item.quantity_grams).toLocaleString()} g
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>)}
                    {(!selectedBatch?.batch_items || selectedBatch.batch_items.length === 0) && <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                          No raw materials recorded for this batch.
                        </TableCell>
                      </TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <AlertDialog open={showOrderConfirmDialog} onOpenChange={setShowOrderConfirmDialog}>
        <AlertDialogContent className="sm:max-w-[500px] border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-lg opacity-60" />

          <AlertDialogHeader className="relative space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 blur-xl opacity-40 animate-pulse" />
              </div>
            </div>

            <AlertDialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Confirm Order Log
            </AlertDialogTitle>

            <AlertDialogDescription className="text-center space-y-3 text-base">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-green-100 shadow-sm">
                <p className="text-gray-700">
                  You are about to log an order for:
                </p>
                <p className="text-lg font-semibold text-green-700 mt-2 flex items-center justify-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  {selectedBatch?.batch_name}
                </p>
              </div>

              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                This will create a permanent record with the current timestamp
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="relative flex-col sm:flex-row gap-2 sm:gap-2">
            <AlertDialogCancel className="mt-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOrder} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <ClipboardList className="h-4 w-4 mr-2" />
              Confirm Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the batch
              "{selectedBatch?.batch_name}" and its associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Materials Viewing Dialog */}
      <Dialog open={showOrderMaterialsDialog} onOpenChange={setShowOrderMaterialsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Materials Used in Order
            </DialogTitle>
            <DialogDescription>
              Raw materials used in <strong>{selectedOrderLog?.batch_name}</strong> at the time of ordering
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedOrderLog?.batch_items_snapshot && selectedOrderLog.batch_items_snapshot.length > 0 ? <div className="border rounded-lg  overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Material Name</TableHead>
                      <TableHead className="text-right">Quantity Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrderLog.batch_items_snapshot.map((item: any, index: number) => <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.material_name || 'Unknown Material'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">
                              {item.quantity_kg > 0 && `${item.quantity_kg} kg`}
                              {item.quantity_kg > 0 && item.quantity_grams > 0 && ' '}
                              {item.quantity_grams > 0 && `${item.quantity_grams} g`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total: {(item.quantity_kg * 1000 + item.quantity_grams).toLocaleString()} g
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div> : <div className="text-center py-8 border rounded-lg bg-muted/5">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No materials data available</p>
              </div>}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowOrderMaterialsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Operations;