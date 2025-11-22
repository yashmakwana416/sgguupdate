import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Eye, Share2, X, MessageCircle, Mail, Link, Copy, MapPin } from 'lucide-react';
import { SalesInvoice } from '@/types/billing';
import { InvoicePrint } from './InvoicePrint';
import { BillOfSupply } from './BillOfSupply';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
interface InvoiceGeneratorProps {
  invoice: SalesInvoice;
  party?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    location_link?: string;
  } | null;
  children: React.ReactNode;
}
export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  invoice,
  party,
  children
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const {
    toast
  } = useToast();
  const handleDownload = async () => {
    try {
      setShowPreview(false);
      const html2pdf = (await import('html2pdf.js')).default as any;
      const companyDetails = {
        name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ ----- Sakshi Pradip Adad Papad",
        address: "150FI RING ROAD, RAMAPUR",
        landmark: "CHOKDI,SHASTRI NAGAR, B/H LILJAT",
        city: "PAPAD, 19/4 CORNER, RAJKOT",
        state: "Gujarat",
        mobile: "9624985555",
        tagline: "આપણો વિશ્વાસુ"
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
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bill of Supply - ${invoice.invoiceNumber}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Helvetica Neue', Arial, sans-serif; background: white; color: #1F2937; }
              .primary-bg { background-color: #EDE9FE; }
              .primary-border { border-color: #D1D5DB; }
              .primary-text { color: #1F2937; }
              .accent-text { color: #4B5563; }
              .highlight-bg { background-color: #F5F3FF; }
              .text-xs { font-size: 10px; line-height: 14px; }
              .text-sm { font-size: 12px; line-height: 18px; }
              .text-base { font-size: 14px; line-height: 20px; }
              .text-lg { font-size: 16px; line-height: 22px; }
              .text-xl { font-size: 18px; line-height: 24px; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-start { align-items: flex-start; }
              .w-full { width: 100%; }
              .p-4 { padding: 16px; }
              .mb-2 { margin-bottom: 8px; }
              .border-b { border-bottom: 1px solid #D1D5DB; }
              .border-t { border-top: 1px solid #D1D5DB; }
              .border { border: 1px solid #D1D5DB; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #D1D5DB; padding: 8px 12px; vertical-align: middle; }
              .table-header { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }
              .table-footer { background-color: #EDE9FE; color: #1F2937; font-weight: 600; border-top: 2px solid #D1D5DB; }
              .invoice-box { background: white; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; }
              .signature-box { background: #F5F3FF; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; text-align: center; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="primary-bg p-4 border-b">
              <div class="flex justify-between items-start" style="gap: 16px;">
                <div style="flex: 1;">
                  <h1 class="text-xl font-bold primary-text mb-2">${companyDetails.name}</h1>
                  <div class="accent-text text-sm">
                    <div class="mb-2">${companyDetails.address}</div>
                    <div class="mb-2">${companyDetails.landmark}</div>
                    <div class="mb-2">${companyDetails.city}, ${companyDetails.state}</div>
                    <div class="font-medium">Mobile: ${companyDetails.mobile}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="invoice-box">
                    <div class="text-sm accent-text mb-2">ORIGINAL FOR RECIPIENT</div>
                    <h2 class="text-lg font-bold primary-text mb-2">BILL OF SUPPLY</h2>
                    <div class="mb-2">
                      <div class="text-sm accent-text">Invoice No.</div>
                      <div class="text-base font-semibold primary-text">${invoice.invoiceNumber}</div>
                    </div>
                    <div>
                      <div class="text-sm accent-text">Invoice Date</div>
                      <div class="text-sm font-medium primary-text">${new Date(invoice.date).toLocaleDateString('en-GB')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="highlight-bg p-4 border-b">
              <h3 class="text-sm font-semibold primary-text mb-2">BILL TO</h3>
              <div class="text-base font-semibold primary-text mb-2">${invoice.customerName}</div>
              ${party?.phone ? `<div class="text-sm accent-text mb-2">Mobile: <span class="font-medium">${party.phone}</span></div>` : ''}
              ${party?.address ? `<div class="text-sm accent-text">${party.address}</div>` : ''}
            </div>

            <table class="w-full">
              <thead>
                <tr class="table-header">
                  <th class="text-sm font-semibold text-left" style="width: 8%;">S.NO.</th>
                  <th class="text-sm font-semibold text-left" style="width: 40%;">ITEMS</th>
                  <th class="text-sm font-semibold text-center" style="width: 12%;">QTY.</th>
                  <th class="text-sm font-semibold text-right" style="width: 13%;">MRP</th>
                  <th class="text-sm font-semibold text-right" style="width: 13%;">RATE</th>
                  <th class="text-sm font-semibold text-right" style="width: 14%;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map((item, index) => `
                  <tr>
                    <td class="text-sm text-center primary-text">${index + 1}</td>
                    <td class="text-sm primary-text">${item.productName}</td>
                    <td class="text-sm text-center primary-text">${item.quantity} PCS</td>
                    <td class="text-sm text-right primary-text">${item.mrp || Math.round(item.price * 1.2)}</td>
                    <td class="text-sm text-right primary-text">${item.price.toFixed(0)}</td>
                    <td class="text-sm text-right font-semibold primary-text">₹ ${item.amount.toFixed(0)}</td>
                  </tr>
                `).join('')}
                
                <tr class="table-footer">
                  <td></td>
                  <td class="text-sm font-semibold">SUBTOTAL</td>
                  <td class="text-sm font-semibold text-center">${invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td></td>
                  <td></td>
                  <td class="text-sm font-semibold text-right">₹ ${invoice.subtotal.toFixed(0)}</td>
                </tr>
                
                ${invoice.discount && invoice.discount > 0 ? `
                <tr style="background-color: #F5F3FF;">
                  <td></td>
                  <td class="text-sm font-semibold" style="color: #7C3AED;">DISCOUNT</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td class="text-sm font-semibold text-right" style="color: #DC2626;">- ₹ ${invoice.discount.toFixed(0)}</td>
                </tr>
                ` : ''}
                
                ${invoice.otherCharges && invoice.otherCharges > 0 ? `
                <tr style="background-color: #F5F3FF;">
                  <td></td>
                  <td class="text-sm font-semibold" style="color: #7C3AED;">OTHER CHARGES</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${invoice.otherCharges.toFixed(0)}</td>
                </tr>
                ` : ''}
              </tbody>
            </table>

            <div class="p-4">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <div class="text-sm font-semibold primary-text mb-2">Total Amount (in words)</div>
                  <div class="text-sm accent-text">${convertAmountToWords(Math.floor(invoice.total))} Rupees Only</div>
                  
                  ${invoice.status === 'paid' ? `
                    <div style="margin-top: 16px; padding: 12px; background: #ECFDF5; border-radius: 6px; border: 1px solid #10B981;">
                      <div class="text-sm font-semibold" style="color: #047857; margin-bottom: 4px;">
                        Payment Status
                      </div>
                      <div class="text-sm font-bold" style="color: #047857;">
                        ✓ PAID
                      </div>
                    </div>
                  ` : invoice.status === 'overdue' ? `
                    <div style="margin-top: 16px; padding: 12px; background: #FEE2E2; border-radius: 6px; border: 1px solid #DC2626;">
                      <div class="text-sm font-semibold" style="color: #991B1B; margin-bottom: 4px;">
                        Payment Status
                      </div>
                      <div class="text-sm font-bold" style="color: #991B1B;">
                        ⚠ OVERDUE
                      </div>
                      ${invoice.dueDate ? `
                        <div class="text-xs" style="color: #991B1B; margin-top: 4px; font-weight: 600;">
                          Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}
                        </div>
                      ` : ''}
                    </div>
                  ` : invoice.status === 'draft' ? `
                    <div style="margin-top: 16px; padding: 12px; background: #FEF3C7; border-radius: 6px; border: 1px solid #F59E0B;">
                      <div class="text-sm font-semibold" style="color: #D97706; margin-bottom: 4px;">
                        Payment Status
                      </div>
                      <div class="text-sm font-bold" style="color: #D97706;">
                        ⏳ DUE
                      </div>
                      ${invoice.dueDate ? `
                        <div class="text-xs" style="color: #92400E; margin-top: 4px; font-weight: 600;">
                          Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #D1D5DB;">
                    <span class="text-sm font-semibold accent-text">Total Amount</span>
                    <span class="text-sm font-bold primary-text">₹ ${invoice.total.toFixed(0)}</span>
                  </div>
                </div>
              </div>
             </div>

            <div style="background: #F5F3FF; padding: 24px; text-center; border-top: 1px solid #D1D5DB; page-break-inside: avoid;">
              <div style="background: white; border: 2px solid #D1D5DB; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 16px; font-weight: bold; color: #1F2937; margin-bottom: 12px; line-height: 1.5; font-family: Arial, sans-serif;">
                  આપનો વિશ્વાસુ - પ્રજાપતિ મહેશ
                </div>
                <div style="font-size: 11px; color: #4B5563; font-weight: 600; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
                  AUTHORISED SIGNATURE
                </div>
              </div>
            </div>

            ${invoice.notes ? `
              <div class="p-4 border-t">
                <div class="text-sm primary-text">
                  <strong>Notes:</strong> ${invoice.notes}
                </div>
              </div>
            ` : ''}
          </body>
        </html>
      `;
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        image: {
          type: 'jpeg',
          quality: 0.98
        },
        html2canvas: {
          scale: 2,
          useCORS: true
        },
        jsPDF: {
          unit: 'pt',
          format: 'a4',
          orientation: 'portrait'
        }
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

  const getShareText = () => {
    const paymentStatus = getPaymentStatusText(invoice);
    return `*Invoice ${invoice.invoiceNumber}*\n\nCustomer: ${invoice.customerName}\nDate: ${format(invoice.date, 'PP')}\n${paymentStatus}\n\nItems:\n${invoice.items.map((item, index) => `${index + 1}. ${item.productName} - Qty: ${item.quantity} - ₹${item.amount}`).join('\n')}`;
  };
  const handleWhatsAppShare = async () => {
    try {
      // Check if party has a phone number
      if (!party?.phone) {
        toast({
          title: "No Phone Number",
          description: "This party does not have a phone number. Please update their details first.",
          variant: "destructive"
        });
        return;
      }

      // Format phone number for WhatsApp (remove spaces, +, and other non-numeric characters)
      let formattedPhone = party.phone.replace(/[^\d]/g, '');
      
      // Add country code if not present (assuming India +91)
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
  const generateAndSharePDF = async (phoneNumber: string) => {
    const html2pdf = (await import('html2pdf.js')).default as any;
    const companyDetails = {
      name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ",
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
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill of Supply - ${invoice.invoiceNumber}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: white; color: #1F2937; }
            .primary-bg { background-color: #EDE9FE; }
            .primary-text { color: #1F2937; }
            .accent-text { color: #4B5563; }
            .highlight-bg { background-color: #F5F3FF; }
            .text-sm { font-size: 12px; line-height: 18px; }
            .text-base { font-size: 14px; line-height: 20px; }
            .text-lg { font-size: 16px; line-height: 22px; }
            .text-xl { font-size: 18px; line-height: 24px; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .w-full { width: 100%; }
            .p-4 { padding: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .border-b { border-bottom: 1px solid #D1D5DB; }
            .border-t { border-top: 1px solid #D1D5DB; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #D1D5DB; padding: 8px 12px; vertical-align: middle; }
            .table-header { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }
            .table-footer { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }
            .invoice-box { background: white; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; }
          </style>
        </head>
        <body>
          <div class="primary-bg p-4 border-b">
            <div class="flex justify-between" style="gap: 16px;">
              <div style="flex: 1;">
                <h1 class="text-xl font-bold primary-text mb-2">${companyDetails.name}</h1>
                <div class="accent-text text-sm">
                  <div class="mb-2">${companyDetails.address}</div>
                  <div class="mb-2">${companyDetails.landmark}</div>
                  <div class="mb-2">${companyDetails.city}, ${companyDetails.state}</div>
                  <div class="font-medium">Mobile: ${companyDetails.mobile}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="invoice-box">
                  <div class="text-sm accent-text mb-2">ORIGINAL FOR RECIPIENT</div>
                  <h2 class="text-lg font-bold primary-text mb-2">BILL OF SUPPLY</h2>
                  <div class="mb-2">
                    <div class="text-sm accent-text">Invoice No.</div>
                    <div class="text-base font-semibold primary-text">${invoice.invoiceNumber}</div>
                  </div>
                  <div>
                    <div class="text-sm accent-text">Invoice Date</div>
                    <div class="text-sm font-medium primary-text">${new Date(invoice.date).toLocaleDateString('en-GB')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="highlight-bg p-4 border-b">
            <h3 class="text-sm font-semibold primary-text mb-2">BILL TO</h3>
            <div class="text-base font-semibold primary-text mb-2">${invoice.customerName}</div>
            ${party?.phone ? `<div class="text-sm accent-text mb-2">Mobile: <span class="font-medium">${party.phone}</span></div>` : ''}
            ${party?.address ? `<div class="text-sm accent-text">${party.address}</div>` : ''}
          </div>

          <table class="w-full">
            <thead>
              <tr class="table-header">
                <th class="text-sm font-semibold" style="width: 8%;">S.NO.</th>
                <th class="text-sm font-semibold" style="width: 40%;">ITEMS</th>
                <th class="text-sm font-semibold text-center" style="width: 12%;">QTY.</th>
                <th class="text-sm font-semibold text-right" style="width: 13%;">MRP</th>
                <th class="text-sm font-semibold text-right" style="width: 13%;">RATE</th>
                <th class="text-sm font-semibold text-right" style="width: 14%;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item, index) => `
                <tr>
                  <td class="text-sm text-center primary-text">${index + 1}</td>
                  <td class="text-sm primary-text">${item.productName}</td>
                  <td class="text-sm text-center primary-text">${item.quantity} PCS</td>
                  <td class="text-sm text-right primary-text">${item.mrp || Math.round(item.price * 1.2)}</td>
                  <td class="text-sm text-right primary-text">${item.price.toFixed(0)}</td>
                  <td class="text-sm text-right font-semibold primary-text">₹ ${item.amount.toFixed(0)}</td>
                </tr>
              `).join('')}
              
              <tr class="table-footer">
                <td></td>
                <td class="text-sm font-semibold">SUBTOTAL</td>
                <td class="text-sm font-semibold text-center">${invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td></td>
                <td></td>
                <td class="text-sm font-semibold text-right">₹ ${invoice.subtotal.toFixed(0)}</td>
              </tr>
              
              ${invoice.discount && invoice.discount > 0 ? `
              <tr style="background-color: #F5F3FF;">
                <td></td>
                <td class="text-sm font-semibold" style="color: #7C3AED;">DISCOUNT</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="text-sm font-semibold text-right" style="color: #DC2626;">- ₹ ${invoice.discount.toFixed(0)}</td>
              </tr>
              ` : ''}
              
              ${invoice.otherCharges && invoice.otherCharges > 0 ? `
              <tr style="background-color: #F5F3FF;">
                <td></td>
                <td class="text-sm font-semibold" style="color: #7C3AED;">OTHER CHARGES</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${invoice.otherCharges.toFixed(0)}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="p-4">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <div class="text-sm font-semibold primary-text mb-2">Total Amount (in words)</div>
                <div class="text-sm accent-text">${convertAmountToWords(Math.floor(invoice.total))} Rupees Only</div>
                
                ${invoice.status === 'paid' ? `
                  <div style="margin-top: 16px; padding: 12px; background: #ECFDF5; border-radius: 6px; border: 1px solid #10B981;">
                    <div class="text-sm font-semibold" style="color: #047857; margin-bottom: 4px;">
                      Payment Status
                    </div>
                    <div class="text-sm font-bold" style="color: #047857;">
                      ✓ PAID
                    </div>
                  </div>
                ` : invoice.status === 'overdue' ? `
                  <div style="margin-top: 16px; padding: 12px; background: #FEE2E2; border-radius: 6px; border: 1px solid #DC2626;">
                    <div class="text-sm font-semibold" style="color: #991B1B; margin-bottom: 4px;">
                      Payment Status
                    </div>
                    <div class="text-sm font-bold" style="color: #991B1B;">
                      ⚠ OVERDUE
                    </div>
                    ${invoice.dueDate ? `
                      <div class="text-xs" style="color: #991B1B; margin-top: 4px; font-weight: 600;">
                        Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}
                      </div>
                    ` : ''}
                  </div>
                ` : invoice.status === 'draft' ? `
                  <div style="margin-top: 16px; padding: 12px; background: #FEF3C7; border-radius: 6px; border: 1px solid #F59E0B;">
                    <div class="text-sm font-semibold" style="color: #D97706; margin-bottom: 4px;">
                      Payment Status
                    </div>
                    <div class="text-sm font-bold" style="color: #D97706;">
                      ⏳ DUE
                    </div>
                    ${invoice.dueDate ? `
                      <div class="text-xs" style="color: #92400E; margin-top: 4px; font-weight: 600;">
                        Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              <div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #D1D5DB;">
                  <span class="text-sm font-semibold accent-text">Total Amount</span>
                  <span class="text-sm font-bold primary-text">₹ ${invoice.total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div style="background: #F5F3FF; padding: 24px; text-center; border-top: 1px solid #D1D5DB;">
            <div style="background: white; border: 2px solid #D1D5DB; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px;">
              <div style="font-size: 16px; font-weight: bold; color: #1F2937; margin-bottom: 12px;">
                આપનો વિશ્વાસુ - પ્રજાપતિ મહેશ
              </div>
              <div style="font-size: 11px; color: #4B5563; font-weight: 600; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
                AUTHORISED SIGNATURE
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF as blob
    const pdfBlob = await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `Invoice-${invoice.invoiceNumber}.pdf`,
      image: {
        type: 'jpeg',
        quality: 0.98
      },
      html2canvas: {
        scale: 2,
        useCORS: true
      },
      jsPDF: {
        unit: 'pt',
        format: 'a4',
        orientation: 'portrait'
      }
    }).from(htmlContent).outputPdf('blob');

    // Create file for sharing
    const file = new File([pdfBlob], `Invoice-${invoice.invoiceNumber}.pdf`, {
      type: 'application/pdf'
    });
    const shareData = {
      title: `Invoice ${invoice.invoiceNumber}`,
      text: `Invoice for ${invoice.customerName} - ₹${invoice.total.toLocaleString()}`,
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
      // Fallback to basic text sharing with specific number
      const paymentStatusBasic = getPaymentStatusText(invoice);
      const text = `*Invoice ${invoice.invoiceNumber}*\n\nCustomer: ${invoice.customerName}\nDate: ${format(invoice.date, 'PP')}\n${paymentStatusBasic}`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
      // Download PDF for manual attachment
      await handleDownload();
      toast({
        title: "WhatsApp Opened & PDF Downloaded",
        description: "Text shared to WhatsApp. PDF downloaded for manual attachment.",
        duration: 5000,
      });
    }
  };

  const generatePDFAndShareToWhatsApp = async (phoneNumber: string) => {
    const html2pdf = (await import('html2pdf.js')).default as any;
    const companyDetails = {
      name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ",
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

    const htmlContent = `<!DOCTYPE html><html><head><title>Bill of Supply - ${invoice.invoiceNumber}</title><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; }body { font-family: Arial, sans-serif; background: white; color: #1F2937; }.primary-bg { background-color: #EDE9FE; }.primary-text { color: #1F2937; }.accent-text { color: #4B5563; }.highlight-bg { background-color: #F5F3FF; }.text-sm { font-size: 12px; line-height: 18px; }.text-base { font-size: 14px; line-height: 20px; }.text-lg { font-size: 16px; line-height: 22px; }.text-xl { font-size: 18px; line-height: 24px; }.font-bold { font-weight: 700; }.font-semibold { font-weight: 600; }.font-medium { font-weight: 500; }.text-center { text-align: center; }.text-right { text-align: right; }.flex { display: flex; }.justify-between { justify-content: space-between; }.w-full { width: 100%; }.p-4 { padding: 16px; }.mb-2 { margin-bottom: 8px; }.border-b { border-bottom: 1px solid #D1D5DB; }.border-t { border-top: 1px solid #D1D5DB; }table { border-collapse: collapse; width: 100%; }th, td { border: 1px solid #D1D5DB; padding: 8px 12px; vertical-align: middle; }.table-header { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.table-footer { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.invoice-box { background: white; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; }</style></head><body><div class="primary-bg p-4 border-b"><div class="flex justify-between" style="gap: 16px;"><div style="flex: 1;"><h1 class="text-xl font-bold primary-text mb-2">${companyDetails.name}</h1><div class="accent-text text-sm"><div class="mb-2">${companyDetails.address}</div><div class="mb-2">${companyDetails.landmark}</div><div class="mb-2">${companyDetails.city}, ${companyDetails.state}</div><div class="font-medium">Mobile: ${companyDetails.mobile}</div></div></div><div class="text-right"><div class="invoice-box"><div class="text-sm accent-text mb-2">ORIGINAL FOR RECIPIENT</div><h2 class="text-lg font-bold primary-text mb-2">BILL OF SUPPLY</h2><div class="mb-2"><div class="text-sm accent-text">Invoice No.</div><div class="text-base font-semibold primary-text">${invoice.invoiceNumber}</div></div><div><div class="text-sm accent-text">Invoice Date</div><div class="text-sm font-medium primary-text">${new Date(invoice.date).toLocaleDateString('en-GB')}</div></div></div></div></div></div><div class="highlight-bg p-4 border-b"><h3 class="text-sm font-semibold primary-text mb-2">BILL TO</h3><div class="text-base font-semibold primary-text mb-2">${invoice.customerName}</div>${party?.phone ? `<div class="text-sm accent-text mb-2">Mobile: <span class="font-medium">${party.phone}</span></div>` : ''}${party?.address ? `<div class="text-sm accent-text">${party.address}</div>` : ''}</div><table class="w-full"><thead><tr class="table-header"><th class="text-sm font-semibold" style="width: 8%;">S.NO.</th><th class="text-sm font-semibold" style="width: 40%;">ITEMS</th><th class="text-sm font-semibold text-center" style="width: 12%;">QTY.</th><th class="text-sm font-semibold text-right" style="width: 13%;">MRP</th><th class="text-sm font-semibold text-right" style="width: 13%;">RATE</th><th class="text-sm font-semibold text-right" style="width: 14%;">AMOUNT</th></tr></thead><tbody>${invoice.items.map((item, index) => `<tr><td class="text-sm text-center primary-text">${index + 1}</td><td class="text-sm primary-text">${item.productName}</td><td class="text-sm text-center primary-text">${item.quantity} PCS</td><td class="text-sm text-right primary-text">${item.mrp || Math.round(item.price * 1.2)}</td><td class="text-sm text-right primary-text">${item.price.toFixed(0)}</td><td class="text-sm text-right font-semibold primary-text">₹ ${item.amount.toFixed(0)}</td></tr>`).join('')}<tr class="table-footer"><td></td><td class="text-sm font-semibold">SUBTOTAL</td><td class="text-sm font-semibold text-center">${invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td></td><td></td><td class="text-sm font-semibold text-right">₹ ${invoice.subtotal.toFixed(0)}</td></tr>${invoice.discount && invoice.discount > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">DISCOUNT</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #DC2626;">- ₹ ${invoice.discount.toFixed(0)}</td></tr>` : ''}${invoice.otherCharges && invoice.otherCharges > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">OTHER CHARGES</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${invoice.otherCharges.toFixed(0)}</td></tr>` : ''}</tbody></table><div class="p-4"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;"><div><div class="text-sm font-semibold primary-text mb-2">Total Amount (in words)</div><div class="text-sm accent-text">${convertAmountToWords(Math.floor(invoice.total))} Rupees Only</div>${invoice.dueDate || invoice.status ? `<div style="margin-top: 16px; padding: 12px; background: ${invoice.status === 'paid' ? '#ECFDF5' : '#FEF3C7'}; border-radius: 6px; border: 1px solid ${invoice.status === 'paid' ? '#10B981' : '#F59E0B'};"><div class="text-sm font-semibold" style="color: ${invoice.status === 'paid' ? '#047857' : '#D97706'}; margin-bottom: 4px;">Payment Status</div><div class="text-sm font-bold" style="color: ${invoice.status === 'paid' ? '#047857' : '#D97706'};">${invoice.status === 'paid' ? '✓ PAID' : invoice.status === 'overdue' ? '⚠ OVERDUE' : '⏳ PENDING'}</div>${invoice.dueDate && invoice.status !== 'paid' ? `<div class="text-xs" style="color: #78716C; margin-top: 4px;">Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}</div>` : ''}</div>` : ''}</div><div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #D1D5DB;"><span class="text-sm font-semibold accent-text">Total Amount</span><span class="text-sm font-bold primary-text">₹ ${invoice.total.toFixed(0)}</span></div></div></div></div><div style="background: #F5F3FF; padding: 24px; text-center; border-top: 1px solid #D1D5DB;"><div style="background: white; border: 2px solid #D1D5DB; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px;"><div style="font-size: 16px; font-weight: bold; color: #1F2937; margin-bottom: 12px;">આપનો વિશ્વાસુ - પ્રજાપતિ મહેશ</div><div style="font-size: 11px; color: #4B5563; font-weight: 600; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">AUTHORISED SIGNATURE</div></div></div></body></html>`;

    // Generate PDF as blob
    const pdfBlob = await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `Invoice-${invoice.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }).from(htmlContent).outputPdf('blob');

    // Create file for sharing
    const file = new File([pdfBlob], `Invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

    // Use native share API with WhatsApp intent
    const paymentStatus = getPaymentStatusText(invoice);
    const shareData = {
      title: `Invoice ${invoice.invoiceNumber} for ${party?.name}`,
      text: `Hello ${party?.name}, please find your invoice #${invoice.invoiceNumber} attached.\n\nInvoice Details:\n• Invoice Number: ${invoice.invoiceNumber}\n• Date: ${format(invoice.date, 'PP')}\n• ${paymentStatus}\n\nPlease find the PDF attached.`,
      files: [file]
    };

    // Try to share directly
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      toast({
        title: "PDF Shared Successfully",
        description: `Invoice shared to WhatsApp for ${party?.name}!`
      });
    } else {
      throw new Error('Native sharing not supported');
    }
  };

  const generateAndSharePDFToNumber = async (phoneNumber: string) => {
    try {
      const html2pdf = (await import('html2pdf.js')).default as any;
      const companyDetails = {
        name: "શ્રી ગણેશ ગૃહ ઉદ્યોગ",
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

      const htmlContent = `<!DOCTYPE html><html><head><title>Bill of Supply - ${invoice.invoiceNumber}</title><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; }body { font-family: Arial, sans-serif; background: white; color: #1F2937; }.primary-bg { background-color: #EDE9FE; }.primary-text { color: #1F2937; }.accent-text { color: #4B5563; }.highlight-bg { background-color: #F5F3FF; }.text-sm { font-size: 12px; line-height: 18px; }.text-base { font-size: 14px; line-height: 20px; }.text-lg { font-size: 16px; line-height: 22px; }.text-xl { font-size: 18px; line-height: 24px; }.font-bold { font-weight: 700; }.font-semibold { font-weight: 600; }.font-medium { font-weight: 500; }.text-center { text-align: center; }.text-right { text-align: right; }.flex { display: flex; }.justify-between { justify-content: space-between; }.w-full { width: 100%; }.p-4 { padding: 16px; }.mb-2 { margin-bottom: 8px; }.border-b { border-bottom: 1px solid #D1D5DB; }.border-t { border-top: 1px solid #D1D5DB; }table { border-collapse: collapse; width: 100%; }th, td { border: 1px solid #D1D5DB; padding: 8px 12px; vertical-align: middle; }.table-header { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.table-footer { background-color: #EDE9FE; color: #1F2937; font-weight: 600; }.invoice-box { background: white; border: 1px solid #D1D5DB; border-radius: 6px; padding: 12px; }</style></head><body><div class="primary-bg p-4 border-b"><div class="flex justify-between" style="gap: 16px;"><div style="flex: 1;"><h1 class="text-xl font-bold primary-text mb-2">${companyDetails.name}</h1><div class="accent-text text-sm"><div class="mb-2">${companyDetails.address}</div><div class="mb-2">${companyDetails.landmark}</div><div class="mb-2">${companyDetails.city}, ${companyDetails.state}</div><div class="font-medium">Mobile: ${companyDetails.mobile}</div></div></div><div class="text-right"><div class="invoice-box"><div class="text-sm accent-text mb-2">ORIGINAL FOR RECIPIENT</div><h2 class="text-lg font-bold primary-text mb-2">BILL OF SUPPLY</h2><div class="mb-2"><div class="text-sm accent-text">Invoice No.</div><div class="text-base font-semibold primary-text">${invoice.invoiceNumber}</div></div><div><div class="text-sm accent-text">Invoice Date</div><div class="text-sm font-medium primary-text">${new Date(invoice.date).toLocaleDateString('en-GB')}</div></div></div></div></div></div><div class="highlight-bg p-4 border-b"><h3 class="text-sm font-semibold primary-text mb-2">BILL TO</h3><div class="text-base font-semibold primary-text mb-2">${invoice.customerName}</div>${party?.phone ? `<div class="text-sm accent-text mb-2">Mobile: <span class="font-medium">${party.phone}</span></div>` : ''}${party?.address ? `<div class="text-sm accent-text">${party.address}</div>` : ''}</div><table class="w-full"><thead><tr class="table-header"><th class="text-sm font-semibold" style="width: 8%;">S.NO.</th><th class="text-sm font-semibold" style="width: 40%;">ITEMS</th><th class="text-sm font-semibold text-center" style="width: 12%;">QTY.</th><th class="text-sm font-semibold text-right" style="width: 13%;">MRP</th><th class="text-sm font-semibold text-right" style="width: 13%;">RATE</th><th class="text-sm font-semibold text-right" style="width: 14%;">AMOUNT</th></tr></thead><tbody>${invoice.items.map((item, index) => `<tr><td class="text-sm text-center primary-text">${index + 1}</td><td class="text-sm primary-text">${item.productName}</td><td class="text-sm text-center primary-text">${item.quantity} PCS</td><td class="text-sm text-right primary-text">${item.mrp || Math.round(item.price * 1.2)}</td><td class="text-sm text-right primary-text">${item.price.toFixed(0)}</td><td class="text-sm text-right font-semibold primary-text">₹ ${item.amount.toFixed(0)}</td></tr>`).join('')}<tr class="table-footer"><td></td><td class="text-sm font-semibold">SUBTOTAL</td><td class="text-sm font-semibold text-center">${invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td></td><td></td><td class="text-sm font-semibold text-right">₹ ${invoice.subtotal.toFixed(0)}</td></tr>${invoice.discount && invoice.discount > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">DISCOUNT</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #DC2626;">- ₹ ${invoice.discount.toFixed(0)}</td></tr>` : ''}${invoice.otherCharges && invoice.otherCharges > 0 ? `<tr style="background-color: #F5F3FF;"><td></td><td class="text-sm font-semibold" style="color: #7C3AED;">OTHER CHARGES</td><td></td><td></td><td></td><td class="text-sm font-semibold text-right" style="color: #7C3AED;">₹ ${invoice.otherCharges.toFixed(0)}</td></tr>` : ''}</tbody></table><div class="p-4"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;"><div><div class="text-sm font-semibold primary-text mb-2">Total Amount (in words)</div><div class="text-sm accent-text">${convertAmountToWords(Math.floor(invoice.total))} Rupees Only</div>${invoice.dueDate || invoice.status ? `<div style="margin-top: 16px; padding: 12px; background: ${invoice.status === 'paid' ? '#ECFDF5' : '#FEF3C7'}; border-radius: 6px; border: 1px solid ${invoice.status === 'paid' ? '#10B981' : '#F59E0B'};"><div class="text-sm font-semibold" style="color: ${invoice.status === 'paid' ? '#047857' : '#D97706'}; margin-bottom: 4px;">Payment Status</div><div class="text-sm font-bold" style="color: ${invoice.status === 'paid' ? '#047857' : '#D97706'};">${invoice.status === 'paid' ? '✓ PAID' : invoice.status === 'overdue' ? '⚠ OVERDUE' : '⏳ PENDING'}</div>${invoice.dueDate && invoice.status !== 'paid' ? `<div class="text-xs" style="color: #78716C; margin-top: 4px;">Due Date: ${format(invoice.dueDate, 'MMM dd, yyyy')}</div>` : ''}</div>` : ''}</div><div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #D1D5DB;"><span class="text-sm font-semibold accent-text">Total Amount</span><span class="text-sm font-bold primary-text">₹ ${invoice.total.toFixed(0)}</span></div></div></div></div><div style="background: #F5F3FF; padding: 24px; text-center; border-top: 1px solid #D1D5DB;"><div style="background: white; border: 2px solid #D1D5DB; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 300px;"><div style="font-size: 16px; font-weight: bold; color: #1F2937; margin-bottom: 12px;">આપનો વિશ્વાસુ - પ્રજાપતિ મહેશ</div><div style="font-size: 11px; color: #4B5563; font-weight: 600; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">AUTHORISED SIGNATURE</div></div></div></body></html>`;

      // Generate PDF as blob
      const pdfBlob = await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      }).from(htmlContent).outputPdf('blob');

      // Create file for sharing
      const file = new File([pdfBlob], `Invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

      // Create share data with pre-filled message for specific number
      const paymentStatus = getPaymentStatusText(invoice);
      const shareData = {
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Hello ${party?.name}, please find your invoice #${invoice.invoiceNumber} attached.\n\nInvoice Details:\n• Invoice Number: ${invoice.invoiceNumber}\n• Date: ${format(invoice.date, 'PP')}\n• ${paymentStatus}\n\nPlease find the PDF attached.`,
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
        const paymentStatusFallback = getPaymentStatusText(invoice);
        const text = `Hello ${party?.name}, please find your invoice #${invoice.invoiceNumber} attached.\n\nInvoice Details:\n• Invoice Number: ${invoice.invoiceNumber}\n• Date: ${format(invoice.date, 'PP')}\n• ${paymentStatusFallback}\n\nPlease find the PDF attached.`;
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');

        // Also trigger PDF download
        await html2pdf().set({
          margin: [10, 10, 10, 10],
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
        }).from(htmlContent).save();

        toast({
          title: "WhatsApp Opened",
          description: `Opened WhatsApp with ${party?.name}. PDF downloaded for attachment.`,
        });
      }
    } catch (error) {
      console.error('PDF sharing error:', error);
      toast({
        title: "Share Error",
        description: "Failed to share PDF. Please try downloading the PDF and sharing manually.",
        variant: "destructive"
      });
    }
  };

  const handleEmailShare = () => {
    const subject = `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`;
    const body = getShareText();
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
    toast({
      title: "Opening Email",
      description: "Share your invoice via email."
    });
  };
  const handleCopyToClipboard = async () => {
    try {
      const shareText = getShareText();
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to Clipboard",
        description: "Invoice details copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };
  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: getShareText(),
          url: window.location.href
        });
        toast({
          title: "Shared Successfully",
          description: "Invoice details shared successfully."
        });
      } else {
        await handleCopyToClipboard();
      }
    } catch (error) {
      toast({
        title: "Share Error",
        description: "Failed to share invoice. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleCloseDialog = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowPreview(false);
  };
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showPreview) {
      setShowPreview(false);
    } else {
      setShowPreview(true);
    }
  };
  return <>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogTrigger asChild>
          <div onClick={handleTriggerClick}>
            {children}
          </div>
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-7xl h-[92vh] p-0 flex flex-col glass-card border-2 shadow-2xl overflow-hidden">
          {/* Enhanced Header */}
          <DialogHeader className="relative p-4 sm:p-6 border-b glass-border bg-gradient-to-r from-primary/8 via-primary/5 to-accent/8 backdrop-blur-sm shrink-0">
            <DialogTitle className="flex items-center justify-between gap-3 text-foreground">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-primary/15 rounded-xl shadow-sm">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold">Invoice Preview</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground font-medium">{invoice.invoiceNumber}</span>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
            </DialogTitle>
          </DialogHeader>
          
          {/* Enhanced Action Bar */}
          <div className="p-4 sm:p-6 border-b glass-border bg-muted/20 shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex flex-wrap gap-2 sm:gap-3 flex-1">
                <Button type="button" onClick={handleDownload} variant="outline" size="default" className="min-w-[110px] sm:min-w-[130px] glass-button hover:bg-secondary hover:text-secondary-foreground hover:border-secondary transition-all duration-200 font-medium">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">Download</span>
                </Button>
                <Button type="button" onClick={handleWhatsAppShare} variant="outline" size="default" className="min-w-[110px] sm:min-w-[130px] glass-button hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all duration-200 font-medium">
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span className="hidden sm:inline">Share to WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    navigator.clipboard.writeText(invoice.customerName);
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
                {party?.location_link && (
                  <Button 
                    type="button" 
                    onClick={() => window.open(party.location_link, '_blank')} 
                    variant="outline" 
                    size="default" 
                    className="min-w-[110px] sm:min-w-[130px] glass-button hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 font-medium"
                  >
                    <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                    <span>Location</span>
                  </Button>
                )}
              </div>
              
              {/* Invoice Summary */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-l pl-4 ml-4 hidden sm:flex">
                <div className="text-right">
                  <div className="font-medium text-card-foreground">₹{invoice.total.toLocaleString()}</div>
                  <div className="text-xs">Total Amount</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Invoice Preview */}
          <ScrollArea className="flex-1 bg-gradient-to-b from-background via-muted/5 to-muted/10">
            <div className="p-4 sm:p-8 min-h-full">
              <div className="bg-background rounded-xl shadow-lg border-2 glass-border p-4 sm:p-8 max-w-5xl mx-auto">
                <BillOfSupply invoice={invoice} party={party} />
              </div>
            </div>
          </ScrollArea>

          {/* Mobile Summary Bar */}
          <div className="sm:hidden p-4 border-t glass-border bg-muted/10 shrink-0">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-lg text-card-foreground">₹{invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showPrint && <InvoicePrint invoice={invoice} key={`print-${invoice.id}-${Date.now()}`} />}
    </>;
};