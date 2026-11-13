import { openDB, type IDBPDatabase } from 'idb';

/**
 * Offline-capable IndexedDB storage for the POS:
 *  - products cache (for offline product lookup / barcode scan)
 *  - sales queue (orders created offline, to be pushed when back online)
 */
const DB_NAME = 'retailos-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          const store = db.createObjectStore('products', { keyPath: 'id' });
          store.createIndex('sku', 'sku');
          store.createIndex('barcode', 'barcode');
        }
        if (!db.objectStoreNames.contains('sales-queue')) {
          db.createObjectStore('sales-queue', { keyPath: 'syncId' });
        }
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      },
    });
  }
  return dbPromise;
}

export const offlineDb = {
  async cacheProducts(products: Array<{ id: string; sku: string; barcode: string | null }>) {
    const db = await getDB();
    const tx = db.transaction('products', 'readwrite');
    await Promise.all(products.map((p) => tx.store.put(p)));
    await tx.done;
  },

  async findProductByBarcode(code: string) {
    const db = await getDB();
    return db.getFromIndex('products', 'barcode', code);
  },

  async enqueueSale(sale: { syncId: string; payload: Record<string, unknown>; createdAt: string }) {
    const db = await getDB();
    await db.put('sales-queue', sale);
  },

  async listQueuedSales() {
    const db = await getDB();
    return db.getAll('sales-queue');
  },

  async removeQueuedSale(syncId: string) {
    const db = await getDB();
    await db.delete('sales-queue', syncId);
  },

  async kvGet<T>(key: string): Promise<T | undefined> {
    const db = await getDB();
    return (await db.get('kv', key)) as T | undefined;
  },

  async kvSet(key: string, value: unknown) {
    const db = await getDB();
    await db.put('kv', value, key);
  },
};
