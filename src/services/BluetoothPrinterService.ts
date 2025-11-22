import { supabase } from '@/integrations/supabase/client';
import { SalesInvoice } from '@/types/billing';
import { generateThermalReceipt } from '@/utils/thermalReceiptGenerator';
import { hasGujarati, ensureGujaratiFont, buildReceiptImageBytes } from '@/utils/gujarati';
import { bluetoothStorage } from '@/utils/bluetoothStorage';

interface PrinterInfo {
  id: string;
  name: string;
  mac?: string;
  deviceId?: string;
  lastConnected?: Date;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  isDefault?: boolean;
}

interface StoredPrinterData {
  deviceId: string;
  name: string;
  mac?: string;
  encryptedKey?: string;
  lastConnected: string;
  isDefault?: boolean;
}

class BluetoothPrinterService {
  private static instance: BluetoothPrinterService;
  private connectedDevice: BluetoothDevice | null = null;
  private printerCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionListeners: Set<(status: PrinterInfo) => void> = new Set();
  private isReconnecting = false;
  private userId: string | null = null;

  private readonly SERVICE_COMBINATIONS = [
    { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
    { service: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', char: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f' },
    { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
    { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff02-0000-1000-8000-00805f9b34fb' },
    { service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', char: '6e400002-b5a3-f393-e0a9-e50e24dcca9e' },
  ];

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  private async initializeService() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
      this.autoReconnect(true);
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.userId = session.user.id;
        if (event === 'SIGNED_IN') {
          this.autoReconnect(true);
        }
      } else {
        this.userId = null;
        this.disconnect();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isConnected()) {
        this.autoReconnect(true);
      }
    });

    window.addEventListener('focus', () => {
      if (!this.isConnected()) {
        this.autoReconnect(true);
      }
    });
    
    setInterval(() => {
      if (!this.isConnected() && !this.isReconnecting) {
        this.autoReconnect(true);
      }
    }, 10000);
  }

  private encrypt(text: string): string {
    const key = 'BluetoothPrinterKey2024';
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  private async savePrinterInfo(device: BluetoothDevice, isDefault = false): Promise<void> {
    const printerData: StoredPrinterData = {
      deviceId: device.id,
      name: device.name || 'Unknown Printer',
      mac: device.id,
      encryptedKey: this.encrypt(device.id),
      lastConnected: new Date().toISOString(),
      isDefault
    };

    localStorage.setItem('bluetooth_printer_data', JSON.stringify(printerData));
    localStorage.setItem('bluetooth_printer_device_id', device.id);
    localStorage.setItem('bluetooth_printer_device_name', device.name || 'Unknown Printer');

    try {
      await bluetoothStorage.savePrinter({
        id: `printer_${device.id}`,
        deviceId: device.id,
        name: device.name || 'Unknown Printer',
        mac: device.id,
        lastConnected: new Date().toISOString(),
        isDefault,
        connectionMetadata: {
          browser: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to save printer to IndexedDB:', error);
    }

    if (this.userId) {
      try {
        await supabase.from('user_printers').upsert({
          user_id: this.userId,
          printer_name: device.name || 'Unknown Printer',
          printer_mac: device.id,
          printer_device_id: device.id,
          last_connected: new Date().toISOString(),
          status: true,
          is_default: isDefault,
          connection_metadata: {
            browser: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }, {
          onConflict: 'user_id,printer_mac'
        });
      } catch (error) {
        console.error('Failed to save printer to Supabase:', error);
      }
    }
  }

  private async loadPrinterInfo(): Promise<StoredPrinterData | null> {
    const localData = localStorage.getItem('bluetooth_printer_data');
    if (localData) {
      try {
        return JSON.parse(localData) as StoredPrinterData;
      } catch {
        localStorage.removeItem('bluetooth_printer_data');
      }
    }

    try {
      const defaultPrinter = await bluetoothStorage.getDefaultPrinter();
      if (defaultPrinter) {
        const printerData: StoredPrinterData = {
          deviceId: defaultPrinter.deviceId,
          name: defaultPrinter.name,
          mac: defaultPrinter.mac,
          lastConnected: defaultPrinter.lastConnected,
          isDefault: defaultPrinter.isDefault
        };
        localStorage.setItem('bluetooth_printer_data', JSON.stringify(printerData));
        return printerData;
      }
    } catch (error) {
      console.error('Failed to load printer from IndexedDB:', error);
    }

    return null;
  }

  private async findPrinterCharacteristic(server: BluetoothRemoteGATTServer): Promise<BluetoothRemoteGATTCharacteristic | null> {
    for (const combo of this.SERVICE_COMBINATIONS) {
      try {
        const service = await server.getPrimaryService(combo.service);
        const characteristic = await service.getCharacteristic(combo.char);
        console.log(`Found working service/characteristic: ${combo.service}`);
        return characteristic;
      } catch {
        continue;
      }
    }
    return null;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(async () => {
      if (this.isConnected() && this.printerCharacteristic) {
        try {
          const nullCommand = new Uint8Array([0x00]);
          await this.printerCharacteristic.writeValue(nullCommand);
        } catch (error) {
          console.log('Heartbeat failed, attempting reconnection');
          this.reconnect();
        }
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public async autoReconnect(silent = true): Promise<boolean> {
    const printerInfo = await this.loadPrinterInfo();
    if (!printerInfo) {
      console.log('No saved printer info found');
      return false;
    }

    if (this.isConnected() && this.connectedDevice?.id === printerInfo.deviceId) {
      console.log('Printer already connected');
      return true;
    }

    try {
      if ((navigator as any).bluetooth?.getDevices) {
        const devices = await (navigator as any).bluetooth.getDevices();
        console.log(`Found ${devices.length} paired devices`);
        
        if (devices.length > 0) {
          const device = devices.find((d: BluetoothDevice) => d.id === printerInfo.deviceId);
          
          if (device && device.gatt) {
            this.notifyListeners({ 
              id: device.id, 
              name: device.name || 'Unknown', 
              status: 'connecting' 
            });

            console.log('Reconnecting to stored printer:', device.name);
            const server = await device.gatt.connect();
            
            const characteristic = await this.findPrinterCharacteristic(server);
            if (characteristic) {
              this.connectedDevice = device;
              this.printerCharacteristic = characteristic;
              
              device.addEventListener('gattserverdisconnected', () => this.handleDisconnection());
              this.startHeartbeat();
              await this.savePrinterInfo(device, printerInfo.isDefault);
              
              this.notifyListeners({ 
                id: device.id, 
                name: device.name || 'Unknown', 
                status: 'connected' 
              });
              
              console.log('Successfully reconnected to printer');
              return true;
            }
          }
        }
      }
    } catch (error) {
      console.log('Failed to auto-reconnect:', error);
    }
    
    return false;
  }

  private async reconnect(): Promise<void> {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    
    try {
      if (this.connectedDevice && this.connectedDevice.gatt) {
        this.notifyListeners({ 
          id: this.connectedDevice.id, 
          name: this.connectedDevice.name || 'Unknown', 
          status: 'connecting' 
        });

        const server = await this.connectedDevice.gatt.connect();
        const characteristic = await this.findPrinterCharacteristic(server);
        
        if (characteristic) {
          this.printerCharacteristic = characteristic;
          this.startHeartbeat();
          
          this.notifyListeners({ 
            id: this.connectedDevice.id, 
            name: this.connectedDevice.name || 'Unknown', 
            status: 'connected' 
          });
          
          console.log('Reconnected successfully');
        }
      } else {
        await this.autoReconnect();
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.handleDisconnection();
    } finally {
      this.isReconnecting = false;
    }
  }

  private handleDisconnection(): void {
    this.printerCharacteristic = null;
    
    this.notifyListeners({ 
      id: this.connectedDevice?.id || '', 
      name: this.connectedDevice?.name || '', 
      status: 'disconnected' 
    });
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    let attempts = 0;
    const maxAttempts = 3;
    
    const attemptReconnect = () => {
      if (attempts >= maxAttempts) {
        console.log('Max reconnection attempts reached');
        return;
      }
      
      attempts++;
      const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
      
      this.reconnectTimer = setTimeout(() => {
        if (!this.isConnected()) {
          this.reconnect().then(() => {
            if (!this.isConnected() && attempts < maxAttempts) {
              attemptReconnect();
            }
          });
        }
      }, delay);
    };
    
    attemptReconnect();
  }

  public async connectToDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      console.log('Connecting to device:', device.name);
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to printer GATT server');
      }

      console.log('Connected to GATT server');
      const characteristic = await this.findPrinterCharacteristic(server);
      if (!characteristic) {
        throw new Error('Could not find compatible printer service');
      }

      this.connectedDevice = device;
      this.printerCharacteristic = characteristic;
      await this.savePrinterInfo(device, true);
      device.addEventListener('gattserverdisconnected', () => this.handleDisconnection());
      this.startHeartbeat();
      
      this.notifyListeners({ 
        id: device.id, 
        name: device.name || 'Unknown', 
        status: 'connected' 
      });
      
      console.log('Device connected successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect device:', error);
      this.notifyListeners({ 
        id: device.id, 
        name: device.name || 'Unknown', 
        status: 'error' 
      });
      return false;
    }
  }

  public async connectPrinter(markAsDefault = false): Promise<boolean> {
    try {
      console.log('Requesting Bluetooth printer...');
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: this.SERVICE_COMBINATIONS.map(c => c.service)
      });

      console.log('Bluetooth device selected:', device.name);
      const connected = await this.connectToDevice(device);
      if (connected && markAsDefault) {
        await this.savePrinterInfo(device, markAsDefault);
      }
      
      return connected;
    } catch (error) {
      console.error('Failed to connect printer:', error);
      this.notifyListeners({ 
        id: '', 
        name: '', 
        status: 'error' 
      });
      throw error;
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.connectedDevice?.gatt?.connected) {
      this.connectedDevice.gatt.disconnect();
    }
    
    this.connectedDevice = null;
    this.printerCharacteristic = null;
    
    this.notifyListeners({ 
      id: '', 
      name: '', 
      status: 'disconnected' 
    });
  }

  public async forgetPrinter(): Promise<void> {
    const deviceId = this.connectedDevice?.id;
    this.disconnect();
    
    localStorage.removeItem('bluetooth_printer_data');
    localStorage.removeItem('bluetooth_printer_device_id');
    localStorage.removeItem('bluetooth_printer_device_name');
    localStorage.removeItem('thermal_printer_device_id');
    localStorage.removeItem('thermal_printer_device_name');
    
    if (deviceId) {
      try {
        await bluetoothStorage.deletePrinter(deviceId);
      } catch (error) {
        console.error('Failed to remove printer from IndexedDB:', error);
      }
    }
    
    if (this.userId && deviceId) {
      try {
        await supabase
          .from('user_printers')
          .delete()
          .eq('user_id', this.userId)
          .eq('printer_mac', deviceId);
      } catch (error) {
        console.error('Failed to remove printer from Supabase:', error);
      }
    }
  }

  public async forgetAllPrinters(): Promise<void> {
    this.disconnect();
    
    const keysToRemove = [
      'bluetooth_printer_data',
      'bluetooth_printer_device_id', 
      'bluetooth_printer_device_name',
      'thermal_printer_device_id',
      'thermal_printer_device_name'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    try {
      await bluetoothStorage.deleteAllPrinters();
    } catch (error) {
      console.error('Failed to clear printers from IndexedDB:', error);
    }
    
    if (this.userId) {
      try {
        await supabase
          .from('user_printers')
          .delete()
          .eq('user_id', this.userId);
      } catch (error) {
        console.error('Failed to remove all printers from Supabase:', error);
      }
    }
  }

  public async printReceipt(
    invoice: SalesInvoice, 
    partyName?: string, 
    partyPhone?: string, 
    partyAddress?: string
  ): Promise<boolean> {
    try {
      const printerInfo = await this.loadPrinterInfo();
      
      if (!this.isConnected()) {
        console.log('Printer not connected, attempting to reconnect...');
        
        if (printerInfo) {
          const reconnected = await this.autoReconnect(true);
          
          if (!reconnected) {
            console.log('Silent reconnection failed, requesting device with filters...');
            
            try {
              const requestOptions: any = {
                optionalServices: this.SERVICE_COMBINATIONS.map(c => c.service)
              };
              
              if (printerInfo.name && printerInfo.name !== 'Unknown Printer') {
                if (printerInfo.name.includes('DP58H')) {
                  requestOptions.filters = [{ name: printerInfo.name }];
                } else {
                  requestOptions.filters = [{ namePrefix: printerInfo.name.substring(0, 3) }];
                }
                requestOptions.acceptAllDevices = false;
              } else {
                requestOptions.acceptAllDevices = true;
              }
              
              console.log('Requesting Bluetooth device with options:', requestOptions);
              const device = await (navigator as any).bluetooth.requestDevice(requestOptions);
              
              if (device) {
                console.log('Device selected:', device.name);
                const connected = await this.connectToDevice(device);
                if (!connected) {
                  throw new Error('Failed to connect to selected device');
                }
              }
            } catch (error) {
              console.error('Failed to request device:', error);
              throw new Error('Failed to connect to printer. Please try again.');
            }
          }
        } else {
          console.log('No saved printer, requesting new device...');
          await this.connectPrinter(true);
        }
      }

      if (!this.printerCharacteristic) {
        throw new Error('Printer not connected');
      }

      const receiptText = generateThermalReceipt(invoice, partyName, partyPhone, partyAddress);
      
      // ESC/POS initialization commands
      const ESC = 0x1B;
      const GS = 0x1D;

      // Rapid initialization - combine commands for faster setup
      const initCommand = new Uint8Array([ESC, 0x40]); // ESC @ - Initialize printer
      await this.printerCharacteristic.writeValue(initCommand);
      await new Promise(resolve => setTimeout(resolve, 20)); // Reduced delay

      // High-speed printing setup - combine all commands for maximum efficiency
      // Minimal setup for raster image printing
      const setupCommands = new Uint8Array([
        ESC, 0x61, 0x00, // ESC a 0 - Left alignment (image is centered by canvas)
        ESC, 0x32,        // ESC 2 - Default line spacing
      ]);
      await this.printerCharacteristic.writeValue(setupCommands);
      await new Promise(resolve => setTimeout(resolve, 10)); // Short delay

      const lines = receiptText.split('\n');

      // Always render as raster image to ensure proper shaping, encoding, and font size
      await ensureGujaratiFont();

      // Use uniform larger font size for all content (24px for perfect readability)
      const bands = await buildReceiptImageBytes(lines, {
        widthPx: 384,
        fontSize: 24,
        lineHeight: 28,
        largeFontSize: 24,
        largeLineHeight: 28,
        largeLines: [], // No special large lines - all content is uniform
      });

      // Safe BLE chunking per band to prevent data corruption across printers
      const mtu = 128;
      // bands is Uint8Array[], iterate through each band
      if (Array.isArray(bands)) {
        for (const band of bands) {
          for (let i = 0; i < band.length; i += mtu) {
            const chunk = band.slice(i, Math.min(i + mtu, band.length));
            await this.printerCharacteristic.writeValue(chunk);
            await new Promise(resolve => setTimeout(resolve, 5));
          }
        }
      } else {
        // Single Uint8Array - chunk it directly
        for (let i = 0; i < bands.length; i += mtu) {
          const chunk = bands.slice(i, Math.min(i + mtu, bands.length));
          await this.printerCharacteristic.writeValue(chunk);
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      // Finish: small feed then reset device to clear buffer (prevents reprint loops)
      const feedCommand = new Uint8Array([ESC, 0x64, 0x03]); // ESC d 3 - Feed 3 lines
      await this.printerCharacteristic.writeValue(feedCommand);
      await new Promise(resolve => setTimeout(resolve, 30));

      const resetCommand = new Uint8Array([ESC, 0x40]); // ESC @ - Reset/Init to end job
      await this.printerCharacteristic.writeValue(resetCommand);

      console.log('Print completed successfully');

      if (this.connectedDevice) {
        await this.savePrinterInfo(this.connectedDevice, true);
      }

      return true;
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }

  private saveConnectionState(): void {
    if (this.connectedDevice) {
      localStorage.setItem('last_connection_time', new Date().toISOString());
    }
  }

  public addConnectionListener(listener: (status: PrinterInfo) => void): void {
    this.connectionListeners.add(listener);
  }

  public removeConnectionListener(listener: (status: PrinterInfo) => void): void {
    this.connectionListeners.delete(listener);
  }

  private notifyListeners(status: PrinterInfo): void {
    this.connectionListeners.forEach(listener => listener(status));
  }

  public async getSavedPrinters(): Promise<PrinterInfo[]> {
    if (!this.userId) return [];

    try {
      const { data } = await supabase
        .from('user_printers')
        .select('*')
        .eq('user_id', this.userId)
        .order('is_default', { ascending: false })
        .order('last_connected', { ascending: false });

      if (data) {
        return data.map(p => ({
          id: p.printer_device_id || p.printer_mac,
          name: p.printer_name,
          mac: p.printer_mac,
          deviceId: p.printer_device_id,
          lastConnected: new Date(p.last_connected),
          status: (this.connectedDevice?.id === p.printer_device_id) ? 'connected' : 'disconnected',
          isDefault: p.is_default
        } as PrinterInfo));
      }
    } catch (error) {
      console.error('Failed to get saved printers:', error);
    }

    return [];
  }

  public async setDefaultPrinter(printerId: string): Promise<void> {
    if (!this.userId) return;

    try {
      await supabase
        .from('user_printers')
        .update({ is_default: false })
        .eq('user_id', this.userId);

      await supabase
        .from('user_printers')
        .update({ is_default: true })
        .eq('user_id', this.userId)
        .eq('printer_device_id', printerId);
    } catch (error) {
      console.error('Failed to set default printer:', error);
    }
  }

  public isConnected(): boolean {
    return !!(this.connectedDevice && this.connectedDevice.gatt?.connected && this.printerCharacteristic);
  }

  public getCurrentPrinter(): PrinterInfo | null {
    if (!this.connectedDevice) return null;
    
    return {
      id: this.connectedDevice.id,
      name: this.connectedDevice.name || 'Unknown',
      status: this.isConnected() ? 'connected' : 'disconnected'
    };
  }
}

const BluetoothPrinterServiceInstance = BluetoothPrinterService.getInstance();
export default BluetoothPrinterServiceInstance;

