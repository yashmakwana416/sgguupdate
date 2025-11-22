import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import BluetoothPrinterService from '@/services/BluetoothPrinterService';
import { SalesInvoice } from '@/types/billing';

interface PrinterInfo {
  id: string;
  name: string;
  mac?: string;
  deviceId?: string;
  lastConnected?: Date;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  isDefault?: boolean;
}

export const useBluetoothPrinter = () => {
  const [currentPrinter, setCurrentPrinter] = useState<PrinterInfo | null>(null);
  const [savedPrinters, setSavedPrinters] = useState<PrinterInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Check if Bluetooth is supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = !!(navigator as any).bluetooth;
      setIsSupported(supported);
      
      if (!supported) {
        console.warn('Web Bluetooth API not supported in this browser');
      }
    };
    
    checkSupport();
  }, []);

  // Initialize and set up listeners
  useEffect(() => {
    // Get initial printer status
    const printer = BluetoothPrinterService.getCurrentPrinter();
    setCurrentPrinter(printer);

    // Load saved printers
    loadSavedPrinters();

    // Set up connection listener
    const handleConnectionChange = (status: PrinterInfo) => {
      setCurrentPrinter(status.status === 'disconnected' ? null : status);
      
      // Connection status changes handled silently
    };

    BluetoothPrinterService.addConnectionListener(handleConnectionChange);

    // Auto-reconnect on mount
    if (!printer) {
      BluetoothPrinterService.autoReconnect().then(success => {
        if (success) {
          const connectedPrinter = BluetoothPrinterService.getCurrentPrinter();
          if (connectedPrinter) {
            setCurrentPrinter(connectedPrinter);
            // Auto-reconnection successful
          }
        }
      });
    }

    return () => {
      BluetoothPrinterService.removeConnectionListener(handleConnectionChange);
    };
  }, [toast, t]);

  // Load saved printers
  const loadSavedPrinters = useCallback(async () => {
    try {
      const printers = await BluetoothPrinterService.getSavedPrinters();
      setSavedPrinters(printers);
    } catch (error) {
      console.error('Failed to load saved printers:', error);
    }
  }, []);

  // Connect to a new printer
  const connectPrinter = useCallback(async (makeDefault = true): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: t('browserNotSupported'),
        description: t('bluetoothRequiresModernBrowser'),
        variant: 'destructive',
      });
      return false;
    }

    if (isConnecting) return false;

    try {
      setIsConnecting(true);
      const success = await BluetoothPrinterService.connectPrinter(makeDefault);
      
      if (success) {
        const printer = BluetoothPrinterService.getCurrentPrinter();
        setCurrentPrinter(printer);
        await loadSavedPrinters();
        
        // Printer connected successfully
      }
      
      return success;
    } catch (error: any) {
      console.error('Failed to connect printer:', error);
      
      if (error.message.includes('User cancelled')) {
        toast({
          title: t('connectionCancelled'),
          description: t('printerSelectionCancelled'),
        });
      } else {
        toast({
          title: t('connectionFailed'),
          description: error.message || t('failedToConnectPrinter'),
          variant: 'destructive',
        });
      }
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isSupported, isConnecting, toast, t, loadSavedPrinters]);

  // Reconnect to a saved printer
  const reconnectPrinter = useCallback(async (printerId: string): Promise<boolean> => {
    if (isConnecting) return false;

    try {
      setIsConnecting(true);
      
      // Find the printer in saved list
      const printer = savedPrinters.find(p => p.id === printerId);
      if (!printer) {
        throw new Error('Printer not found in saved list');
      }

      // Try to reconnect
      const success = await BluetoothPrinterService.autoReconnect();
      
      if (success) {
        const connectedPrinter = BluetoothPrinterService.getCurrentPrinter();
        setCurrentPrinter(connectedPrinter);
        
        toast({
          title: t('printerReconnected'),
          description: `${t('reconnectedTo')} ${printer.name}`,
        });
      }
      
      return success;
    } catch (error: any) {
      console.error('Failed to reconnect printer:', error);
      
      toast({
        title: t('reconnectionFailed'),
        description: error.message || t('failedToReconnectPrinter'),
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, savedPrinters, toast, t]);

  // Disconnect printer
  const disconnectPrinter = useCallback(() => {
    BluetoothPrinterService.disconnect();
    setCurrentPrinter(null);
    
    // Printer disconnected
  }, [toast, t]);

  // Forget printer
  const forgetPrinter = useCallback(async () => {
    await BluetoothPrinterService.forgetPrinter();
    setCurrentPrinter(null);
    await loadSavedPrinters();
    
    toast({
      title: t('printerForgotten'),
      description: t('printerRemovedFromSavedDevices'),
    });
  }, [toast, t, loadSavedPrinters]);

  // Forget all printers
  const forgetAllPrinters = useCallback(async () => {
    await BluetoothPrinterService.forgetAllPrinters();
    setCurrentPrinter(null);
    setSavedPrinters([]);
    
    toast({
      title: t('allPrintersForgotten'),
      description: t('allPrintersRemovedFromSavedDevices'),
    });
  }, [toast, t]);

  // Set default printer
  const setDefaultPrinter = useCallback(async (printerId: string) => {
    await BluetoothPrinterService.setDefaultPrinter(printerId);
    await loadSavedPrinters();
    
    toast({
      title: t('defaultPrinterSet'),
      description: t('defaultPrinterUpdated'),
    });
  }, [toast, t, loadSavedPrinters]);

  // Print invoice
  const printInvoice = useCallback(async (
    invoice: SalesInvoice,
    partyName?: string,
    partyPhone?: string,
    partyAddress?: string
  ): Promise<boolean> => {
    if (!isSupported) {
      // Fallback to browser print
      window.print();
      return true;
    }

    if (isPrinting) return false;

    try {
      setIsPrinting(true);
      
      const success = await BluetoothPrinterService.printReceipt(
        invoice,
        partyName,
        partyPhone,
        partyAddress
      );
      
      if (success) {
        toast({
          title: t('printCompleted'),
          description: t('invoicePrintedSuccessfully'),
        });
        
        // Reload saved printers to update last used
        await loadSavedPrinters();
      }
      
      return success;
    } catch (error: any) {
      console.error('Print error:', error);
      
      if (error.message.includes('User cancelled')) {
        toast({
          title: t('printCancelled'),
          description: t('printerSelectionCancelled'),
        });
      } else {
        toast({
          title: t('printFailed'),
          description: error.message || t('failedToPrint'),
          variant: 'destructive',
        });
      }
      
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [isSupported, isPrinting, toast, t, loadSavedPrinters]);

  return {
    // State
    currentPrinter,
    savedPrinters,
    isConnecting,
    isPrinting,
    isSupported,
    isConnected: currentPrinter?.status === 'connected',
    
    // Actions
    connectPrinter,
    reconnectPrinter,
    disconnectPrinter,
    forgetPrinter,
    forgetAllPrinters,
    setDefaultPrinter,
    printInvoice,
    loadSavedPrinters,
  };
};

