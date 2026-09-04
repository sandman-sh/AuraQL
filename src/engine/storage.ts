/**
 * AuraQL Browser-Native IndexedDB Persistence Engine
 * 
 * Automatically persists user-imported datasets, custom schemas, and query history
 * entirely inside the user's browser storage without requiring external servers.
 */

const DB_NAME = 'auraql_storage';
const DB_VERSION = 1;

export interface StoredTable {
  name: string;
  rows: Record<string, any>[];
  rowCount: number;
  columns: string[];
  updatedAt: number;
}

export interface StoredQuery {
  id?: number;
  sql: string;
  rowCount: number;
  durationMs: number;
  timestamp: number;
}

export class AuraStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  public isSupported: boolean = typeof window !== 'undefined' && 'indexedDB' in window;

  private getDB(): Promise<IDBDatabase> {
    if (!this.isSupported) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('tables')) {
            db.createObjectStore('tables', { keyPath: 'name' });
          }
          if (!db.objectStoreNames.contains('query_history')) {
            const historyStore = db.createObjectStore('query_history', { keyPath: 'id', autoIncrement: true });
            historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
          this.dbPromise = null;
          reject((event.target as IDBOpenDBRequest).error);
        };
      });
    }

    return this.dbPromise;
  }

  /**
   * Save a table and its rows to browser IndexedDB
   */
  public async saveTable(name: string, rows: Record<string, any>[]): Promise<boolean> {
    if (!this.isSupported || rows.length === 0) return false;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('tables', 'readwrite');
        const store = tx.objectStore('tables');

        const record: StoredTable = {
          name: name.toLowerCase(),
          rows,
          rowCount: rows.length,
          columns: Object.keys(rows[0] || {}),
          updatedAt: Date.now()
        };

        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[AuraStorage] Failed to save table to IndexedDB', e);
      return false;
    }
  }

  /**
   * Retrieve all user-stored tables from IndexedDB
   */
  public async loadAllTables(): Promise<StoredTable[]> {
    if (!this.isSupported) return [];
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('tables', 'readonly');
        const store = tx.objectStore('tables');
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[AuraStorage] Failed to load tables from IndexedDB', e);
      return [];
    }
  }

  /**
   * Delete a table from IndexedDB
   */
  public async deleteTable(name: string): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('tables', 'readwrite');
        const store = tx.objectStore('tables');
        const req = store.delete(name.toLowerCase());

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[AuraStorage] Failed to delete table from IndexedDB', e);
      return false;
    }
  }

  /**
   * Clear all stored tables from IndexedDB
   */
  public async clearAll(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('tables', 'readwrite');
        const store = tx.objectStore('tables');
        const req = store.clear();

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[AuraStorage] Failed to clear tables from IndexedDB', e);
      return false;
    }
  }

  /**
   * Record executed SQL query to local query history
   */
  public async logQuery(sql: string, rowCount: number, durationMs: number): Promise<void> {
    if (!this.isSupported || !sql.trim()) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction('query_history', 'readwrite');
      const store = tx.objectStore('query_history');
      const record: StoredQuery = {
        sql: sql.trim(),
        rowCount,
        durationMs,
        timestamp: Date.now()
      };
      store.add(record);
    } catch (e) {
      // Non-critical logging failure
    }
  }

  /**
   * Retrieve query history items
   */
  public async getQueryHistory(limit: number = 25): Promise<StoredQuery[]> {
    if (!this.isSupported) return [];
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('query_history', 'readonly');
        const store = tx.objectStore('query_history');
        const req = store.getAll();

        req.onsuccess = () => {
          const items: StoredQuery[] = req.result || [];
          items.sort((a, b) => b.timestamp - a.timestamp);
          resolve(items.slice(0, limit));
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return [];
    }
  }
}

export const auraStorage = new AuraStorageService();
