import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Printer, WifiOff, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BluetoothPrinterService from '@/services/BluetoothPrinterService';
import { useToast } from '@/hooks/use-toast';

interface SavedPrinterInfo {
  name: string;
  deviceId: string;
  lastConnected: string;
}

export const PrinterReconnectPrompt = () => {
  const [savedPrinter, setSavedPrinter] = useState<SavedPrinterInfo | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    // Check for saved printer on mount
    const checkSavedPrinter = async () => {
      const printerData = localStorage.getItem('bluetooth_printer_data');
      if (printerData) {
        try {
          const parsed = JSON.parse(printerData);
          setSavedPrinter(parsed);
          
          // Check if already connected
          const currentPrinter = BluetoothPrinterService.getCurrentPrinter();
          if (currentPrinter && currentPrinter.status === 'connected') {
            setIsConnected(true);
            setShowPrompt(false);
          } else {
            // Show reconnect prompt if we have a saved printer but not connected and not dismissed
            if (!isDismissed) {
              setShowPrompt(true);
            }
            // Try silent reconnection first
            const reconnected = await BluetoothPrinterService.autoReconnect(true);
            if (reconnected) {
              setIsConnected(true);
              setShowPrompt(false);
              setIsDismissed(false); // Reset dismissed state when reconnected
              // Auto-reconnection successful (silent)
            }
          }
        } catch (error) {
          console.error('Failed to parse saved printer data:', error);
        }
      }
    };

    checkSavedPrinter();

    // Listen for connection changes
    const handleConnectionChange = (status: { id: string; name: string; status: string }) => {
      if (status.status === 'connected') {
        setIsConnected(true);
        setShowPrompt(false);
      } else if (status.status === 'disconnected') {
        setIsConnected(false);
        // Only show prompt if we have saved printer info and user hasn't dismissed it
        if (savedPrinter && !isDismissed) {
          setShowPrompt(true);
        }
      }
    };

    BluetoothPrinterService.addConnectionListener(handleConnectionChange);

    return () => {
      BluetoothPrinterService.removeConnectionListener(handleConnectionChange);
    };
  }, [toast, t, savedPrinter]);

  const handleReconnect = async () => {
    if (!savedPrinter) return;
    
    setIsReconnecting(true);
    try {
      // Try to reconnect with the saved printer name as filter
      interface BluetoothRequestOptions {
        filters?: Array<{ name?: string; namePrefix?: string }>;
        optionalServices?: string[];
      }
      
      const requestOptions: BluetoothRequestOptions = {
        filters: [
          { name: savedPrinter.name }
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        ]
      };

      // For DP58H printers, we can also try name prefix
      if (savedPrinter.name.includes('DP58H')) {
        requestOptions.filters = [
          { namePrefix: 'DP58H' }
        ];
      }

      console.log('Requesting reconnection to:', savedPrinter.name);
      const device = await (navigator as Navigator & { bluetooth: { requestDevice: (options: BluetoothRequestOptions) => Promise<BluetoothDevice> } }).bluetooth.requestDevice(requestOptions);
      
      if (device) {
        // Connect through the service
        const connected = await BluetoothPrinterService.connectToDevice(device);
        if (connected) {
          setIsConnected(true);
          setShowPrompt(false);
          toast({
            title: t('printerConnected'),
            description: `${t('connectedTo')} ${device.name}`,
          });
        }
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      if ((error as Error).message.includes('User cancelled')) {
        toast({
          title: t('connectionCancelled'),
          description: t('printerSelectionCancelled'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('connectionFailed'),
          description: t('failedToConnectPrinter'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsReconnecting(false);
    }
  };

  // Always return null to disable printer disconnection prompts
  return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <WifiOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm">{t('printerDisconnected')}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPrompt(false);
                  setIsDismissed(true);
                }}
                className="h-6 w-6 p-0 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {savedPrinter.name} {t('isNotConnected')}
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={handleReconnect}
              disabled={isReconnecting}
            >
              {isReconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('reconnecting')}...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  {t('reconnectPrinter')}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

