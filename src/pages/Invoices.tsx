import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { FileText, Search, Plus, Eye, Edit, Trash2, Filter, Download, RefreshCw, Check, MessageSquare, Printer, X } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useParties } from '@/hooks/useParties';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { SalesInvoice } from '@/types/billing';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { printThermalReceipt } from '@/utils/thermalPrint';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const Invoices = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { invoices, isLoading, deleteInvoice, updateInvoice } = useInvoices();
  const { parties } = useParties();
  const navigate = useNavigate();

  const getPartyForInvoice = (invoice: SalesInvoice) => {
    if (!parties || !invoice.customerId) return null;
    return parties.find(p => p.id === invoice.customerId);
  };

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'draft':
        return 'outline';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'draft':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteInvoice.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await updateInvoice.mutateAsync({ id, updates: { status: 'paid' } });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const handleMarkAsUnpaid = async (id: string) => {
    try {
      await updateInvoice.mutateAsync({ id, updates: { status: 'draft' } });
      toast.success('Invoice marked as unpaid');
    } catch (error) {
      console.error('Error marking invoice as unpaid:', error);
      toast.error('Failed to mark invoice as unpaid');
    }
  };

  const handleWhatsAppReminder = (invoice: SalesInvoice) => {
    const message = encodeURIComponent(
      `Hi ${invoice.customerName},\n\n` +
      `I hope this message finds you well. This is a gentle reminder regarding your pending invoice payment.\n\n` +
      `📄 Invoice Details:\n` +
      `• Invoice Number: ${invoice.invoiceNumber}\n` +
      `• Due Date: ${invoice.dueDate ? format(invoice.dueDate, 'MMM dd, yyyy') : 'N/A'}\n` +
      `• Amount: ₹${invoice.total.toLocaleString()}\n\n` +
      `We kindly request you to process the payment at your earliest convenience. If you have any questions or need assistance, please feel free to reach out to us.\n\n` +
      `Thank you for your continued business and cooperation.\n\n` +
      `Best regards,\n` +
      `[Your Company Name]`
    );

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleThermalPrint = async (invoice: SalesInvoice) => {
    if (isPrinting) return; // Prevent multiple simultaneous print requests

    try {
      setIsPrinting(true);
      const party = getPartyForInvoice(invoice);
      await printThermalReceipt(
        invoice,
        party?.name,
        party?.phone,
        party?.address
      );
      toast.success('Print completed successfully!');
    } catch (error) {
      console.error('Thermal print error:', error);
      toast.error('Failed to print. Please try again or check your printer connection.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportToExcel = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }

    try {
      // Prepare data for Excel
      const worksheetData: any[] = [];

      // Add header
      worksheetData.push(['INVOICES DATA EXPORT']);
      worksheetData.push(['Generated on:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')]);
      worksheetData.push([]);

      // Add summary section
      worksheetData.push(['SUMMARY']);
      worksheetData.push(['Total Invoices:', filteredInvoices.length]);
      worksheetData.push(['Total Amount:', `₹${totalAmount.toLocaleString()}`]);
      worksheetData.push(['Paid Amount:', `₹${paidAmount.toLocaleString()}`]);
      worksheetData.push(['Pending Amount:', `₹${pendingAmount.toLocaleString()}`]);
      worksheetData.push(['Paid Invoices:', filteredInvoices.filter(inv => inv.status === 'paid').length]);
      worksheetData.push(['Draft Invoices:', filteredInvoices.filter(inv => inv.status === 'draft').length]);
      worksheetData.push(['Overdue Invoices:', filteredInvoices.filter(inv => inv.status === 'overdue').length]);
      worksheetData.push([]);
      worksheetData.push([]);

      // Add invoice headers
      worksheetData.push([
        'Invoice Number',
        'Customer Name',
        'Customer ID',
        'Date',
        'Due Date',
        'Status',
        'Payment Mode',
        'Cheque Number',
        'Online Method',
        'Subtotal',
        'Discount',
        'Other Charges',
        'Tax Amount',
        'Total',
        'Notes'
      ]);

      // Add invoice data
      filteredInvoices.forEach((invoice) => {
        worksheetData.push([
          invoice.invoiceNumber,
          invoice.customerName,
          invoice.customerId || 'N/A',
          format(new Date(invoice.date), 'yyyy-MM-dd'),
          invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : 'N/A',
          invoice.status.toUpperCase(),
          invoice.paymentMode?.toUpperCase() || 'CASH',
          invoice.paymentMode === 'cheque' ? invoice.chequeNumber || 'N/A' : '-',
          invoice.paymentMode === 'online' ? (invoice.onlinePaymentMethod === 'upi' ? 'UPI' : 'Bank Transfer') : '-',
          invoice.subtotal || 0,
          invoice.discount || 0,
          invoice.otherCharges || 0,
          invoice.taxAmount || 0,
          invoice.total || 0,
          invoice.notes || ''
        ]);
      });

      worksheetData.push([]);
      worksheetData.push([]);

      // Add detailed items section
      worksheetData.push(['INVOICE ITEMS DETAILS']);
      worksheetData.push([]);

      filteredInvoices.forEach((invoice) => {
        worksheetData.push([]);
        const paymentModeStr = invoice.paymentMode === 'cheque'
          ? `Cheque #${invoice.chequeNumber || 'N/A'}`
          : invoice.paymentMode === 'online'
            ? `Online (${invoice.onlinePaymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'})`
            : 'Cash';
        worksheetData.push([`Invoice: ${invoice.invoiceNumber} - ${invoice.customerName} [${paymentModeStr}]`]);
        worksheetData.push(['Date:', format(new Date(invoice.date), 'yyyy-MM-dd'), 'Status:', invoice.status.toUpperCase(), 'Total:', `₹${invoice.total.toLocaleString()}`]);
        worksheetData.push([]);
        worksheetData.push(['Product Name', 'Quantity', 'Price', 'MRP', 'Tax Rate', 'Amount']);

        if (invoice.items && invoice.items.length > 0) {
          invoice.items.forEach((item) => {
            worksheetData.push([
              item.productName,
              item.quantity,
              item.price,
              item.mrp || 0,
              `${item.taxRate}%`,
              item.amount
            ]);
          });

          // Add invoice totals
          worksheetData.push([]);
          worksheetData.push(['', '', '', '', 'Subtotal:', invoice.subtotal || 0]);
          if (invoice.discount && invoice.discount > 0) {
            worksheetData.push(['', '', '', '', 'Discount:', `-₹${invoice.discount.toLocaleString()}`]);
          }
          if (invoice.otherCharges && invoice.otherCharges > 0) {
            worksheetData.push(['', '', '', '', 'Other Charges:', `₹${invoice.otherCharges.toLocaleString()}`]);
          }
          if (invoice.taxAmount && invoice.taxAmount > 0) {
            worksheetData.push(['', '', '', '', 'Tax:', `₹${invoice.taxAmount.toLocaleString()}`]);
          }
          worksheetData.push(['', '', '', '', 'TOTAL:', `₹${invoice.total.toLocaleString()}`]);
        } else {
          worksheetData.push(['No items']);
        }
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Invoice Number
        { wch: 25 }, // Customer Name
        { wch: 15 }, // Customer ID
        { wch: 12 }, // Date
        { wch: 12 }, // Due Date
        { wch: 10 }, // Status
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Discount
        { wch: 15 }, // Other Charges
        { wch: 12 }, // Tax Amount
        { wch: 12 }, // Total
        { wch: 40 }  // Notes
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

      // Generate filename and download
      const filename = `invoices_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success(`Successfully exported ${filteredInvoices.length} invoices!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingAmount = totalAmount - paidAmount;

  // Loading spinner removed as per request

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 relative">
      {/* Global Loading Overlay for Thermal Printing */}
      {isPrinting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('printing')}</h3>
              <p className="text-sm text-gray-600">{t('pleaseWaitPrintingToThermalPrinter')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 glass-card bg-primary-glass">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('invoices')}</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">{t('manageYourSalesInvoices')}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={handleExportToExcel}
            variant="outline"
            disabled={!filteredInvoices || filteredInvoices.length === 0}
            className="w-full sm:w-auto touch-manipulation"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button
            onClick={() => navigate('/create-invoice')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('createInvoice')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <Card className="glass-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary-glass rounded-xl">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('totalInvoices')}</p>
                <p className="text-xl sm:text-2xl font-bold text-card-foreground">{filteredInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-accent-glass rounded-xl">
                <Download className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('paidAmount')}</p>
                <p className="text-xl sm:text-2xl font-bold text-card-foreground">₹{paidAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-destructive-glass rounded-xl">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('pendingAmount')}</p>
                <p className="text-xl sm:text-2xl font-bold text-card-foreground">₹{pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchInvoices')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'draft', 'paid', 'overdue'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? 'bg-primary text-primary-foreground' : 'glass-button'}
                >
                  {t(status)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="glass-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-card-foreground text-lg sm:text-xl">{t('allInvoices')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-card-foreground mb-2">{t('noInvoicesFound')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? t('tryAdjustingSearchFilter')
                  : t('createYourFirstInvoice')
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button
                  onClick={() => navigate('/create-invoice')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createFirstInvoice')}
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {paginatedInvoices.map((invoice) => (
                  <Card key={invoice.id} className="glass-card p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-card-foreground">{invoice.invoiceNumber}</h3>
                          <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(invoice.date, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-card-foreground">₹{invoice.total.toLocaleString()}</p>
                          {invoice.taxAmount > 0 && (
                            <p className="text-xs text-muted-foreground">Tax: ₹{invoice.taxAmount.toLocaleString()}</p>
                          )}
                          <Badge
                            className={cn(
                              "capitalize border text-xs mt-1 max-w-full break-words",
                              getStatusColor(invoice.status)
                            )}
                          >
                            {t(invoice.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Payment Mode Display */}
                        {invoice.paymentMode && invoice.paymentMode !== 'cash' && (
                          <div className="text-xs text-muted-foreground bg-secondary/10 px-2 py-1 rounded">
                            {invoice.paymentMode === 'cheque' && `Cheque: ${invoice.chequeNumber || 'N/A'}`}
                            {invoice.paymentMode === 'online' && `Online: ${invoice.onlinePaymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <InvoiceGenerator invoice={invoice} party={getPartyForInvoice(invoice)}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-button flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t('view')}
                          </Button>
                        </InvoiceGenerator>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleThermalPrint(invoice)}
                          className="glass-button p-2"
                          title="Print to Thermal Printer"
                          disabled={isPrinting}
                        >
                          {isPrinting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </Button>

                        {invoice.status !== 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            className="glass-button text-green-600 hover:bg-green-50 p-2"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}

                        {invoice.status === 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsUnpaid(invoice.id)}
                            className="glass-button text-orange-600 hover:bg-orange-50 p-2"
                            title="Mark as Unpaid"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}

                        {invoice.status === 'overdue' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWhatsAppReminder(invoice)}
                            className="glass-button text-green-600 hover:bg-green-50 p-2"
                            title="Send WhatsApp Payment Reminder"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="glass-button text-destructive hover:bg-destructive-glass p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-card mx-4">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-card-foreground">{t('deleteInvoice')}</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                {t('areYouSureDeleteInvoice')} {invoice.invoiceNumber}? {t('thisActionCannotBeUndone')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="glass-button">{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block rounded-lg glass-card p-1">
                <Table>
                  <TableHeader>
                    <TableRow className="border-glass-border">
                      <TableHead className="text-muted-foreground font-semibold">{t('invoiceHash')}</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">{t('customer')}</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">{t('date')}</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">{t('dueDate')}</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">{t('amount')}</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">Tax</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">Payment Mode</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">{t('status')}</TableHead>
                      <TableHead className="text-muted-foreground font-semibold">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-glass-border">
                        <TableCell className="font-medium text-card-foreground">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-card-foreground">
                          {invoice.customerName}
                        </TableCell>
                        <TableCell className="text-card-foreground">
                          {format(invoice.date, 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-card-foreground">
                          {invoice.dueDate ? format(invoice.dueDate, 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="font-medium text-card-foreground">
                          ₹{invoice.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-card-foreground">
                          {invoice.taxAmount > 0 ? `₹${invoice.taxAmount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-card-foreground">
                          <div className="text-sm">
                            {invoice.paymentMode === 'cash' && 'Cash'}
                            {invoice.paymentMode === 'cheque' && (
                              <div className="flex flex-col">
                                <span className="font-medium">Cheque</span>
                                {invoice.chequeNumber && <span className="text-xs text-muted-foreground">#{invoice.chequeNumber}</span>}
                              </div>
                            )}
                            {invoice.paymentMode === 'online' && (
                              <div className="flex flex-col">
                                <span className="font-medium">Online</span>
                                <span className="text-xs text-muted-foreground">
                                  {invoice.onlinePaymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "capitalize border",
                              getStatusColor(invoice.status)
                            )}
                          >
                            {t(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <InvoiceGenerator invoice={invoice} party={getPartyForInvoice(invoice)}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="glass-button"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </InvoiceGenerator>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleThermalPrint(invoice)}
                              className="glass-button"
                              title="Print to Thermal Printer"
                              disabled={isPrinting}
                            >
                              {isPrinting ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Printer className="h-4 w-4" />
                              )}
                            </Button>

                            {invoice.status !== 'paid' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(invoice.id)}
                                className="glass-button text-green-600 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}

                            {invoice.status === 'paid' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsUnpaid(invoice.id)}
                                className="glass-button text-orange-600 hover:bg-orange-50"
                                title="Mark as Unpaid"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}

                            {invoice.status === 'overdue' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWhatsAppReminder(invoice)}
                                className="glass-button text-green-600 hover:bg-green-50"
                                title="Send WhatsApp Payment Reminder"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="glass-button text-destructive hover:bg-destructive-glass"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass-card">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-card-foreground">{t('deleteInvoice')}</AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    {t('areYouSureDeleteInvoice')} {invoice.invoiceNumber}? {t('thisActionCannotBeUndone')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="glass-button">{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t('delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center px-2">
                  <Pagination>
                    <PaginationContent className="gap-1 sm:gap-2">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={cn(
                            "h-9 w-9 sm:h-10 sm:w-auto sm:px-4 cursor-pointer touch-manipulation",
                            currentPage === 1 && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>

                      {/* Mobile: Show only current, first, and last page */}
                      <div className="flex sm:hidden gap-1">
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(1)}
                              className="h-9 w-9 cursor-pointer touch-manipulation"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        {currentPage > 2 && <span className="flex items-center px-1 text-muted-foreground">...</span>}

                        <PaginationItem>
                          <PaginationLink
                            isActive={true}
                            className="h-9 w-9 cursor-pointer touch-manipulation"
                          >
                            {currentPage}
                          </PaginationLink>
                        </PaginationItem>

                        {currentPage < totalPages - 1 && <span className="flex items-center px-1 text-muted-foreground">...</span>}
                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(totalPages)}
                              className="h-9 w-9 cursor-pointer touch-manipulation"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                      </div>

                      {/* Desktop: Show all pages */}
                      <div className="hidden sm:flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                      </div>

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={cn(
                            "h-9 w-9 sm:h-10 sm:w-auto sm:px-4 cursor-pointer touch-manipulation",
                            currentPage === totalPages && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;