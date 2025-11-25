import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesInvoice } from '@/types/billing';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Helper function to format date without timezone issues
const formatDateForDB = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export interface SalesInvoiceDB {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  date: string;
  due_date?: string;
  subtotal: number;
  discount?: number;
  other_charges?: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  payment_mode?: string;
  cheque_number?: string;
  online_payment_method?: string;
  previous_balance?: number;
  paid_amount?: number;
}

export interface SalesInvoiceItemDB {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  mrp: number;
  tax_rate: number;
  amount: number;
  created_at: string;
}

// Transform database format to frontend format
const transformInvoiceFromDB = (dbInvoice: SalesInvoiceDB, items: SalesInvoiceItemDB[]): SalesInvoice & { createdBy?: string } => {
  // Auto-mark as overdue if due date has passed and not paid
  let status = dbInvoice.status;
  if (dbInvoice.due_date && status !== 'paid') {
    const today = new Date();
    const dueDate = new Date(dbInvoice.due_date);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (today > dueDate) {
      status = 'overdue';
    }
  }

  // Recalculate total to ensure it's always correct (subtotal - discount + otherCharges)
  const calculatedTotal = dbInvoice.subtotal - (dbInvoice.discount || 0) + (dbInvoice.other_charges || 0);

  return {
    id: dbInvoice.id,
    invoiceNumber: dbInvoice.invoice_number,
    customerId: dbInvoice.customer_id || '',
    customerName: dbInvoice.customer_name,
    date: new Date(dbInvoice.date),
    dueDate: dbInvoice.due_date ? new Date(dbInvoice.due_date) : undefined,
    items: items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      price: item.price,
      mrp: item.mrp || 0,
      taxRate: item.tax_rate,
      amount: item.amount
    })),
    subtotal: dbInvoice.subtotal,
    discount: dbInvoice.discount,
    otherCharges: dbInvoice.other_charges,
    taxAmount: dbInvoice.tax_amount,
    total: calculatedTotal,
    status: status,
    notes: dbInvoice.notes,
    createdAt: new Date(dbInvoice.created_at),
    createdBy: dbInvoice.created_by,
    paymentMode: (dbInvoice.payment_mode as 'cash' | 'cheque' | 'online') || 'cash',
    chequeNumber: dbInvoice.cheque_number,
    onlinePaymentMethod: dbInvoice.online_payment_method as 'upi' | 'bank_transfer' | undefined,
    previousBalance: dbInvoice.previous_balance || 0,
    paidAmount: dbInvoice.paid_amount || 0
  };
};

export const useInvoices = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const invoicesQuery = useQuery({
    queryKey: ['invoices', user?.id || 'anon'],
    enabled: !authLoading && !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Fetch invoices with their items (RLS scopes to current user)
      const { data: invoices, error: invoicesError } = await supabase
        .from('sales_invoices')
        .select('*, created_by')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      const invoiceIds = invoices?.map(inv => inv.id) || [];
      if (invoiceIds.length === 0) return [];

      const { data: items, error: itemsError } = await supabase
        .from('sales_invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds);

      if (itemsError) throw itemsError;

      return (
        invoices?.map(invoice => {
          const invoiceItems = items?.filter(item => item.invoice_id === invoice.id) || [];
          
          // Calculate previous balance for this customer
          const previousBalance = invoices
            .filter(inv => 
              inv.customer_id === invoice.customer_id && 
              inv.customer_id && // Only if customer_id exists
              new Date(inv.created_at) < new Date(invoice.created_at) &&
              inv.status !== 'paid'
            )
            .reduce((sum, inv) => sum + Number(inv.total), 0);
          
          const transformed = transformInvoiceFromDB(invoice as SalesInvoiceDB, invoiceItems as SalesInvoiceItemDB[]);
          return {
            ...transformed,
            previousBalance: invoice.previous_balance || previousBalance,
            paidAmount: invoice.paid_amount || 0
          };
        }) || []
      );
    },
  });

  // Realtime updates to keep invoices list fresh per-user
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('invoices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_invoices' }, () => {
        queryClient.invalidateQueries({ queryKey: ['invoices', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_invoice_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['invoices', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate previous balance for this customer
      let previousBalance = 0;
      if (invoiceData.customerId) {
        const { data: previousInvoices } = await supabase
          .from('sales_invoices')
          .select('total, status')
          .eq('customer_id', invoiceData.customerId)
          .neq('status', 'paid')
          .eq('created_by', user.id);
        
        if (previousInvoices) {
          previousBalance = previousInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
        }
      }

      // Database will auto-generate invoice number via trigger

      // Create the invoice first
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert({
          invoice_number: '', // Will be auto-generated by database trigger
          customer_name: invoiceData.customerName,
          customer_id: invoiceData.customerId || null,
          date: formatDateForDB(invoiceData.date),
          due_date: invoiceData.dueDate ? formatDateForDB(invoiceData.dueDate) : null,
          subtotal: invoiceData.subtotal,
          discount: invoiceData.discount || null,
          other_charges: invoiceData.otherCharges || null,
          tax_amount: invoiceData.taxAmount,
          total: invoiceData.total,
          status: invoiceData.status,
          notes: invoiceData.notes || null,
          created_by: user.id,
          payment_mode: invoiceData.paymentMode || 'cash',
          cheque_number: invoiceData.chequeNumber || null,
          online_payment_method: invoiceData.onlinePaymentMethod || null,
          previous_balance: previousBalance,
          paid_amount: invoiceData.paidAmount || (invoiceData.status === 'paid' ? invoiceData.total : 0)
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      let createdItems: SalesInvoiceItemDB[] = [];
      if (invoiceData.items.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('sales_invoice_items')
          .insert(
            invoiceData.items.map(item => ({
              invoice_id: invoice.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              price: item.price,
              mrp: item.mrp,
              tax_rate: item.taxRate,
              amount: item.amount
            }))
          )
          .select();

        if (itemsError) throw itemsError;
        createdItems = items as SalesInvoiceItemDB[];
      }

      const transformed = transformInvoiceFromDB(invoice as SalesInvoiceDB, createdItems);
      return {
        ...transformed,
        previousBalance,
        paidAmount: invoiceData.paidAmount || (invoiceData.status === 'paid' ? invoiceData.total : 0)
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: `Invoice ${data.invoiceNumber} created successfully! Product stock updated.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SalesInvoice> }) => {
      const { data, error } = await supabase
        .from('sales_invoices')
        .update({
          customer_name: updates.customerName,
          date: updates.date ? formatDateForDB(updates.date) : undefined,
          due_date: updates.dueDate ? formatDateForDB(updates.dueDate) : null,
          status: updates.status,
          notes: updates.notes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Invoice updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      const toastInstance = toast({
        title: "Success",
        description: "Invoice deleted successfully! Product stock restored.",
      });
      
      // Auto-dismiss after 0.5 seconds
      setTimeout(() => {
        toastInstance.dismiss();
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  return {
    invoices: invoicesQuery.data,
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  };
};