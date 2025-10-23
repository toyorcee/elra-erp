/**
 * IndexedDB Service for caching assets like logos
 * Provides a simple interface for storing and retrieving cached assets
 */

class IndexedDBService {
  constructor() {
    this.dbName = "ELRA_Cache";
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize IndexedDB connection
   */
  async init() {
    if (this.isInitialized) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("❌ [IndexedDB] Failed to open database:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log("✅ [IndexedDB] Database initialized successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for cached assets
        if (!db.objectStoreNames.contains("assets")) {
          const assetStore = db.createObjectStore("assets", { keyPath: "key" });
          assetStore.createIndex("type", "type", { unique: false });
          assetStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        console.log("✅ [IndexedDB] Database schema upgraded");
      };
    });
  }

  /**
   * Store an asset in IndexedDB
   * @param {string} key - Unique key for the asset
   * @param {Blob} data - Asset data as Blob
   * @param {string} type - Asset type (e.g., 'logo', 'image')
   * @param {number} maxAge - Maximum age in milliseconds (default: 7 days)
   */
  async storeAsset(
    key,
    data,
    type = "asset",
    maxAge = 7 * 24 * 60 * 60 * 1000
  ) {
    try {
      await this.init();

      const transaction = this.db.transaction(["assets"], "readwrite");
      const store = transaction.objectStore("assets");

      const assetData = {
        key,
        data,
        type,
        timestamp: Date.now(),
        maxAge,
      };

      await new Promise((resolve, reject) => {
        const request = store.put(assetData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`✅ [IndexedDB] Stored asset: ${key}`);
      return true;
    } catch (error) {
      console.error("❌ [IndexedDB] Error storing asset:", error);
      return false;
    }
  }

  /**
   * Retrieve an asset from IndexedDB
   * @param {string} key - Unique key for the asset
   * @returns {Promise<Blob|null>} - Asset data or null if not found/expired
   */
  async getAsset(key) {
    try {
      await this.init();

      const transaction = this.db.transaction(["assets"], "readonly");
      const store = transaction.objectStore("assets");

      return new Promise((resolve, reject) => {
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;

          if (!result) {
            console.log(`📭 [IndexedDB] Asset not found: ${key}`);
            resolve(null);
            return;
          }

          // Check if asset has expired
          const now = Date.now();
          const age = now - result.timestamp;

          if (age > result.maxAge) {
            console.log(
              `⏰ [IndexedDB] Asset expired: ${key} (age: ${Math.round(
                age / 1000 / 60
              )} minutes)`
            );
            // Delete expired asset
            this.deleteAsset(key);
            resolve(null);
            return;
          }

          console.log(`✅ [IndexedDB] Retrieved asset: ${key}`);
          resolve(result.data);
        };

        request.onerror = () => {
          console.error(
            "❌ [IndexedDB] Error retrieving asset:",
            request.error
          );
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("❌ [IndexedDB] Error getting asset:", error);
      return null;
    }
  }

  /**
   * Delete an asset from IndexedDB
   * @param {string} key - Unique key for the asset
   */
  async deleteAsset(key) {
    try {
      await this.init();

      const transaction = this.db.transaction(["assets"], "readwrite");
      const store = transaction.objectStore("assets");

      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`🗑️ [IndexedDB] Deleted asset: ${key}`);
      return true;
    } catch (error) {
      console.error("❌ [IndexedDB] Error deleting asset:", error);
      return false;
    }
  }

  /**
   * Clear all assets from IndexedDB
   */
  async clearAllAssets() {
    try {
      await this.init();

      const transaction = this.db.transaction(["assets"], "readwrite");
      const store = transaction.objectStore("assets");

      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log("🧹 [IndexedDB] Cleared all assets");
      return true;
    } catch (error) {
      console.error("❌ [IndexedDB] Error clearing assets:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      await this.init();

      const transaction = this.db.transaction(["assets"], "readonly");
      const store = transaction.objectStore("assets");

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const assets = request.result;
          const stats = {
            totalAssets: assets.length,
            totalSize: 0,
            byType: {},
          };

          assets.forEach((asset) => {
            stats.totalSize += asset.data.size || 0;
            stats.byType[asset.type] = (stats.byType[asset.type] || 0) + 1;
          });

          resolve(stats);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("❌ [IndexedDB] Error getting cache stats:", error);
      return null;
    }
  }

  /**
   * Clean up expired assets
   */
  async cleanupExpiredAssets() {
    try {
      await this.init();

      const transaction = this.db.transaction(["assets"], "readonly");
      const store = transaction.objectStore("assets");

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = async () => {
          const assets = request.result;
          const now = Date.now();
          let cleanedCount = 0;

          for (const asset of assets) {
            const age = now - asset.timestamp;
            if (age > asset.maxAge) {
              await this.deleteAsset(asset.key);
              cleanedCount++;
            }
          }

          console.log(
            `🧹 [IndexedDB] Cleaned up ${cleanedCount} expired assets`
          );
          resolve(cleanedCount);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("❌ [IndexedDB] Error cleaning up assets:", error);
      return 0;
    }
  }
}

// Create singleton instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;
