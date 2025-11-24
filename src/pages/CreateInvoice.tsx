import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FileText, Plus, Minus, Calculator, Save, Printer, Trash2, Check, ChevronsUpDown, UserPlus, Calendar as CalendarIcon, Eye, Clock, Copy, Download, MessageCircle, X, RefreshCw } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useParties } from '@/hooks/useParties';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { BillOfSupply } from '@/components/BillOfSupply';
import { ProductListSelector } from '@/components/ProductListSelector';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { SalesInvoice } from '@/types/billing';
import { printThermalReceipt } from '@/utils/thermalPrint';

import { supabase } from '@/integrations/supabase/client';
interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number | string;
  price: number | string;
  mrp: number;
  taxRate: number;
  amount: number;
}
const CreateInvoice = () => {
  const { t } = useTranslation();
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [partySearchOpen, setPartySearchOpen] = useState(false);
  const [partySearchValue, setPartySearchValue] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [invoiceDate] = useState(new Date().toISOString().slice(0, 10)); // Only date, no time
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [isDebt, setIsDebt] = useState(false);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'cheque' | 'online'>('cash');
  const [chequeNumber, setChequeNumber] = useState('');
  const [onlinePaymentMethod, setOnlinePaymentMethod] = useState<'upi' | 'bank_transfer' | ''>('');
  const [showOnlineDialog, setShowOnlineDialog] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [showNewPartyForm, setShowNewPartyForm] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<SalesInvoice | null>(null);
  const [createdInvoiceParty, setCreatedInvoiceParty] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const {
    products
  } = useProducts();
  const {
    parties,
    createParty
  } = useParties();
  const {
    createInvoice
  } = useInvoices();
  const {
    toast
  } = useToast();
  const addItem = () => {
    if (!selectedProductId) return;
    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if product already exists in items
    const existingItemIndex = items.findIndex(item => item.productId === product.id);

    if (existingItemIndex !== -1) {
      // Product already exists, increase quantity
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      const currentQty: number = typeof existingItem.quantity === 'string' ? Number(existingItem.quantity) || 0 : existingItem.quantity;
      const currentPrice: number = typeof existingItem.price === 'string' ? Number(existingItem.price) || 0 : existingItem.price;
      const newQuantity: number = currentQty + 1;
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        amount: newQuantity * currentPrice
      };
      setItems(updatedItems);
    } else {
      // Product doesn't exist, add new item
      const newItem: InvoiceItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        mrp: product.mrp,
        taxRate: product.tax_rate,
        amount: product.price
      };
      setItems([...items, newItem]);
    }

    setSelectedProductId('');
  };
  const updateItem = (id: string, field: keyof InvoiceItem, value: number | string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          [field]: value
        };
        if (field === 'quantity' || field === 'price') {
          const qty = typeof updated.quantity === 'string' ? updated.quantity === '' ? 0 : Number(updated.quantity) : updated.quantity;
          const price = typeof updated.price === 'string' ? updated.price === '' ? 0 : Number(updated.price) : updated.price;
          updated.amount = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.amount * item.taxRate / 100, 0);
    // Total = subtotal - discount + otherCharges (no tax included as per business requirement)
    const total = subtotal - (discount || 0) + (otherCharges || 0);
    return {
      subtotal,
      discount: discount || 0,
      otherCharges: otherCharges || 0,
      taxAmount,
      total
    };
  };
  const handlePartySelect = (party: any) => {
    setSelectedParty(party);
    setCustomerName(party.name);
    setCustomerPhone(party.phone || '');
    setCustomerAddress(party.address || '');
    setCustomerEmail(party.email || '');
    setCustomerGstin(party.gstin || '');
    setPartySearchValue(party.name);
    setPartySearchOpen(false);
    setShowNewPartyForm(false);
  };
  const handleCreateNewParty = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a party name",
        variant: "destructive"
      });
      return;
    }
    try {
      const newParty = await createParty.mutateAsync({
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        email: customerEmail,
        gstin: customerGstin
      });
      setSelectedParty(newParty);
      setShowNewPartyForm(false);
      setPartySearchOpen(false);
      setPartySearchValue(newParty.name);
      toast({
        title: "Success",
        description: "Party created successfully!"
      });
    } catch (error) {
      console.error('Error creating party:', error);
    }
  };
  const handleSaveInvoice = async () => {
    if (!customerName.trim() || items.length === 0) {
      toast({
        title: "Error",
        description: "Please select a party and add at least one item",
        variant: "destructive"
      });
      return;
    }
    const {
      subtotal,
      discount: discountAmount,
      otherCharges: otherChargesAmount,
      taxAmount,
      total
    } = calculateTotals();

    // Use selected party ID or generate a new one
    const customerId = selectedParty?.id || crypto.randomUUID();
    const invoiceData = {
      customerId,
      customerName,
      date: new Date(),
      dueDate,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: typeof item.quantity === 'string' ? item.quantity === '' ? 0 : Number(item.quantity) : item.quantity,
        price: typeof item.price === 'string' ? item.price === '' ? 0 : Number(item.price) : item.price,
        mrp: item.mrp,
        taxRate: item.taxRate,
        amount: item.amount
      })),
      subtotal,
      discount: discountAmount > 0 ? discountAmount : undefined,
      otherCharges: otherChargesAmount > 0 ? otherChargesAmount : undefined,
      taxAmount,
      total,
      notes: notes || undefined,
      status: isDebt ? 'draft' as const : 'paid' as const,
      paymentMode,
      chequeNumber: paymentMode === 'cheque' ? chequeNumber : undefined,
      onlinePaymentMethod: paymentMode === 'online' && onlinePaymentMethod ? onlinePaymentMethod as 'upi' | 'bank_transfer' : undefined
    };
    try {
      const result = await createInvoice.mutateAsync(invoiceData);



      // Store created invoice and party info for preview
      setCreatedInvoice(result);
      setCreatedInvoiceParty({
        id: selectedParty?.id || customerId,
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        location_link: selectedParty?.location_link
      });

      // Reset form after successful creation
      setSelectedParty(null);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerEmail('');
      setCustomerGstin('');
      setDueDate(undefined);
      setIsDebt(false);
      setNotes('');
      setDiscount(0);
      setOtherCharges(0);
      setItems([]);
      setPartySearchValue('');
      setShowNewPartyForm(false);
      setPaymentMode('cash');
      setChequeNumber('');
      setOnlinePaymentMethod('');
      setShowOnlineDialog(false);

      // Scroll to the created invoice preview
      setTimeout(() => {
        const previewElement = document.getElementById('created-invoice-preview');
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!createdInvoice) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default as any;
      const companyDetails = {
        name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ ----- Sakshi Pradip Adad Papad",
        address: "150FI RING ROAD, RAMAPUR",
        landmark: "CHOKDI,SHASTRI NAGAR, B/H LILJAT",
        city: "PAPAD, 19/4 CORNER, RAJKOT",
        state: "Gujarat",
        mobile: "9624985555"
      };

      const convertAmountToWords = (amount: number): string => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        if (amount === 0) return 'Zero';
        if (amount < 10) return ones[amount];
        if (amount < 20) return teens[amount - 10];
        if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 !== 0 ? ' ' + ones[amount % 10] : '');
        if (amount < 1000) return ones[Math.floor(amount / 100)] + ' Hundred' + (amount % 100 !== 0 ? ' ' + convertAmountToWords(amount % 100) : '');
        if (amount < 100000) return convertAmountToWords(Math.floor(amount / 1000)) + ' Thousand' + (amount % 1000 !== 0 ? ' ' + convertAmountToWords(amount % 1000) : '');
        if (amount < 1000000) return convertAmountToWords(Math.floor(amount / 100000)) + ' Lakh' + (amount % 100000 !== 0 ? ' ' + convertAmountToWords(amount % 100000) : '');
        return 'Rupees Only';
      };

      const htmlContent = `<!DOCTYPE html><html><head><title>Bill of Supply - ${createdInvoice.invoiceNumber}</title><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; }body { font-family: Arial, sans-serif; background: white; color: #1F2937; }.primary-bg { background-color: #EDE9FE; }.primary-text { color: #1F2937; }.accent-text { color: #4B5563; }.highlight-bg { background-color: #F5F3FF; }.text-sm { font-size: 12px; line-height: 18px; }.text-base { font-size: 14px; line-height: 20px; }.text-lg { font-size: 16px; line-height: 22px; }.text-xl { font-size: 18px; line-height: 24px; }.font-bold { font-weight: 700; }.font-semibold { font-weight: 600; }.font-medium { font-weight: 500; }.text-center { text-align: center; }.text-right { text-align: right; }.flex { display: flex; }.justify-between { justify-content: space-between; }.w-full { width: 100%; }.p-4 { padding: 16px; }.mb-2 { margin-bottom: 8px; }.border-b { border-bottom: 1px solid #D1D5DB; }.border-t { border-top: 1px solid #D1D5DB; }table { border-collapse: collapse; width: 100%; }th, td { border: 1px solid #D1D5DB; padding: 8px 12px; vertical-align: middle; }.table-header { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.table-footer { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.invoice-box { background: white; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; }</style></head><body><div class="primary-bg p-4 border-b"><div class="flex justify-between" style="gap: 16px;"><div style="flex: 1;"><h1 class="text-xl font-bold primary-text mb-2">${companyDetails.name}</h1><div class="accent-text text-sm"><div class="mb-2">${companyDetails.address}</div><div class="mb-2">${companyDetails.landmark}</div><div class="mb-2">${companyDetails.city}, ${companyDetails.state}</div><div class="font-medium">Mobile: ${companyDetails.mobile}</div></div></div><div class="text-right"><div class="invoice-box"><div class="text-sm accent-text mb-2">ORIGINAL FOR RECIPIENT</div><h2 class="text-lg font-bold primary-text mb-2">BILL OF SUPPLY</h2><div class="mb-2"><div class="text-sm accent-text">Invoice No.</div><div class="text-base font-semibold primary-text">${createdInvoice.invoiceNumber}</div></div><div><div class="text-sm accent-text">Invoice Date</div><div class="text-sm font-medium primary-text">${new Date(createdInvoice.date).toLocaleDateString('en-GB')}</div></div></div></div></div></div><div class="highlight-bg p-4 border-b"><h3 class="text-sm font-semibold primary-text mb-2">BILL TO</h3><div class="text-base font-semibold primary-text mb-2">${createdInvoice.customerName}</div>${createdInvoiceParty?.phone ? `<div class="text-sm accent-text mb-2">Mobile: <span class="font-medium">${createdInvoiceParty.phone}</span></div>` : ''}${createdInvoiceParty?.address ? `<div class="text-sm accent-text">${createdInvoiceParty.address}</div>` : ''}</div><table class="w-full"><thead><tr class="table-header"><th class="text-sm font-semibold" style="width: 8%;">S.NO.</th><th class="text-sm font-semibold" style="width: 40%;">ITEMS</th><th class="text-sm font-semibold text-center" style="width: 12%;">QTY.</th><th class="text-sm font-semibold text-right" style="width: 13%;">MRP</th><th class="text-sm font-semibold text-right" style="width: 13%;">RATE</th><th class="text-sm font-semibold text-right" style="width: 14%;">AMOUNT</th></tr></thead><tbody>${createdInvoice.items.map((item, index) => `<tr><td class="text-sm text-center primary-text">${index + 1}</td><td class="text-sm primary-text">${item.productName}</td><td class="text-sm text-center primary-text">${item.quantity} PCS</td><td class="text-sm text-right primary-text">${item.mrp || Math.round(item.price * 1.2)}</td><td class="text-sm text-right primary-text">${item.price.toFixed(0)}</td><td class="text-sm text-right font-semibold primary-text">₹ ${item.amount.toFixed(0)}</td></tr>`).join('')}<tr class="table-footer"><td></td><td class="text-sm font-semibold">SUBTOTAL</td><td class="text-sm font-semibold text-center">${createdInvoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td></td><td></td><td class="text-sm font-semibold text-right">₹ ${createdInvoice.subtotal.toFixed(0)}</td></tr>${createdInvoice.discount && createdInvoice.discount > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">DISCOUNT</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #DC2626;">- ₹ ${createdInvoice.discount.toFixed(0)}</td></tr>` : ''}${createdInvoice.otherCharges && createdInvoice.otherCharges > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">OTHER CHARGES</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${createdInvoice.otherCharges.toFixed(0)}</td></tr>` : ''}</tbody></table><div class="p-4"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;"><div><div class="text-sm font-semibold primary-text mb-2">Total Amount (in words)</div><div class="text-sm accent-text">${convertAmountToWords(Math.floor(createdInvoice.total))} Rupees Only</div></div><div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #D1D5DB;"><span class="text-sm font-semibold accent-text">Total Amount</span><span class="text-sm font-bold primary-text">₹ ${createdInvoice.total.toFixed(0)}</span></div></div></div></div><div style="background: #F5F3FF; padding: 24px; text-center; border-top: 1px solid #D1D5DB;"><div style="background: white; border: 2px solid #D1D5DB; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px;"><div style="font-size: 16px; font-weight: bold; color: #1F2937; margin-bottom: 12px;">આપનો વિશ્વાસુ - પ્રજાપતિ મહેશ</div><div style="font-size: 11px; color: #4B5563; font-weight: 600; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">AUTHORISED SIGNATURE</div></div></div></body></html>`;

      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `Invoice-${createdInvoice.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      }).from(htmlContent).save();

      toast({
        title: "Downloaded Successfully",
        description: "Invoice PDF has been downloaded."
      });
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleWhatsAppShare = async () => {
    if (!createdInvoice || !createdInvoiceParty) return;

    try {
      if (!createdInvoiceParty.phone) {
        toast({
          title: "No Phone Number",
          description: "This party does not have a phone number.",
          variant: "destructive"
        });
        return;
      }

      let formattedPhone = createdInvoiceParty.phone.replace(/[^\d]/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
      }

      // Check if we're on mobile and can use native sharing
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile && navigator.share) {
        // Mobile: Generate PDF and use native share API to share directly to WhatsApp
        try {
          await generatePDFAndShareToWhatsApp(formattedPhone);
          return;
        } catch (error) {
          console.log('Native sharing failed, falling back to URL method');
        }
      }

      // Fallback: Open WhatsApp with message and download PDF
      await generateAndSharePDF(formattedPhone);
    } catch (error) {
      toast({
        title: "Share Error",
        description: "Failed to share invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getPaymentStatusText = (invoice: any) => {
    const amount = `₹${invoice.total.toLocaleString()}`;

    switch (invoice.status) {
      case 'paid':
        return `✅ *PAID* - Amount: ${amount}`;

      case 'draft':
        if (invoice.dueDate) {
          const dueDate = format(invoice.dueDate, 'dd/MM/yyyy');
          return `⏳ *DUE* - Due Date: ${dueDate} | Amount: ${amount}`;
        }
        return `⏳ *DUE* - Amount: ${amount}`;

      case 'overdue':
        if (invoice.dueDate) {
          const overdueDate = format(invoice.dueDate, 'dd/MM/yyyy');
          return `⚠️ *OVERDUE* - Due Date: ${overdueDate} | Amount: ${amount}`;
        }
        return `⚠️ *OVERDUE* - Amount: ${amount}`;

      default:
        return `Amount: ${amount}`;
    }
  };

  const generatePDFAndShareToWhatsApp = async (phoneNumber: string) => {
    const html2pdf = (await import('html2pdf.js')).default as any;
    const companyDetails = {
      name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ ----- Sakshi Pradip Adad Papad",
      address: "150FI RING ROAD, RAMAPUR",
      landmark: "CHOKDI,SHASTRI NAGAR, B/H LILJAT",
      city: "PAPAD, 19/4 CORNER, RAJKOT",
      state: "Gujarat",
      mobile: "9624985555"
    };

    const convertAmountToWords = (amount: number): string => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (amount === 0) return 'Zero';
      if (amount < 10) return ones[amount];
      if (amount < 20) return teens[amount - 10];
      if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 !== 0 ? ' ' + ones[amount % 10] : '');
      if (amount < 1000) return ones[Math.floor(amount / 100)] + ' Hundred' + (amount % 100 !== 0 ? ' ' + convertAmountToWords(amount % 100) : '');
      if (amount < 100000) return convertAmountToWords(Math.floor(amount / 1000)) + ' Thousand' + (amount % 1000 !== 0 ? ' ' + convertAmountToWords(amount % 1000) : '');
      if (amount < 1000000) return convertAmountToWords(Math.floor(amount / 100000)) + ' Lakh' + (amount % 100000 !== 0 ? ' ' + convertAmountToWords(amount % 100000) : '');
      return 'Rupees Only';
    };

    const htmlContent = `<!DOCTYPE html><html><head><title>Bill of Supply - ${createdInvoice!.invoiceNumber}</title><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; }body { font-family: Arial, sans-serif; background: white; color: #1F2937; }.primary-bg { background-color: #EDE9FE; }.primary-text { color: #1F2937; }.accent-text { color: #4B5563; }.highlight-bg { background-color: #F5F3FF; }.text-sm { font-size: 12px; line-height: 18px; }.text-base { font-size: 14px; line-height: 20px; }.text-lg { font-size: 16px; line-height: 22px; }.text-xl { font-size: 18px; line-height: 24px; }.font-bold { font-weight: 700; }.font-semibold { font-weight: 600; }.font-medium { font-weight: 500; }.text-center { text-align: center; }.text-right { text-align: right; }.flex { display: flex; }.justify-between { justify-content: space-between; }.w-full { width: 100%; }.p-4 { padding: 16px; }.mb-2 { margin-bottom: 8px; }.border-b { border-bottom: 1px solid #D1D5DB; }.border-t { border-top: 1px solid #D1D5DB; }table { border-collapse: collapse; width: 100%; }th, td { border: 1px solid #D1D5DB; padding: 8px 12px; vertical-align: middle; }.table-header { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.table-footer { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.invoice-box { background: white; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; }</style></head><body><div class="primary-bg p-4 border-b"><div class="flex justify-between" style="gap: 16px;"><div style="flex: 1;"><h1 class="text-xl font-bold primary-text mb-2">${companyDetails.name}</h1><div class="accent-text text-sm"><div class="mb-2">${companyDetails.address}</div><div class="mb-2">${companyDetails.landmark}</div><div class="mb-2">${companyDetails.city}, ${companyDetails.state}</div><div class="font-medium">Mobile: ${companyDetails.mobile}</div></div></div><div class="text-right"><div class="invoice-box"><div class="text-sm accent-text mb-2">ORIGINAL FOR RECIPIENT</div><h2 class="text-lg font-bold primary-text mb-2">BILL OF SUPPLY</h2><div class="mb-2"><div class="text-sm accent-text">Invoice No.</div><div class="text-base font-semibold primary-text">${createdInvoice!.invoiceNumber}</div></div><div><div class="text-sm accent-text">Invoice Date</div><div class="text-sm font-medium primary-text">${new Date(createdInvoice!.date).toLocaleDateString('en-GB')}</div></div></div></div></div></div><div class="highlight-bg p-4 border-b"><h3 class="text-sm font-semibold primary-text mb-2">BILL TO</h3><div class="text-base font-semibold primary-text mb-2">${createdInvoice!.customerName}</div>${createdInvoiceParty!.phone ? `<div class="text-sm accent-text mb-2">Mobile: <span class="font-medium">${createdInvoiceParty!.phone}</span></div>` : ''}${createdInvoiceParty!.address ? `<div class="text-sm accent-text">${createdInvoiceParty!.address}</div>` : ''}</div><table class="w-full"><thead><tr class="table-header"><th class="text-sm font-semibold" style="width: 8%;">S.NO.</th><th class="text-sm font-semibold" style="width: 40%;">ITEMS</th><th class="text-sm font-semibold text-center" style="width: 12%;">QTY.</th><th class="text-sm font-semibold text-right" style="width: 13%;">MRP</th><th class="text-sm font-semibold text-right" style="width: 13%;">RATE</th><th class="text-sm font-semibold text-right" style="width: 14%;">AMOUNT</th></tr></thead><tbody>${createdInvoice!.items.map((item, index) => `<tr><td class="text-sm text-center primary-text">${index + 1}</td><td class="text-sm primary-text">${item.productName || 'N/A'}</td><td class="text-sm text-center primary-text">${item.quantity || 0} PCS</td><td class="text-sm text-right primary-text">${item.mrp || Math.round((item.price || 0) * 1.2)}</td><td class="text-sm text-right primary-text">${(item.price || 0).toFixed(0)}</td><td class="text-sm text-right font-semibold primary-text">₹ ${(item.amount || 0).toFixed(0)}</td></tr>`).join('')}<tr class="table-footer"><td></td><td class="text-sm font-semibold">SUBTOTAL</td><td class="text-sm font-semibold text-center">${createdInvoice!.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</td><td></td><td></td><td class="text-sm font-semibold text-right">₹ ${createdInvoice!.subtotal.toFixed(0)}</td></tr>${createdInvoice!.discount && createdInvoice!.discount > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">DISCOUNT</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #DC2626;">- ₹ ${createdInvoice!.discount.toFixed(0)}</td></tr>` : ''}${createdInvoice!.otherCharges && createdInvoice!.otherCharges > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">OTHER CHARGES</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${createdInvoice!.otherCharges.toFixed(0)}</td></tr>` : ''}</tbody></table><div class="p-4"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;"><div><div class="text-sm font-semibold primary-text mb-2">Total Amount (in words)</div><div class="text-sm accent-text">${convertAmountToWords(Math.floor(createdInvoice!.total))} Rupees Only</div></div><div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #D1D5DB;"><span class="text-sm font-semibold accent-text">Total Amount</span><span class="text-sm font-bold primary-text">₹ ${createdInvoice!.total.toFixed(0)}</span></div></div></div></div><div style="background: #F5F3FF; padding: 24px; text-center; border-top: 1px solid #D1D5DB;"><div style="background: white; border: 2px solid #D1D5DB; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px;"><div style="font-size: 16px; font-weight: bold; color: #1F2937; margin-bottom: 12px;">આપનો વિશ્વાસુ - પ્રજાપતિ મહેશ</div><div style="font-size: 11px; color: #4B5563; font-weight: 600; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">AUTHORISED SIGNATURE</div></div></div></body></html>`;

    // Generate PDF as blob
    const pdfBlob = await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `Invoice-${createdInvoice!.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }).from(htmlContent).outputPdf('blob');

    // Create file for sharing
    const file = new File([pdfBlob], `Invoice-${createdInvoice!.invoiceNumber}.pdf`, { type: 'application/pdf' });

    // Use native share API with WhatsApp intent
    const paymentStatus = getPaymentStatusText(createdInvoice!);
    const shareData = {
      title: `Invoice ${createdInvoice!.invoiceNumber} for ${createdInvoiceParty!.name}`,
      text: `Hello ${createdInvoiceParty!.name}, please find your invoice #${createdInvoice!.invoiceNumber} attached.\n\nInvoice Details:\n• Invoice Number: ${createdInvoice!.invoiceNumber}\n• Date: ${format(createdInvoice!.date, 'PP')}\n• ${paymentStatus}\n\nPlease find the PDF attached.`,
      files: [file]
    };

    // Try to share directly
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      toast({
        title: "PDF Shared Successfully",
        description: `Invoice shared to WhatsApp for ${createdInvoiceParty!.name}!`
      });
    } else {
      throw new Error('Native sharing not supported');
    }
  };

  const generateAndSharePDF = async (phoneNumber: string) => {
    const html2pdf = (await import('html2pdf.js')).default as any;
    const companyDetails = {
      name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ ----- Sakshi Pradip Adad Papad",
      address: "150FI RING ROAD, RAMAPUR",
      landmark: "CHOKDI,SHASTRI NAGAR, B/H LILJAT",
      city: "PAPAD, 19/4 CORNER, RAJKOT",
      state: "Gujarat",
      mobile: "9624985555"
    };

    const convertAmountToWords = (amount: number): string => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (amount === 0) return 'Zero';
      if (amount < 10) return ones[amount];
      if (amount < 20) return teens[amount - 10];
      if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 !== 0 ? ' ' + ones[amount % 10] : '');
      if (amount < 1000) return ones[Math.floor(amount / 100)] + ' Hundred' + (amount % 100 !== 0 ? ' ' + convertAmountToWords(amount % 100) : '');
      if (amount < 100000) return convertAmountToWords(Math.floor(amount / 1000)) + ' Thousand' + (amount % 1000 !== 0 ? ' ' + convertAmountToWords(amount % 1000) : '');
      if (amount < 1000000) return convertAmountToWords(Math.floor(amount / 100000)) + ' Lakh' + (amount % 100000 !== 0 ? ' ' + convertAmountToWords(amount % 100000) : '');
      return 'Rupees Only';
    };

    const htmlContent = `<!DOCTYPE html><html><head><title>Bill of Supply - ${createdInvoice!.invoiceNumber}</title><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; }body { font-family: Arial, sans-serif; background: white; color: #1F2937; }.primary-bg { background-color: #EDE9FE; }.primary-text { color: #1F2937; }.accent-text { color: #4B5563; }.highlight-bg { background-color: #F5F3FF; }.text-sm { font-size: 12px; line-height: 18px; }.text-base { font-size: 14px; line-height: 20px; }.text-lg { font-size: 16px; line-height: 22px; }.text-xl { font-size: 18px; line-height: 24px; }.font-bold { font-weight: 700; }.font-semibold { font-weight: 600; }.font-medium { font-weight: 500; }.text-center { text-align: center; }.text-right { text-align: right; }.flex { display: flex; }.justify-between { justify-content: space-between; }.w-full { width: 100%; }.p-4 { padding: 16px; }.mb-2 { margin-bottom: 8px; }.border-b { border-bottom: 1px solid #D1D5DB; }.border-t { border-top: 1px solid #D1D5DB; }table { border-collapse: collapse; width: 100%; }th, td { border: 1px solid #D1D5DB; padding: 8px 12px; vertical-align: middle; }.table-header { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.table-footer { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.invoice-box { background: white; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; }</style></head><body><div class="primary-bg p-4 border-b"><div class="flex justify-between" style="gap: 16px;"><div style="flex: 1;"><h1 class="text-xl font-bold primary-text mb-2">${companyDetails.name}</h1><div class="accent-text text-sm"><div class="mb-2">${companyDetails.address}</div><div class="mb-2">${companyDetails.landmark}</div><div class="mb-2">${companyDetails.city}, ${companyDetails.state}</div><div class="font-medium">Mobile: ${companyDetails.mobile}</div></div></div><div class="text-right"><div class="invoice-box"><div class="text-sm accent-text mb-2">ORIGINAL FOR RECIPIENT</div><h2 class="text-lg font-bold primary-text mb-2">BILL OF SUPPLY</h2><div class="mb-2"><div class="text-sm accent-text">Invoice No.</div><div class="text-base font-semibold primary-text">${createdInvoice!.invoiceNumber}</div></div><div><div class="text-sm accent-text">Invoice Date</div><div class="text-sm font-medium primary-text">${new Date(createdInvoice!.date).toLocaleDateString('en-GB')}</div></div></div></div></div></div><div class="highlight-bg p-4 border-b"><h3 class="text-sm font-semibold primary-text mb-2">BILL TO</h3><div class="text-base font-semibold primary-text mb-2">${createdInvoice!.customerName}</div>${createdInvoiceParty!.phone ? `<div class="text-sm accent-text mb-2">Mobile: <span class="font-medium">${createdInvoiceParty!.phone}</span></div>` : ''}${createdInvoiceParty!.address ? `<div class="text-sm accent-text">${createdInvoiceParty!.address}</div>` : ''}</div><table class="w-full"><thead><tr class="table-header"><th class="text-sm font-semibold" style="width: 8%;">S.NO.</th><th class="text-sm font-semibold" style="width: 40%;">ITEMS</th><th class="text-sm font-semibold text-center" style="width: 12%;">QTY.</th><th class="text-sm font-semibold text-right" style="width: 13%;">MRP</th><th class="text-sm font-semibold text-right" style="width: 13%;">RATE</th><th class="text-sm font-semibold text-right" style="width: 14%;">AMOUNT</th></tr></thead><tbody>${createdInvoice!.items.map((item, index) => `<tr><td class="text-sm text-center primary-text">${index + 1}</td><td class="text-sm primary-text">${item.productName || 'N/A'}</td><td class="text-sm text-center primary-text">${item.quantity || 0} PCS</td><td class="text-sm text-right primary-text">${item.mrp || Math.round((item.price || 0) * 1.2)}</td><td class="text-sm text-right primary-text">${(item.price || 0).toFixed(0)}</td><td class="text-sm text-right font-semibold primary-text">₹ ${(item.amount || 0).toFixed(0)}</td></tr>`).join('')}<tr class="table-footer"><td></td><td class="text-sm font-semibold">SUBTOTAL</td><td class="text-sm font-semibold text-center">${createdInvoice!.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</td><td></td><td></td><td class="text-sm font-semibold text-right">₹ ${createdInvoice!.subtotal.toFixed(0)}</td></tr>${createdInvoice!.discount && createdInvoice!.discount > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">DISCOUNT</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #DC2626;">- ₹ ${createdInvoice!.discount.toFixed(0)}</td></tr>` : ''}${createdInvoice!.otherCharges && createdInvoice!.otherCharges > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">OTHER CHARGES</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${createdInvoice!.otherCharges.toFixed(0)}</td></tr>` : ''}</tbody></table><div class="p-4"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;"><div><div class="text-sm font-semibold primary-text mb-2">Total Amount (in words)</div><div class="text-sm accent-text">${convertAmountToWords(Math.floor(createdInvoice!.total))} Rupees Only</div></div><div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #D1D5DB;"><span class="text-sm font-semibold accent-text">Total Amount</span><span class="text-sm font-bold primary-text">₹ ${createdInvoice!.total.toFixed(0)}</span></div></div></div></div><div style="background: #F5F3FF; padding: 24px; text-center; border-top: 1px solid #D1D5DB;"><div style="background: white; border: 2px solid #D1D5DB; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px;"><div style="font-size: 16px; font-weight: bold; color: #1F2937; margin-bottom: 12px;">આપનો વિશ્વાસુ - પ્રજાપતિ મહેશ</div><div style="font-size: 11px; color: #4B5563; font-weight: 600; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">AUTHORISED SIGNATURE</div></div></div></body></html>`;

    // Generate PDF as blob
    const pdfBlob = await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `Invoice-${createdInvoice!.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }).from(htmlContent).outputPdf('blob');

    // Create file for sharing
    const file = new File([pdfBlob], `Invoice-${createdInvoice!.invoiceNumber}.pdf`, { type: 'application/pdf' });
    const paymentStatus = getPaymentStatusText(createdInvoice!);
    const shareData = {
      title: `Invoice ${createdInvoice!.invoiceNumber}`,
      text: `Hello ${createdInvoiceParty!.name}, please find your invoice #${createdInvoice!.invoiceNumber} attached.\n\nInvoice Details:\n• Invoice Number: ${createdInvoice!.invoiceNumber}\n• Date: ${format(createdInvoice!.date, 'PP')}\n• ${paymentStatus}\n\nPlease find the PDF attached.`,
      files: [file]
    };

    // Try native sharing
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      toast({
        title: "PDF Shared",
        description: "Invoice PDF shared successfully!"
      });
    } else {
      // Fallback: Open WhatsApp with specific number and download PDF
      const paymentStatusFallback = getPaymentStatusText(createdInvoice!);
      const text = `Hello ${createdInvoiceParty!.name}, please find your invoice #${createdInvoice!.invoiceNumber} attached.\n\nInvoice Details:\n• Invoice Number: ${createdInvoice!.invoiceNumber}\n• Date: ${format(createdInvoice!.date, 'PP')}\n• ${paymentStatusFallback}\n\nPlease find the PDF attached.`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');

      // Also trigger PDF download
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `Invoice-${createdInvoice!.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      }).from(htmlContent).save();

      toast({
        title: "WhatsApp Opened & PDF Downloaded",
        description: `Opened WhatsApp with ${createdInvoiceParty!.name}. PDF downloaded for attachment.`,
        duration: 5000,
      });
    }
  };

  const handleThermalPrint = async () => {
    if (!createdInvoice || isPrinting) return;

    try {
      setIsPrinting(true);
      await printThermalReceipt(
        createdInvoice,
        createdInvoiceParty?.name,
        createdInvoiceParty?.phone,
        createdInvoiceParty?.address
      );
      toast({
        title: "Print Completed",
        description: "Invoice printed successfully!"
      });
    } catch (error) {
      console.error('Thermal print error:', error);
      toast({
        title: "Print Error",
        description: "Failed to print. Please check your printer connection.",
        variant: "destructive"
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const {
    subtotal,
    discount: discountAmount,
    otherCharges: otherChargesAmount,
    taxAmount,
    total
  } = calculateTotals();
  return <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-responsive-lg font-bold text-foreground">{t('createInvoice')}</h1>
          <p className="text-responsive-sm text-muted-foreground mt-1">{t('generateInvoicesForCustomers')}</p>
        </div>
      </div>
    </div>

    {/* Party Selection */}
    <Card className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border">
      <CardHeader className="p-0 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold">{t('partyInformation')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-3 sm:space-y-4">
        <div>
          <Label>{t('searchParty')}*</Label>
          <div className="flex gap-2">
            <Popover open={partySearchOpen} onOpenChange={setPartySearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={partySearchOpen}
                  className={cn(
                    "flex-1 justify-between h-auto min-h-[2.5rem] text-left py-2 transition-all duration-200",
                    selectedParty
                      ? "bg-primary/5 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                      : "bg-white hover:bg-muted/50"
                  )}
                >
                  <span className="flex-1 text-left break-words whitespace-normal">
                    {selectedParty ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-primary">{selectedParty.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{partySearchValue || t('searchParty')}</span>
                    )}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-md p-0 bg-white border shadow-xl z-50 animate-in fade-in-0 zoom-in-95" align="start">
                <Command className="w-full">
                  <CommandInput
                    placeholder={t('searchParties')}
                    value={partySearchValue}
                    onValueChange={setPartySearchValue}
                    className="h-11 px-4 border-0 border-b focus:ring-0"
                  />
                  <CommandList className="max-h-[50vh] sm:max-h-[400px] overflow-y-auto">
                    <CommandEmpty>
                      <div className="p-4 text-center space-y-3">
                        <p className="text-sm text-muted-foreground">{t('noPartyFound')}</p>
                        <Button onClick={() => {
                          setShowNewPartyForm(true);
                          setCustomerName(partySearchValue);
                          setPartySearchOpen(false);
                        }} variant="outline" size="sm" className="w-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          {t('addParty')}
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {(() => {
                        // Filter parties based on search
                        const filteredParties = parties?.filter(party => {
                          const searchLower = partySearchValue.toLowerCase();
                          return party.name.toLowerCase().includes(searchLower) ||
                            party.phone?.toLowerCase().includes(searchLower) ||
                            party.email?.toLowerCase().includes(searchLower);
                        }) || [];

                        // If searching, show all results; otherwise limit to 10
                        const displayParties = partySearchValue.trim()
                          ? filteredParties
                          : filteredParties.slice(0, 10);

                        const hasMore = !partySearchValue.trim() && filteredParties.length > 10;

                        return (
                          <>
                            {displayParties.map(party => {
                              const isSelected = selectedParty?.id === party.id;
                              return (
                                <CommandItem
                                  key={party.id}
                                  onSelect={() => handlePartySelect(party)}
                                  className={cn(
                                    "cursor-pointer px-3 sm:px-4 py-2.5 sm:py-3 transition-colors duration-150",
                                    "hover:bg-primary/5 hover:border-l-2 hover:border-l-primary",
                                    "data-[selected=true]:bg-muted/50",
                                    isSelected && "bg-primary/5 border-l-2 border-l-primary"
                                  )}
                                >
                                  <Check className={cn(
                                    "mr-2 sm:mr-3 h-4 w-4 flex-shrink-0 transition-opacity duration-200",
                                    isSelected ? "opacity-100 text-primary" : "opacity-0"
                                  )} />
                                  <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                                    <div className={cn(
                                      "font-medium text-xs sm:text-sm break-words whitespace-normal leading-tight",
                                      isSelected ? "text-primary" : "text-foreground"
                                    )}>
                                      {party.name}
                                    </div>
                                    {(party.phone || party.email) && (
                                      <div className="text-[10px] sm:text-xs text-muted-foreground break-words whitespace-normal leading-tight">
                                        {party.phone} {party.email && party.phone && " • "} {party.email}
                                      </div>
                                    )}
                                  </div>
                                </CommandItem>
                              );
                            })}
                            {hasMore && (
                              <div className="px-3 sm:px-4 py-2 text-center border-t">
                                <p className="text-xs text-muted-foreground">
                                  Showing 10 of {filteredParties.length} parties. Type to search all...
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedParty && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedParty.name);
                    toast({
                      title: "Copied!",
                      description: "Party name copied to clipboard"
                    });
                  }}
                  className="shrink-0 h-[2.5rem] w-[2.5rem] sm:h-11 sm:w-11 bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  title="Copy party name"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSelectedParty(null);
                    setPartySearchValue('');
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerAddress('');
                    setCustomerEmail('');
                    setCustomerGstin('');
                    toast({
                      title: "Cleared",
                      description: "Party selection cleared"
                    });
                  }}
                  className="shrink-0 h-[2.5rem] w-[2.5rem] sm:h-11 sm:w-11 bg-muted text-muted-foreground border-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200"
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* New Party Form or Selected Party Details */}
        {(showNewPartyForm || selectedParty) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">{t('partyName')} *</Label>
            <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} className="bg-white" placeholder={t('enterPartyName')} disabled={!!selectedParty && !showNewPartyForm} required />
          </div>
          <div>
            <Label htmlFor="customerPhone">{t('phone')}</Label>
            <Input id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="bg-white" placeholder={t('enterPhoneNumber')} disabled={!!selectedParty && !showNewPartyForm} />
          </div>
          <div>
            <Label htmlFor="customerEmail">{t('email')}</Label>
            <Input id="customerEmail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="bg-white" placeholder={t('enterEmailAddress')} disabled={!!selectedParty && !showNewPartyForm} />
          </div>
          <div>
            <Label htmlFor="customerGstin">{t('gstin')}</Label>
            <Input id="customerGstin" value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} className="bg-white" placeholder={t('enterGstin')} disabled={!!selectedParty && !showNewPartyForm} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="customerAddress">{t('address')}</Label>
            <Textarea id="customerAddress" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="bg-white" placeholder={t('enterAddress')} rows={2} disabled={!!selectedParty && !showNewPartyForm} />
          </div>

          {showNewPartyForm && <div className="md:col-span-2 flex gap-2">
            <Button onClick={handleCreateNewParty} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={createParty.isPending}>
              <UserPlus className="h-4 w-4 mr-2" />
              {createParty.isPending ? t('creating') : t('createParty')}
            </Button>
            <Button onClick={() => {
              setShowNewPartyForm(false);
              setCustomerName('');
              setCustomerPhone('');
              setCustomerAddress('');
              setCustomerEmail('');
              setCustomerGstin('');
            }} variant="outline">
              {t('cancel')}
            </Button>
          </div>}
        </div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="invoiceDate" className="text-card-foreground text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {t('invoiceDateAuto')}
            </Label>
            <div className="relative">
              <Input id="invoiceDate" type="date" value={invoiceDate} className="h-10 bg-muted/50 text-muted-foreground cursor-not-allowed" readOnly disabled />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Badge variant="secondary" className="text-xs">{t('auto')}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('invoiceDateHelp')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-card-foreground text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {t('dueDate')}
            </Label>
            <div className="flex gap-3">
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 h-10 justify-start text-left font-normal", !dueDate && "text-muted-foreground", !isDebt && "opacity-50 cursor-not-allowed")} disabled={!isDebt}>
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {dueDate ? <span className="font-medium">
                      {format(dueDate, "PPP")}
                    </span> : <span>{isDebt ? t('selectDueDate') : t('enableDebtMode')}</span>}
                  </Button>
                </PopoverTrigger>
                {isDebt && (
                  <PopoverContent className="w-auto p-0 bg-white shadow-lg" align="start">
                    <Calendar mode="single" selected={dueDate} onSelect={date => {
                      setDueDate(date);
                      setDueDateOpen(false);
                    }} disabled={date => date < new Date()} initialFocus className="p-3" />
                    <div className="p-2 border-t bg-muted/10">
                      <div className="flex justify-between items-center text-xs">
                        {dueDate && <Button variant="ghost" size="sm" onClick={() => {
                          setDueDate(undefined);
                          setDueDateOpen(false);
                        }} className="text-muted-foreground hover:text-card-foreground rounded-md h-7 px-2 text-xs">
                          {t('clear')}
                        </Button>}
                        <Button variant="ghost" size="sm" onClick={() => setDueDateOpen(false)} className="text-primary hover:text-primary/80 rounded-md ml-auto h-7 px-2 text-xs">
                          {t('close')}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                )}
              </Popover>

              <div className="flex flex-col items-center justify-center space-y-2 px-3 h-12">
                <Switch
                  id="debt-mode"
                  checked={isDebt}
                  onCheckedChange={(checked) => {
                    setIsDebt(checked);
                    if (!checked) {
                      setDueDate(undefined);
                    }
                  }}
                  className="data-[state=checked]:bg-amber-500"
                />
                <Label htmlFor="debt-mode" className="text-[10px] text-muted-foreground cursor-pointer whitespace-nowrap flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('debt')}
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isDebt ? t('invoiceWillBeMarkedAsPending') : t('invoiceWillBeMarkedAsPaid')}
            </p>
          </div>
        </div>

        {/* Payment Mode Section */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-card-foreground text-sm font-medium">Payment Mode</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={paymentMode === 'cash' ? 'default' : 'outline'}
              onClick={() => {
                setPaymentMode('cash');
                setChequeNumber('');
                setOnlinePaymentMethod('');
              }}
              className="flex-1"
            >
              Cash
            </Button>
            <Button
              type="button"
              variant={paymentMode === 'cheque' ? 'default' : 'outline'}
              onClick={() => {
                setPaymentMode('cheque');
                setOnlinePaymentMethod('');
              }}
              className="flex-1"
            >
              Cheque
            </Button>
            <Button
              type="button"
              variant={paymentMode === 'online' ? 'default' : 'outline'}
              onClick={() => {
                setPaymentMode('online');
                setChequeNumber('');
                setShowOnlineDialog(true);
              }}
              className="flex-1"
            >
              Online
            </Button>
          </div>

          {/* Cheque Number Input */}
          {paymentMode === 'cheque' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label htmlFor="chequeNumber" className="text-sm">Cheque Number</Label>
              <Input
                id="chequeNumber"
                type="number"
                inputMode="numeric"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
                placeholder="Enter cheque number"
                className="bg-white"
              />
            </div>
          )}

          {/* Online Payment Method Display */}
          {paymentMode === 'online' && onlinePaymentMethod && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                <span className="text-sm font-medium">
                  {onlinePaymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOnlineDialog(true)}
                  className="text-xs"
                >
                  Change
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Online Payment Method Dialog */}
        {showOnlineDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-lg font-semibold">Select Online Payment Method</h3>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={onlinePaymentMethod === 'upi' ? 'default' : 'outline'}
                  onClick={() => {
                    setOnlinePaymentMethod('upi');
                    setShowOnlineDialog(false);
                  }}
                  className="w-full justify-start"
                >
                  UPI
                </Button>
                <Button
                  type="button"
                  variant={onlinePaymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                  onClick={() => {
                    setOnlinePaymentMethod('bank_transfer');
                    setShowOnlineDialog(false);
                  }}
                  className="w-full justify-start"
                >
                  Bank Transfer
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowOnlineDialog(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Add Items */}
    <ProductListSelector
      products={products}
      selectedProductIds={items.map(item => item.productId)}
      onProductAdd={(product: Product) => {
        // Check if product already exists in items
        const existingItemIndex = items.findIndex(item => item.productId === product.id);

        if (existingItemIndex !== -1) {
          // Product already exists, increase quantity
          const updatedItems = [...items];
          const existingItem = updatedItems[existingItemIndex];
          const currentQty: number = typeof existingItem.quantity === 'string' ? Number(existingItem.quantity) || 0 : existingItem.quantity;
          const currentPrice: number = typeof existingItem.price === 'string' ? Number(existingItem.price) || 0 : existingItem.price;
          const newQuantity: number = currentQty + 1;
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            amount: newQuantity * currentPrice
          };
          setItems(updatedItems);
        } else {
          // Product doesn't exist, add new item
          const newItem: InvoiceItem = {
            id: Date.now().toString(),
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: product.price,
            mrp: product.mrp,
            taxRate: product.tax_rate,
            amount: product.price
          };
          setItems([...items, newItem]);
        }
      }}
    />

    {/* Invoice Items */}
    {items.length > 0 && <Card className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border">
      <CardHeader className="p-0 pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">{t('invoiceItems')}</CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">{items.length} {items.length === 1 ? 'item' : 'items'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile view - Cards */}
        <div className="block sm:hidden space-y-2.5">
          {items.map(item => (
            <div key={item.id} className="bg-accent/20 p-3 space-y-2.5 rounded-lg border border-border hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-card-foreground text-sm truncate">{item.productName}</div>
                  <div className="text-xs text-muted-foreground mt-1">Tax: {item.taxRate}%</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">{t('quantity')}</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                    className="glass-input h-9 text-sm mt-1"
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('price')}</Label>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={e => updateItem(item.id, 'price', e.target.value)}
                    className="glass-input h-9 text-sm mt-1"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">{t('amount')}</span>
                <span className="font-semibold text-primary text-sm">₹{item.amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop view - Table */}
        <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-glass-border">
                <TableHead className="text-muted-foreground font-semibold text-sm">{t('product')}</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-sm">{t('quantity')}</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-sm">{t('price')}</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-sm">{t('taxRate')}</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-sm">{t('amount')}</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-sm text-center">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => <TableRow key={item.id} className="border-glass-border">
                <TableCell className="text-card-foreground font-medium text-sm">{item.productName}</TableCell>
                <TableCell>
                  <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="glass-input w-20 h-9 text-sm" min="0" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="glass-input w-24 h-9 text-sm" min="0" step="0.01" />
                </TableCell>
                <TableCell className="text-card-foreground text-sm">{item.taxRate}%</TableCell>
                <TableCell className="text-primary font-semibold text-sm">₹{item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>}


    {/* Invoice Summary */}
    {items.length > 0 && <Card className="mobile-card bg-primary/5 border-primary/20">
      <CardHeader className="p-0 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground flex items-center gap-2">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
          {t('invoiceSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-3">
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">{t('subtotal')}</span>
          <span className="text-card-foreground font-semibold">₹{subtotal.toFixed(2)}</span>
        </div>

        {/* Discount Field */}
        <div className="flex justify-between items-center gap-3 sm:gap-4">
          <Label htmlFor="discount" className="text-muted-foreground text-sm sm:text-base">{t('discount')}</Label>
          <Input
            id="discount"
            type="number"
            value={discount || ''}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            className="glass-input w-28 sm:w-32 text-right h-9 text-sm"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        {/* Other Charges Field */}
        <div className="flex justify-between items-center gap-3 sm:gap-4">
          <Label htmlFor="otherCharges" className="text-muted-foreground text-sm sm:text-base">{t('otherCharges')}</Label>
          <Input
            id="otherCharges"
            type="number"
            value={otherCharges || ''}
            onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
            className="glass-input w-28 sm:w-32 text-right h-9 text-sm"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-muted-foreground">{t('taxAmount')}</span>
          <span className="text-card-foreground font-semibold">₹{taxAmount.toFixed(2)}</span>
        </div>

        <div className="border-t border-primary/20 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-card-foreground text-base sm:text-lg font-bold">{t('total')}</span>
            <span className="text-primary text-lg sm:text-xl font-bold">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>}

    {/* Notes */}
    <Card className="mobile-card">
      <CardHeader className="p-0 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">{t('additionalNotes')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="glass-input text-sm sm:text-base"
          placeholder={t('enterAdditionalNotes')}
          rows={3}
        />
      </CardContent>
    </Card>

    {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
      {items.length > 0 && customerName.trim() && <InvoiceGenerator invoice={{
        id: 'preview',
        invoiceNumber: 'PREVIEW',
        customerId: selectedParty?.id || 'temp',
        customerName,
        date: new Date(),
        dueDate,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: typeof item.quantity === 'string' ? item.quantity === '' ? 0 : Number(item.quantity) : item.quantity,
          price: typeof item.price === 'string' ? item.price === '' ? 0 : Number(item.price) : item.price,
          mrp: item.mrp,
          taxRate: item.taxRate,
          amount: item.amount
        })),
        subtotal,
        discount: discountAmount > 0 ? discountAmount : undefined,
        otherCharges: otherChargesAmount > 0 ? otherChargesAmount : undefined,
        taxAmount,
        total,
        status: 'draft',
        notes,
        createdAt: new Date()
      }} party={selectedParty}>
        <Button variant="outline" className="flex-1 sm:flex-initial touch-target">
          <Eye className="h-4 w-4 mr-2" />
          {t('previewInvoice')}
        </Button>
      </InvoiceGenerator>}
      <Button
        onClick={handleSaveInvoice}
        className="flex-1 sm:flex-initial bg-primary text-primary-foreground hover:bg-primary/90 touch-target font-semibold"
        disabled={!customerName.trim() || items.length === 0 || createInvoice.isPending}
      >
        <Save className="h-4 w-4 mr-2" />
        {createInvoice.isPending ? t('creating') : t('saveInvoice')}
      </Button>
    </div>

    {/* Created Invoice Preview */}
    {createdInvoice && createdInvoiceParty && (
      <Card id="created-invoice-preview" className="glass-card mt-8">
        <CardHeader className="border-b glass-border bg-gradient-to-r from-primary/8 via-primary/5 to-accent/8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-primary/15 rounded-xl shadow-sm">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-lg sm:text-xl">Invoice Created Successfully!</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground font-medium">{createdInvoice.invoiceNumber}</span>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {createdInvoice.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Enhanced Action Bar */}
          <div className="mb-6 p-4 sm:p-6 border glass-border bg-muted/20 rounded-xl">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex flex-wrap gap-2 sm:gap-3 flex-1">
                <Button
                  type="button"
                  onClick={handleDownloadPDF}
                  variant="outline"
                  size="default"
                  className="min-w-[110px] sm:min-w-[130px] glass-button hover:bg-secondary hover:text-secondary-foreground hover:border-secondary transition-all duration-200 font-medium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">Download</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleWhatsAppShare}
                  variant="outline"
                  size="default"
                  className="min-w-[110px] sm:min-w-[130px] glass-button hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all duration-200 font-medium"
                >
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span className="hidden sm:inline">Share to WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdInvoice.customerName);
                    toast({
                      title: "Copied!",
                      description: "Party name copied to clipboard"
                    });
                  }}
                  variant="outline"
                  size="default"
                  className="min-w-[110px] sm:min-w-[130px] glass-button hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 font-medium"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Copy Party Name</span>
                  <span className="sm:hidden">Copy Name</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleThermalPrint}
                  variant="outline"
                  size="default"
                  disabled={isPrinting}
                  className="min-w-[110px] sm:min-w-[130px] glass-button hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 font-medium"
                >
                  {isPrinting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2 text-blue-600" />
                  )}
                  <span className="hidden sm:inline">{isPrinting ? 'Printing...' : 'Print Invoice'}</span>
                  <span className="sm:hidden">{isPrinting ? 'Printing...' : 'Print'}</span>
                </Button>
              </div>

              {/* Invoice Summary */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-l pl-4 ml-4 hidden sm:flex">
                <div className="text-right">
                  <div className="font-medium text-card-foreground">₹{createdInvoice.total.toLocaleString()}</div>
                  <div className="text-xs">Total Amount</div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Preview */}
          <div className="bg-background rounded-xl shadow-lg border-2 glass-border p-4 sm:p-8">
            <BillOfSupply invoice={createdInvoice} party={createdInvoiceParty} />
          </div>

          {/* Mobile Summary Bar */}
          <div className="sm:hidden mt-4 p-4 border-t glass-border bg-muted/10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-lg text-card-foreground">₹{createdInvoice.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )}
  </div>;
};
export default CreateInvoice;   
