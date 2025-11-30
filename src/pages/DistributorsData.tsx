import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Filter, Receipt, TrendingUp, DollarSign, FileText, Download, ArrowLeft, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface Distributor {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  invoiceCount: number;
  totalAmount: number;
}

export default function DistributorsData() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [distributorInvoicesData, setDistributorInvoicesData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch distributors
  const { data: distributors, isLoading: distributorsLoading } = useQuery({
    queryKey: ['distributors'],
    queryFn: async () => {
      // Get users with distributor role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'distributor');

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) return [];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userRoles.map(ur => ur.user_id));

      if (profilesError) throw profilesError;

      // Calculate invoice stats for each distributor using RPC function
      const distributorsWithStats: Distributor[] = await Promise.all(
        profiles?.map(async (profile) => {
          const { data: invoices, error } = await supabase
            .rpc('get_distributor_invoices', { distributor_user_id: profile.id });

          if (error) {
            console.error('Error fetching invoices for distributor:', error);
            return {
              id: profile.id,
              email: profile.email,
              first_name: profile.first_name,
              last_name: profile.last_name,
              invoiceCount: 0,
              totalAmount: 0
            };
          }

          return {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            invoiceCount: invoices?.length || 0,
            totalAmount: invoices?.reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0) || 0
          };
        }) || []
      );

      return distributorsWithStats;
    }
  });

  // Fetch distributor invoices when a distributor is selected
  useEffect(() => {
    const fetchDistributorInvoices = async () => {
      if (!selectedDistributor) {
        setDistributorInvoicesData([]);
        return;
      }

      try {
        const { data: invoices, error: invoicesError } = await supabase
          .rpc('get_distributor_invoices', { distributor_user_id: selectedDistributor.id });

        if (invoicesError) throw invoicesError;

        // Fetch items for each invoice
        const invoicesWithItems = await Promise.all(
          (invoices || []).map(async (invoice: any) => {
            const { data: items, error: itemsError } = await supabase
              .rpc('get_distributor_invoice_items', { p_invoice_id: invoice.id });

            if (itemsError) {
              console.error('Error fetching items:', itemsError);
              return { ...invoice, items: [] };
            }

            return { ...invoice, items: items || [] };
          })
        );

        setDistributorInvoicesData(invoicesWithItems);
      } catch (error) {
        console.error('Error fetching distributor data:', error);
        toast.error('Failed to load distributor invoices');
        setDistributorInvoicesData([]);
      }
    };

    fetchDistributorInvoices();
  }, [selectedDistributor]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedDistributor]);

  // Use the fetched distributor invoices
  const distributorInvoices = distributorInvoicesData;

  // Apply search and status filters
  const filteredInvoices = distributorInvoices.filter((invoice: any) => {
    const matchesSearch =
      (invoice.invoice_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (invoice.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Download invoice data as Excel
  const downloadInvoiceData = () => {
    if (!selectedDistributor || filteredInvoices.length === 0) {
      toast.error('No data to download');
      return;
    }

    try {
      // Prepare data for Excel
      const worksheetData: any[] = [];

      // Add distributor header
      worksheetData.push(['Distributor Data Export']);
      worksheetData.push(['Generated on:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')]);
      worksheetData.push([]);
      worksheetData.push(['Distributor Name:', getDistributorName(selectedDistributor)]);
      worksheetData.push(['Distributor Email:', selectedDistributor.email]);
      worksheetData.push([]);

      // Add summary section
      worksheetData.push(['Summary']);
      worksheetData.push(['Total Invoices:', filteredInvoices.length]);
      worksheetData.push(['Total Amount:', `₹${filteredInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0).toLocaleString()}`]);
      worksheetData.push(['Paid Invoices:', filteredInvoices.filter((inv: any) => inv.status === 'paid').length]);
      worksheetData.push(['Draft Invoices:', filteredInvoices.filter((inv: any) => inv.status === 'draft').length]);
      worksheetData.push(['Overdue Invoices:', filteredInvoices.filter((inv: any) => inv.status === 'overdue').length]);
      worksheetData.push([]);

      // Add invoice headers
      worksheetData.push([
        'Invoice Number',
        'Customer Name',
        'Date',
        'Due Date',
        'Status',
        'Subtotal',
        'Discount',
        'Other Charges',
        'Tax Amount',
        'Total',
        'Notes'
      ]);

      // Add invoice data
      filteredInvoices.forEach((invoice: any) => {
        worksheetData.push([
          invoice.invoice_number,
          invoice.customer_name,
          format(new Date(invoice.date), 'yyyy-MM-dd'),
          invoice.due_date ? format(new Date(invoice.due_date), 'yyyy-MM-dd') : '',
          invoice.status,
          invoice.subtotal || 0,
          invoice.discount || 0,
          invoice.other_charges || 0,
          invoice.tax_amount || 0,
          invoice.total || 0,
          invoice.notes || ''
        ]);
      });

      worksheetData.push([]);
      worksheetData.push([]);

      // Add detailed items section
      worksheetData.push(['Invoice Items Details']);
      filteredInvoices.forEach((invoice: any) => {
        worksheetData.push([]);
        worksheetData.push([`Invoice: ${invoice.invoice_number} - ${invoice.customer_name}`]);
        worksheetData.push(['Product Name', 'Quantity', 'Price', 'MRP', 'Tax Rate', 'Amount']);

        if (invoice.items && invoice.items.length > 0) {
          invoice.items.forEach((item: any) => {
            worksheetData.push([
              item.product_name,
              item.quantity,
              item.price,
              item.mrp || 0,
              `${item.tax_rate}%`,
              item.amount
            ]);
          });
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
        { wch: 12 }, // Date
        { wch: 12 }, // Due Date
        { wch: 10 }, // Status
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Discount
        { wch: 15 }, // Other Charges
        { wch: 12 }, // Tax Amount
        { wch: 12 }, // Total
        { wch: 30 }  // Notes
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Distributor Data');

      // Generate filename and download
      const filename = `${selectedDistributor.email.split('@')[0]}_data_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success('Data downloaded successfully!');
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Failed to download data');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'draft': return 'bg-gray-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTranslatedStatus = (status: string) => {
    switch (status) {
      case 'paid': return t('paidStatus');
      case 'draft': return t('draftStatus');
      case 'overdue': return t('overdueStatus');
      default: return status;
    }
  };

  const getDistributorName = (distributor: Distributor) => {
    const name = `${distributor.first_name || ''} ${distributor.last_name || ''}`.trim();
    return name || distributor.email;
  };

  // Show distributor list
  if (!selectedDistributor) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('distributorsData')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('selectDistributorToViewData')}</p>
        </div>

        {/* Distributors List */}
        <Card className="glass-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">{t('distributors')}</CardTitle>
            <CardDescription className="text-sm">{t('clickDistributorToViewInvoices')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {distributors && distributors.length > 0 ? (
              <div className="grid gap-3 sm:gap-4">
                {distributors.map((distributor) => (
                  <div
                    key={distributor.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors gap-3 sm:gap-4 touch-manipulation"
                    onClick={() => setSelectedDistributor(distributor)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-muted-foreground truncate">{distributor.email}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-base sm:text-lg">{distributor.invoiceCount}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{t('invoicesText')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-base sm:text-lg">₹{distributor.totalAmount.toLocaleString()}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{t('totalAmount')}</div>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('view')}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                {t('noDistributorsFound')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show selected distributor's invoices
  const totalInvoices = distributorInvoices.length;
  const totalAmount = distributorInvoices.reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0);
  const paidInvoices = distributorInvoices.filter((invoice: any) => invoice.status === 'paid').length;
  const draftInvoices = distributorInvoices.filter((invoice: any) => invoice.status === 'draft').length;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedDistributor(null)}
          className="w-fit touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToDistributors')}
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            {getDistributorName(selectedDistributor)} - Invoices
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">{selectedDistributor.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('totalInvoices')}</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('totalAmount')}</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">₹{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('paidInvoices')}</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{paidInvoices}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('draftInvoices')}</CardTitle>
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{draftInvoices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl">{t('invoicesText')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm truncate">{t('allInvoicesCreatedBy')} {getDistributorName(selectedDistributor)}</CardDescription>
            </div>
            <Button
              onClick={downloadInvoiceData}
              disabled={filteredInvoices.length === 0}
              className="flex items-center gap-2 w-full sm:w-auto touch-manipulation"
              size="sm"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">{t('downloadData')}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchInvoices')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="draft">{t('draft')}</SelectItem>
                <SelectItem value="paid">{t('paid')}</SelectItem>
                <SelectItem value="overdue">{t('overdue')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {paginatedInvoices.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {t('noInvoicesFound')}
              </div>
            ) : (
              paginatedInvoices.map((invoice: any) => (
                <Card key={invoice.id} className="glass-card p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground truncate">{invoice.customer_name}</p>
                      </div>
                      <Badge className={`${getStatusColor(invoice.status)} text-white text-xs shrink-0`}>
                        {getTranslatedStatus(invoice.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {format(new Date(invoice.date), 'MMM dd, yyyy')}
                      </span>
                      <span className="font-semibold text-sm">₹{invoice.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">{t('invoiceNumber')}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t('customer')}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t('date')}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t('status')}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                      {t('noInvoicesFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{invoice.customer_name}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {format(new Date(invoice.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(invoice.status)} text-white text-xs`}>
                          {getTranslatedStatus(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">₹{invoice.total?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(p => Math.max(1, p - 1));
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, current, and neighbors
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={page === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(p => Math.min(totalPages, p + 1));
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}