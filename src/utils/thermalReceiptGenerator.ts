import { SalesInvoice } from '@/types/billing';
import { format } from 'date-fns';

// Utility to center text for 32-character width (58mm thermal paper)
// Uses proper Unicode character counting for Gujarati and other scripts
const centerText = (text: string, width = 32): string => {
  // Count actual display width (handles Gujarati combining characters)
  const visualLength = [...text].length;
  const padding = Math.max(0, Math.floor((width - visualLength) / 2));
  return ' '.repeat(padding) + text;
};

// Utility to create a separator line
const separator = (char = '-', width = 32): string => char.repeat(width);

// Utility to format a row with left and right alignment
// Handles Unicode properly for Gujarati text
const formatRow = (left: string, right: string, width = 32): string => {
  const leftLength = [...left].length;
  const rightLength = [...right].length;
  const spaces = Math.max(1, width - leftLength - rightLength);
  return left + ' '.repeat(spaces) + right;
};

// Utility to wrap long text into multiple lines (Unicode-aware)
const wrapText = (text: string, maxWidth = 30): string[] => {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if ([...testLine].length <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
};

// Convert amount to words (simplified for INR)
const convertAmountToWords = (amount: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (amount === 0) return 'Zero Rupees Only';

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const crores = Math.floor(amount / 10000000);
  const lakhs = Math.floor((amount % 10000000) / 100000);
  const thousands = Math.floor((amount % 100000) / 1000);
  const hundreds = amount % 1000;

  let result = '';
  if (crores > 0) result += convertLessThanThousand(crores) + ' Crore ';
  if (lakhs > 0) result += convertLessThanThousand(lakhs) + ' Lakh ';
  if (thousands > 0) result += convertLessThanThousand(thousands) + ' Thousand ';
  if (hundreds > 0) result += convertLessThanThousand(hundreds);

  return result.trim() + ' Rupees Only';
};

// Generate thermal receipt text with optimized formatting
export const generateThermalReceipt = (invoice: SalesInvoice, partyName?: string, partyPhone?: string, partyAddress?: string): string => {
  const lines: string[] = [];
  const width = 32;

  // Header - Bold and centered
  lines.push(centerText('BILL OF SUPPLY', width));
  lines.push(separator('=', width));

  // Company Info - Gujarati text supported with proper spacing
  lines.push(centerText('શ્રી ગણેશ ગૃહ ઉદ્યોગ', width));
  
  // Address lines split for better alignment
  const companyAddressParts = [
    '150Ft RING ROAD',
    'RAMAPIR CHOKDI',
    'SHASTRI NAGAR,',
    'B/H LIJJAT PAPAD,',
    '19/4 CORNER, RAJKOT',
    'Ph: 9624985555',
  ];

  // Wrap each part separately to prevent word splitting
  companyAddressParts.forEach((part) => {
    const wrappedLines = wrapText(part, width);
    wrappedLines.forEach((line) => {
      lines.push(centerText(line, width));
    });
  });

  lines.push('');
  lines.push(separator('-', width));

  // Invoice Details - One info per row
  lines.push(formatRow(`Invoice No: ${invoice.invoiceNumber}`, '', width));
  lines.push(formatRow(`Date: ${format(invoice.date, 'dd/MM/yy')}`, '', width));

  if (invoice.dueDate) {
    lines.push(formatRow(`Due Date: ${format(invoice.dueDate, 'dd/MM/yy')}`, '', width));
  }

  lines.push(separator('-', width));

  // Customer Details - Condensed format
  lines.push(centerText('BILLED TO', width));
  lines.push(centerText(invoice.customerName.toUpperCase(), width));

  // Combine customer info in one line when possible
  const customerInfo = [];
  if (partyPhone) customerInfo.push(`Ph: ${partyPhone}`);
  if (customerInfo.length > 0) {
    lines.push(centerText(customerInfo.join(' | '), width));
  }

  if (partyAddress) {
    // Use wrapText utility for consistent word wrapping
    const wrappedAddressLines = wrapText(partyAddress, width);
    wrappedAddressLines.forEach((line) => {
      lines.push(centerText(line, width));
    });
  }

  lines.push('');

  // Items Header
  lines.push(centerText('ITEMS PURCHASED', width));
  lines.push(separator('-', width));

  // Items - Optimized layout with proper wrapping
  invoice.items.forEach((item, index) => {
    // Product name with index - wrap if needed
    const itemName = `${index + 1}. ${item.productName}`;
    const productLines = wrapText(itemName, width - 2);
    productLines.forEach((line, idx) => {
      lines.push(idx === 0 ? line : `   ${line}`);
    });
    
    // Quantity x Price and Amount on same line
    const qtyPrice = `${item.quantity}x₹${item.price.toFixed(0)}`;
    const itemTotal = `₹${item.amount.toFixed(0)}`;
    lines.push(formatRow(`   ${qtyPrice}`, itemTotal, width));

    // Show MRP on next line if different
    if (item.mrp && Math.abs(item.mrp - item.price) > 1) {
      lines.push(`   (MRP: ₹${item.mrp.toFixed(0)})`);
    }
  });

  lines.push(separator('-', width));

  // Totals - More compact and readable
  lines.push(formatRow('Subtotal:', `₹${invoice.subtotal.toFixed(0)}`, width));

  if (invoice.discount && invoice.discount > 0) {
    lines.push(formatRow('Discount (-)', `₹${invoice.discount.toFixed(0)}`, width));
  }

  if (invoice.otherCharges && invoice.otherCharges > 0) {
    lines.push(formatRow('Other Charges (+)', `₹${invoice.otherCharges.toFixed(0)}`, width));
  }

  if (invoice.taxAmount > 0) {
    lines.push(formatRow('Tax:', `₹${invoice.taxAmount.toFixed(0)}`, width));
  }

  lines.push(separator('=', width));
  lines.push(formatRow('TOTAL AMT:', `₹${invoice.total.toFixed(0)}`, width));
  lines.push(separator('=', width));
  lines.push(separator('-', width));

  // Amount in Words - Use wrapText utility for consistent wrapping
  lines.push(centerText('AMOUNT IN WORDS', width));
  const amountInWords = convertAmountToWords(Math.floor(invoice.total));
  const wrappedAmountLines = wrapText(amountInWords, width);
  wrappedAmountLines.forEach((line) => {
    lines.push(centerText(line, width));
  });

  lines.push(separator('-', width));

  // Status and Notes - Combined when possible
  const statusLine = `Status: ${invoice.status.toUpperCase()}`;
  lines.push(centerText(statusLine, width));

  if (invoice.notes) {
    lines.push('');
    lines.push(centerText('NOTES', width));
    // Use wrapText utility for consistent notes wrapping
    const wrappedNotesLines = wrapText(invoice.notes, width);
    wrappedNotesLines.forEach((line) => {
      lines.push(centerText(line, width));
    });
  }

  lines.push(separator('-', width));
  lines.push(centerText('THANK YOU.', width));

  return lines.join('\n');
};
