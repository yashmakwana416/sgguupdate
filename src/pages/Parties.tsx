import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useParties, Party, CreatePartyData } from '@/hooks/useParties';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Truck, Loader2, FileText, Copy, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

const PARTY_DRAFT_KEY = 'party_draft';
const PARTY_DIALOG_OPEN_KEY = 'party_dialog_open';
const PARTY_SEARCH_KEY = 'party_search';
const PARTY_PAGE_KEY = 'party_page';

export default function Parties() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return localStorage.getItem(PARTY_SEARCH_KEY) || '';
    } catch {
      return '';
    }
  });
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = localStorage.getItem(PARTY_PAGE_KEY);
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });
  const [itemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(() => {
    try {
      return localStorage.getItem(PARTY_DIALOG_OPEN_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(PARTY_DRAFT_KEY);
      if (draft) {
        return JSON.parse(draft);
      }
    } catch (error) {
      console.error('Error loading party draft:', error);
    }
    return {
      name: '',
      phone: '',
      address: '',
      gstin: '',
      location_link: ''
    };
  };

  const [formData, setFormData] = useState(loadDraft());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const {
    parties,
    isLoading,
    createParty,
    updateParty,
    deleteParty,
    bulkCreateParties
  } = useParties();
  const { toast } = useToast();
  const filteredParties = parties?.filter(party => party.name.toLowerCase().includes(searchTerm.toLowerCase()) || party.address?.toLowerCase().includes(searchTerm.toLowerCase()) || party.phone?.includes(searchTerm)) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredParties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedParties = filteredParties.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Persist search term
  useEffect(() => {
    localStorage.setItem(PARTY_SEARCH_KEY, searchTerm);
  }, [searchTerm]);

  // Persist current page
  useEffect(() => {
    localStorage.setItem(PARTY_PAGE_KEY, currentPage.toString());
  }, [currentPage]);

  // Persist dialog open state
  useEffect(() => {
    localStorage.setItem(PARTY_DIALOG_OPEN_KEY, isDialogOpen.toString());
  }, [isDialogOpen]);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (formData.name || formData.phone || formData.address || formData.gstin || formData.location_link) {
      localStorage.setItem(PARTY_DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      gstin: '',
      location_link: ''
    });
    setEditingParty(null);
    localStorage.removeItem(PARTY_DRAFT_KEY);
    localStorage.removeItem(PARTY_DIALOG_OPEN_KEY);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    try {
      if (editingParty) {
        await updateParty.mutateAsync({
          id: editingParty.id,
          ...formData
        });
      } else {
        await createParty.mutateAsync(formData);
      }
      localStorage.removeItem(PARTY_DRAFT_KEY);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };
  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setFormData({
      name: party.name,
      phone: party.phone || '',
      address: party.address || '',
      gstin: party.gstin || '',
      location_link: party.location_link || ''
    });
    setIsDialogOpen(true);
  };
  const handleDeleteClick = (party: Party) => {
    setPartyToDelete(party);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (partyToDelete) {
      try {
        console.log('Attempting to delete party:', partyToDelete.id, partyToDelete.name);
        await deleteParty.mutateAsync(partyToDelete.id);
        console.log('Party deletion successful');
        setDeleteDialogOpen(false);
        setPartyToDelete(null);
      } catch (error) {
        console.error('Party deletion failed:', error);
        // Error is handled in the hook
      }
    } else {
      console.error('No party selected for deletion');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPartyToDelete(null);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: t('error'),
        description: t('selectCsvFile'),
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const nameIndex = headers.findIndex(h => h.includes('name'));
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const phoneIndex = headers.findIndex(h => h.includes('phone'));
      const addressIndex = headers.findIndex(h => h.includes('address'));
      const gstinIndex = headers.findIndex(h => h.includes('gstin') || h.includes('gst'));

      if (nameIndex === -1) {
        toast({
          title: t('error'),
          description: t('csvNameColumnError'),
          variant: "destructive",
        });
        return;
      }

      const dataRows = lines.slice(1);
      setTotalRecords(dataRows.length);

      // Process data in chunks for rapid import
      const chunkSize = 50; // Process 50 records at a time
      const validParties: CreatePartyData[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const line = dataRows[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));

        const partyData = {
          name: values[nameIndex] || '',
          phone: phoneIndex >= 0 ? values[phoneIndex] || '' : '',
          address: addressIndex >= 0 ? values[addressIndex] || '' : '',
          gstin: gstinIndex >= 0 ? values[gstinIndex] || '' : ''
        };

        if (partyData.name) {
          validParties.push(partyData);
        }
      }

      // Bulk insert in chunks
      let processed = 0;
      for (let i = 0; i < validParties.length; i += chunkSize) {
        const chunk = validParties.slice(i, i + chunkSize);

        // Use requestIdleCallback to prevent blocking UI
        await new Promise(resolve => {
          const processChunk = async () => {
            await bulkCreateParties.mutateAsync(chunk);
            processed += chunk.length;
            setImportProgress(Math.round((processed / validParties.length) * 100));
            resolve(void 0);
          };

          if (window.requestIdleCallback) {
            window.requestIdleCallback(() => processChunk());
          } else {
            setTimeout(() => processChunk(), 0);
          }
        });
      }

      toast({
        title: t('success'),
        description: t('importSuccess', { count: validParties.length }),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('importError'),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setTotalRecords(0);
      event.target.value = '';
    }
  };

  const handleCopyName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast({
        title: t('copied'),
        description: t('copiedToClipboard', { name }),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('copyError'),
        variant: "destructive",
      });
    }
  };

  const handleExportToExcel = () => {
    if (!parties || parties.length === 0) {
      toast({
        title: t('noData'),
        description: t('noDataExport'),
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for Excel export
      const exportData = parties.map(party => ({
        [t('name')]: party.name,
        [t('phone')]: party.phone || '',
        [t('address')]: party.address || '',
        [t('gstin')]: party.gstin || '',
        [t('status')]: party.is_active ? 'Active' : 'Inactive',
        [t('createdDate')]: new Date(party.created_at).toLocaleDateString(),
        [t('updatedDate')]: new Date(party.updated_at).toLocaleDateString()
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 50 }, // Name
        { wch: 15 }, // Phone
        { wch: 60 }, // Address
        { wch: 20 }, // GSTIN
        { wch: 10 }, // Status
        { wch: 15 }, // Created Date
        { wch: 15 }  // Updated Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Parties');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `parties_export_${currentDate}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);

      toast({
        title: t('success'),
        description: t('exportSuccess', { count: parties.length, filename }),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('error'),
        description: t('exportError'),
        variant: "destructive",
      });
    }
  };
  // Removed loading screen - data persists and page loads instantly

  return <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-responsive-lg font-bold text-foreground">{t('parties')}</h1>
          <p className="text-responsive-sm text-muted-foreground mt-1">{t('manageYourPartyInformation')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
        <Button
          onClick={handleExportToExcel}
          disabled={!parties || parties.length === 0}
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm flex-1 sm:flex-none min-w-[80px]"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">{t('export')}</span>
          <span className="xs:hidden">Exp</span>
        </Button>

        <div className="relative flex-1 sm:flex-none min-w-[80px]">
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            disabled={isImporting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="import-file"
          />
          <Button
            disabled={isImporting}
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm w-full"
            asChild
          >
            <label htmlFor="import-file" className="cursor-pointer flex items-center justify-center">
              {isImporting ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isImporting ? t('importing') : t('import')}</span>
              <span className="sm:hidden">{isImporting ? t('importing') : t('import')}</span>
            </label>
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none min-w-[80px]" onClick={resetForm}>
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {t('addParty')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-[95vw] sm:max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-card-foreground text-base sm:text-lg">
                {editingParty ? t('editParty') : t('addNewParty')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="name" className="text-card-foreground text-sm">{t('name')} *</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} className="glass-input mt-1" required />
              </div>
              <div>
                <Label htmlFor="phone" className="text-card-foreground text-sm">{t('phone')}</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({
                  ...formData,
                  phone: e.target.value
                })} className="glass-input mt-1" />
              </div>
              <div>
                <Label htmlFor="address" className="text-card-foreground text-sm">{t('address')}</Label>
                <Input id="address" value={formData.address} onChange={e => setFormData({
                  ...formData,
                  address: e.target.value
                })} className="glass-input mt-1" />
              </div>
              <div>
                <Label htmlFor="gstin" className="text-card-foreground text-sm">{t('gstin')}</Label>
                <Input id="gstin" value={formData.gstin} onChange={e => setFormData({
                  ...formData,
                  gstin: e.target.value
                })} className="glass-input mt-1" />
              </div>
              <div>
                <Label htmlFor="location_link" className="text-card-foreground text-sm">{t('locationLink')}</Label>
                <Input
                  id="location_link"
                  type="url"
                  placeholder={t('enterLocationLink')}
                  value={formData.location_link}
                  onChange={e => setFormData({
                    ...formData,
                    location_link: e.target.value
                  })}
                  className="glass-input mt-1"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingParty ? t('edit') : t('add')} {t('parties')}
                </Button>
                <Button type="button" variant="outline" className="glass-button sm:flex-none" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    {/* Import Progress Bar */}
    {isImporting && (
      <Card className="bg-white">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium">{t('importingProgress')}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{importProgress}%</p>
            </div>
            <Progress value={importProgress} className="w-full h-2 sm:h-3" />
            <p className="text-xs text-muted-foreground">
              {t('processingRecords', { count: totalRecords })}
            </p>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Mobile Card View */}
    <div className="block sm:hidden space-y-2">
      {/* Mobile Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchParties')}
          value={searchTerm}
          onChange={e => handleSearchChange(e.target.value)}
          className="pl-10 bg-white h-9 text-sm"
        />
      </div>

      {paginatedParties.map(party => (
        <Card key={party.id} className="bg-white p-3 shadow-sm border">
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground truncate">{party.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyName(party.name)}
                    className="h-5 w-5 p-0 hover:bg-primary-glass/50 shrink-0 flex-shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground truncate">{party.phone || 'No phone'}</p>
                  <p className="text-xs text-muted-foreground truncate">{party.address || 'No address'}</p>
                  <p className="text-xs text-muted-foreground truncate">{party.gstin || 'No GSTIN'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(party)}
                className="flex-1 text-xs h-8"
                disabled={deleteParty.isPending}
              >
                <Edit className="mr-1 h-3 w-3" />
                {t('edit')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteClick(party)}
                className="flex-1 text-xs glass-button text-destructive hover:bg-destructive-glass h-8"
                disabled={deleteParty.isPending}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                {t('delete')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredParties.length === 0 && !isLoading && (
        <Card className="mobile-card bg-white">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">
              {searchTerm ? t('noPartiesFound') : t('noPartiesYet')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mobile Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2 bg-white border rounded-lg shadow-sm mt-3">
          <div className="text-xs text-muted-foreground flex-1 min-w-0">
            <span className="truncate">{t('showingRange', { start: startIndex + 1, end: Math.min(endIndex, filteredParties.length), total: filteredParties.length })}</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="text-xs px-2 py-1 h-7 min-w-[60px]"
            >
              <span className="hidden sm:inline">{t('previous')}</span>
              <span className="sm:hidden">{t('previous')}</span>
            </Button>

            <span className="text-xs text-muted-foreground px-1 min-w-[40px] text-center">
              {currentPage}/{totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="text-xs px-2 py-1 h-7 min-w-[60px]"
            >
              <span className="hidden sm:inline">{t('next')}</span>
              <span className="sm:hidden">{t('next')}</span>
            </Button>
          </div>
        </div>
      )}
    </div>

    {/* Desktop Table View */}
    <Card className="bg-white hidden sm:block">
      <CardHeader>
        <div className="flex items-center gap-4">
          <CardTitle>{t('partyDirectory')}</CardTitle>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('searchParties')} value={searchTerm} onChange={e => handleSearchChange(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">{t('name')}</TableHead>
                <TableHead className="font-semibold">{t('address')}</TableHead>
                <TableHead className="font-semibold">{t('phone')}</TableHead>
                <TableHead className="font-semibold">{t('gstin')}</TableHead>
                <TableHead className="font-semibold">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedParties.map(party => <TableRow key={party.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{party.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyName(party.name)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{party.address || '-'}</TableCell>
                <TableCell>{party.phone || '-'}</TableCell>
                <TableCell>{party.gstin || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(party)} disabled={deleteParty.isPending}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(party)} className="text-destructive" disabled={deleteParty.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
              {filteredParties.length === 0 && !isLoading && <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? t('noPartiesFound') : t('noPartiesYet')}
                </TableCell>
              </TableRow>}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* Pagination Controls */}
    {filteredParties.length > 0 && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium">{t('showingRange', { start: startIndex + 1, end: Math.min(endIndex, filteredParties.length), total: filteredParties.length })}</span>
          {totalPages > 1 && <span className="hidden sm:inline text-xs bg-primary/10 text-primary px-2 py-1 rounded">{t('pageInfo', { current: currentPage, total: totalPages })}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || totalPages <= 1}
            className="text-xs"
          >
            {t('previous')}
          </Button>

          {/* Page numbers */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0 text-xs"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages <= 1}
            className="text-xs"
          >
            {t('next')}
          </Button>
        </div>
      </div>
    )}

    <DeleteConfirmationDialog
      isOpen={deleteDialogOpen}
      onClose={handleDeleteCancel}
      onConfirm={handleDeleteConfirm}
      title={t('deleteParty')}
      itemName={partyToDelete?.name}
      isLoading={deleteParty.isPending}
      confirmText={t('delete')}
      cancelText={t('cancel')}
    />
  </div>;
}