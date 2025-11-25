import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bluetooth,
  CheckCircle2,
  XCircle,
  Loader2,
  Printer,
  WifiOff,
  Wifi,
  Star,
  Trash2,
  RefreshCw,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const BluetoothDevicesSettings = () => {
  const { t } = useTranslation();
  const {
    currentPrinter,
    savedPrinters,
    isConnecting,
    isSupported,
    isConnected,
    connectPrinter,
    reconnectPrinter,
    disconnectPrinter,
    forgetPrinter,
    forgetAllPrinters,
    setDefaultPrinter,
    loadSavedPrinters,
  } = useBluetoothPrinter();

  const [showForgetDialog, setShowForgetDialog] = useState(false);
  const [showForgetAllDialog, setShowForgetAllDialog] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);

  const handleConnect = async () => {
    await connectPrinter(true);
  };

  const handleReconnect = async (printerId: string) => {
    await reconnectPrinter(printerId);
  };

  const handleSetDefault = async (printerId: string) => {
    await setDefaultPrinter(printerId);
  };

  const handleForget = async () => {
    await forgetPrinter();
    setShowForgetDialog(false);
  };

  const handleForgetAll = async () => {
    await forgetAllPrinters();
    setShowForgetAllDialog(false);
  };

  const handleRefresh = async () => {
    await loadSavedPrinters();
  };

  if (!isSupported) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            {t('bluetoothDevices')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('browserNotSupported')}. {t('bluetoothRequiresModernBrowser')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            {t('bluetoothDevices')}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {t('managePrinterConnections')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Connection Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground">
              {t('currentConnection')}
            </h3>

            <div className="flex items-start gap-3 p-4 bg-accent/20 rounded-lg border border-border">
              {isConnected && currentPrinter ? (
                <>
                  <div className="relative">
                    <Printer className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="absolute -bottom-1 -right-1">
                      <Wifi className="h-3 w-3 text-green-500" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-card-foreground">
                        {currentPrinter.name}
                      </p>
                      <Badge variant="default" className="bg-green-500">
                        {t('connected')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('autoReconnectEnabled')}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={disconnectPrinter}
                      >
                        {t('disconnect')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowForgetDialog(true)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('forget')}
                      </Button>
                    </div>
                  </div>
                </>
              ) : isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 text-primary mt-0.5 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {t('connecting')}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('pleaseWait')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">
                      {t('noPrinterConnected')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('connectNewPrinterOrSelectSaved')}
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={handleConnect}
                      disabled={isConnecting}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t('connectNewPrinter')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Saved Printers section hidden as per request
          {savedPrinters.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-card-foreground">
                  {t('savedPrinters')}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {savedPrinters.map((printer) => (
                  <div
                    key={printer.id}
                    className="flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Printer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-card-foreground">
                            {printer.name}
                          </p>
                          {printer.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-2 w-2 mr-1" />
                              {t('default')}
                            </Badge>
                          )}
                        </div>
                        {printer.lastConnected && (
                          <p className="text-xs text-muted-foreground">
                            {t('lastUsed')}: {format(printer.lastConnected, 'MMM dd, HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {printer.status === 'connected' ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('activePrinter')}
                        </Badge>
                      ) : (
                        <>
                          {!printer.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSetDefault(printer.id)}
                            >
                              <Star className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReconnect(printer.id)}
                            disabled={isConnecting}
                          >
                            {t('connect')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {savedPrinters.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowForgetAllDialog(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t('forgetAllPrinters')}
                </Button>
              )}
            </div>
          )}
          */}

          {/* Help Text */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('bluetoothPrinterHelp')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Forget Printer Dialog */}
      <AlertDialog open={showForgetDialog} onOpenChange={setShowForgetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('forgetPrinter')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('forgetPrinterConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleForget}>
              {t('forget')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forget All Printers Dialog */}
      <AlertDialog open={showForgetAllDialog} onOpenChange={setShowForgetAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('forgetAllPrinters')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('forgetAllPrintersConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleForgetAll}>
              {t('forgetAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
