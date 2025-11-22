// IndexedDB storage for Bluetooth printer persistence
const DB_NAME = 'BluetoothPrinterDB';
const DB_VERSION = 1;
const STORE_NAME = 'printers';

interface StoredPrinter {
  id: string;
  deviceId: string;
  name: string;
  mac?: string;
  lastConnected: string;
  isDefault: boolean;
  connectionMetadata?: any;
}

class BluetoothStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('deviceId', 'deviceId', { unique: true });
          store.createIndex('isDefault', 'isDefault', { unique: false });
        }
      };
    });
  }

  async savePrinter(printer: StoredPrinter): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // If this is the default printer, unset other defaults
      if (printer.isDefault) {
        const allRequest = store.getAll();
        allRequest.onsuccess = () => {
          const printers = allRequest.result;
          printers.forEach(p => {
            if (p.id !== printer.id && p.isDefault) {
              p.isDefault = false;
              store.put(p);
            }
          });
        };
      }
      
      const request = store.put(printer);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPrinter(deviceId: string): Promise<StoredPrinter | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('deviceId');
      const request = index.get(deviceId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getDefaultPrinter(): Promise<StoredPrinter | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('isDefault');
      const request = index.get(IDBKeyRange.only(true));
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPrinters(): Promise<StoredPrinter[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePrinter(deviceId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('deviceId');
      const getRequest = index.getKey(deviceId);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const deleteRequest = store.delete(getRequest.result);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteAllPrinters(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const bluetoothStorage = new BluetoothStorage();
