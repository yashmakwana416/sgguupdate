import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BluetoothDevice {
  id?: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothContextType {
  // State
  bluetoothStatus: 'disconnected' | 'connecting' | 'connected';
  connectedDevice: BluetoothDevice | null;
  isScanning: boolean;
  bluetoothSupported: boolean | null;
  bluetoothEnabled: boolean | null;

  // Actions
  scanForDevices: () => Promise<void>;
  connectToDevice: (device: BluetoothDevice) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  reconnectToLastDevice: () => Promise<void>;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

// Storage keys
const BLUETOOTH_DEVICE_KEY = 'bluetooth_connected_device';
const BLUETOOTH_STATUS_KEY = 'bluetooth_connection_status';

export const BluetoothProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // Bluetooth connectivity state
  const [bluetoothStatus, setBluetoothStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState<boolean | null>(null);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean | null>(null);

  // Save device info to localStorage
  const saveDeviceToStorage = (device: BluetoothDevice | null) => {
    if (device) {
      const deviceInfo = {
        id: device.id,
        name: device.name,
        // Note: We can't store the GATT server in localStorage
        // We'll need to reconnect when the app starts
      };
      localStorage.setItem(BLUETOOTH_DEVICE_KEY, JSON.stringify(deviceInfo));
    } else {
      localStorage.removeItem(BLUETOOTH_DEVICE_KEY);
    }
  };

  // Save connection status to localStorage
  const saveStatusToStorage = (status: 'disconnected' | 'connecting' | 'connected') => {
    localStorage.setItem(BLUETOOTH_STATUS_KEY, status);
  };

  // Load device info from localStorage
  const loadDeviceFromStorage = (): { id?: string; name?: string } | null => {
    try {
      const stored = localStorage.getItem(BLUETOOTH_DEVICE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading Bluetooth device from storage:', error);
      return null;
    }
  };

  // Load status from localStorage
  const loadStatusFromStorage = (): 'disconnected' | 'connecting' | 'connected' => {
    try {
      const stored = localStorage.getItem(BLUETOOTH_STATUS_KEY);
      return (stored as 'disconnected' | 'connecting' | 'connected') || 'disconnected';
    } catch (error) {
      return 'disconnected';
    }
  };

  // Check Bluetooth support
  const checkBluetoothSupport = () => {
    if ('bluetooth' in navigator) {
      setBluetoothSupported(true);
    } else {
      setBluetoothSupported(false);
      setBluetoothEnabled(false);
    }
  };

  // Auto-reconnect to the last connected device
  const reconnectToLastDevice = async () => {
    if (!bluetoothSupported) return;

    try {
      // First try to get previously connected devices
      const devices = await navigator.bluetooth.getDevices();
      if (devices.length > 0) {
        const device = devices[0];
        setBluetoothStatus('connecting');

        try {
          // Try to connect to the GATT server
          const server = await device.gatt?.connect();

          if (server) {
            setConnectedDevice(device);
            setBluetoothStatus('connected');
            setBluetoothEnabled(true);
            saveDeviceToStorage(device);
            saveStatusToStorage('connected');

            // Set up disconnection listener
            device.addEventListener('gattserverdisconnected', async () => {
              console.log('Device disconnected, attempting reconnection...');
              setBluetoothStatus('disconnected');
              setConnectedDevice(null);
              saveStatusToStorage('disconnected');

              // Attempt to reconnect after a short delay
              setTimeout(async () => {
                try {
                  await reconnectToLastDevice();
                } catch (reconnectError) {
                  console.log('Auto-reconnection failed, device may be out of range');
                }
              }, 2000);
            });

            toast({
              title: "Device Reconnected",
              description: `Reconnected to ${device.name || 'Unknown Device'}`,
            });

            return;
          }
        } catch (error) {
          console.log('Failed to reconnect to GATT server, device may be out of range');
        }
      }

      // If we can't reconnect, try to find and connect to the stored device
      const storedDeviceInfo = loadDeviceFromStorage();
      if (storedDeviceInfo && storedDeviceInfo.id) {
        console.log('Attempting to find and reconnect to stored device...');

        try {
          const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
              '000018f0-0000-1000-8000-00805f9b34fb', // Printer service
              '00001810-0000-1000-8000-00805f9b34fb', // Blood Pressure
              '00001820-0000-1000-8000-00805f9b34fb', // Internet Protocol Support
              '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
              '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
            ]
          });

          if (device) {
            await connectToDevice(device);
          }
        } catch (error) {
          console.log('Could not find stored device, it may be out of range or turned off');
        }
      }

    } catch (error) {
      console.log('No previously connected devices found or reconnection failed');
      setBluetoothStatus('disconnected');
      saveStatusToStorage('disconnected');
    }
  };

  // Scan for devices
  const scanForDevices = async () => {
    if (!bluetoothSupported) {
      toast({
        title: "Bluetooth Not Supported",
        description: "Your browser doesn't support Bluetooth. Please use Chrome, Edge, or Opera.",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Printer service
          '00001810-0000-1000-8000-00805f9b34fb', // Blood Pressure
          '00001820-0000-1000-8000-00805f9b34fb', // Internet Protocol Support
          '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
          '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
        ]
      });

      if (device) {
        setBluetoothEnabled(true);
        await connectToDevice(device);
      }
    } catch (error: any) {
      console.error('Error scanning for devices:', error);

      if (error.name === 'NotFoundError') {
        setBluetoothEnabled(null);
        toast({
          title: "No Device Selected",
          description: "No Bluetooth device was selected.",
          variant: "destructive"
        });
      } else if (error.name === 'NotAllowedError') {
        setBluetoothEnabled(false);
        toast({
          title: "Bluetooth Permission Denied",
          description: "Please allow Bluetooth access to scan for devices.",
          variant: "destructive"
        });
      } else {
        setBluetoothEnabled(false);
        toast({
          title: "Scanning Failed",
          description: "Failed to scan for Bluetooth devices. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Connect to device
  const connectToDevice = async (device: BluetoothDevice) => {
    setBluetoothStatus('connecting');

    try {
      const server = await device.gatt?.connect();

      if (server) {
        setConnectedDevice(device);
        setBluetoothStatus('connected');
        setBluetoothEnabled(true);
        saveDeviceToStorage(device);
        saveStatusToStorage('connected');

        toast({
          title: "Device Connected",
          description: `Successfully connected to ${device.name || 'Unknown Device'}`,
        });

        // Set up persistent disconnection listener
        const handleDisconnect = async () => {
          console.log('Device disconnected, attempting persistent reconnection...');
          setBluetoothStatus('disconnected');
          setConnectedDevice(null);
          saveStatusToStorage('disconnected');

          // Attempt to reconnect after a delay
          setTimeout(async () => {
            try {
              await reconnectToLastDevice();
            } catch (reconnectError) {
              console.log('Persistent reconnection failed, device may be out of range or turned off');
              toast({
                title: "Device Disconnected",
                description: `${device.name || 'Device'} has been disconnected. Will attempt to reconnect when available.`,
                variant: "destructive"
              });
            }
          }, 3000); // Longer delay for persistent reconnection
        };

        // Add disconnection listener with type assertion
        if (device.gatt) {
          (device.gatt as any).addEventListener('gattserverdisconnected', handleDisconnect);
        }

      } else {
        throw new Error('Failed to connect to GATT server');
      }

    } catch (error: any) {
      console.error('Error connecting to device:', error);
      setBluetoothStatus('disconnected');

      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${device.name || 'device'}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  // Disconnect device
  const disconnectDevice = async () => {
    if (connectedDevice && connectedDevice.gatt) {
      try {
        await connectedDevice.gatt.disconnect();
        setConnectedDevice(null);
        setBluetoothStatus('disconnected');
        saveDeviceToStorage(null);
        saveStatusToStorage('disconnected');

        toast({
          title: "Device Disconnected",
          description: `${connectedDevice.name || 'Device'} has been disconnected`,
        });
      } catch (error) {
        console.error('Error disconnecting device:', error);
        toast({
          title: "Disconnect Error",
          description: "Failed to disconnect device properly",
          variant: "destructive"
        });
      }
    }
  };

  // Initialize Bluetooth support and attempt auto-reconnection on app startup
  useEffect(() => {
    checkBluetoothSupport();

    // Load saved status
    const savedStatus = loadStatusFromStorage();
    if (savedStatus === 'connected') {
      // Attempt to reconnect to the last device
      setTimeout(() => {
        reconnectToLastDevice();
      }, 1000); // Delay to allow the app to fully load
    }

    // Set up periodic reconnection checks for persistent connections
    const reconnectionInterval = setInterval(async () => {
      if (bluetoothSupported && bluetoothStatus === 'disconnected') {
        const storedDeviceInfo = loadDeviceFromStorage();
        if (storedDeviceInfo) {
          console.log('Periodic reconnection check...');
          try {
            await reconnectToLastDevice();
          } catch (error) {
            // Silent reconnection attempt
          }
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(reconnectionInterval);
    };
  }, [bluetoothSupported]);

  const contextValue: BluetoothContextType = {
    bluetoothStatus,
    connectedDevice,
    isScanning,
    bluetoothSupported,
    bluetoothEnabled,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    reconnectToLastDevice,
  };

  return (
    <BluetoothContext.Provider value={contextValue}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
};
