import { SalesInvoice } from '@/types/billing';
import { hasGujarati, ensureGujaratiFont, buildReceiptImageBytes } from '@/utils/gujarati';
import { generateThermalReceipt } from '@/utils/thermalReceiptGenerator';
import BluetoothPrinterService from '@/services/BluetoothPrinterService';

// Print to thermal printer (fallback to browser print)
export const printThermalReceipt = async (invoice: SalesInvoice, partyName?: string, partyPhone?: string, partyAddress?: string) => {
  try {
    // Try to print to Bluetooth thermal printer first
    console.log('Attempting to print to Bluetooth thermal printer...');
    const success = await BluetoothPrinterService.printReceipt(invoice, partyName, partyPhone, partyAddress);

    if (success) {
      console.log('Successfully printed to Bluetooth thermal printer');
      return true;
    }

    // Fallback: Open print dialog with formatted text
    console.warn('Bluetooth printer not available, using browser print fallback');
    const receiptText = generateThermalReceipt(invoice, partyName, partyPhone, partyAddress);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Invoice - ${invoice.invoiceNumber}</title>
            <style>
                @font-face {
                  font-family: 'Noto Sans Gujarati';
                  src: url('/assets/fonts/NotoSansGujarati-Regular.ttf') format('truetype');
                  font-display: swap;
                }
                @media print {
                  @page {
                    size: 58mm auto;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 2mm;
                  }
                }
                body {
                  font-family: 'Noto Sans Gujarati', 'Courier New', monospace;
                  font-size: 10pt;
                  white-space: pre;
                  width: 58mm;
                  margin: 0 auto;
                  padding: 2mm;
                }
              </style>
          </head>
          <body>${receiptText}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();

      // Small delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
    return true;
  } catch (error) {
    console.error('Thermal print error:', error);
    throw error;
  }
};