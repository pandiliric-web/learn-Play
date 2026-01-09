// IndexedDB Utility for Offline Data Storage
// Handles quiz results, game progress, and sync status

const DB_NAME = 'LearnPlayDB';
const DB_VERSION = 1;
const STORES = {
  QUIZ_RESULTS: 'quizResults',
  GAME_PROGRESS: 'gameProgress',
  AUTH_TOKEN: 'authToken',
  SYNC_QUEUE: 'syncQueue'
};

class IndexedDBManager {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  // Initialize IndexedDB
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Quiz Results Store
        if (!db.objectStoreNames.contains(STORES.QUIZ_RESULTS)) {
          const quizStore = db.createObjectStore(STORES.QUIZ_RESULTS, {
            keyPath: 'id',
            autoIncrement: true
          });
          quizStore.createIndex('userId', 'userId', { unique: false });
          quizStore.createIndex('quizId', 'quizId', { unique: false });
          quizStore.createIndex('synced', 'synced', { unique: false });
          quizStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Game Progress Store
        if (!db.objectStoreNames.contains(STORES.GAME_PROGRESS)) {
          const gameStore = db.createObjectStore(STORES.GAME_PROGRESS, {
            keyPath: 'id',
            autoIncrement: true
          });
          gameStore.createIndex('userId', 'userId', { unique: false });
          gameStore.createIndex('gameId', 'gameId', { unique: false });
          gameStore.createIndex('synced', 'synced', { unique: false });
        }

        // Auth Token Store
        if (!db.objectStoreNames.contains(STORES.AUTH_TOKEN)) {
          db.createObjectStore(STORES.AUTH_TOKEN, {
            keyPath: 'id'
          });
        }

        // Sync Queue Store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  // Ensure DB is initialized
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // ============================================
  // QUIZ RESULTS OPERATIONS
  // ============================================

  // Save quiz result offline
  async saveQuizResult(quizData) {
    await this.ensureDB();

    const quizResult = {
      userId: quizData.userId,
      quizId: quizData.quizId,
      score: quizData.score,
      totalItems: quizData.totalItems,
      correctAnswers: quizData.correctAnswers || 0,
      timeSpent: quizData.timeSpent || 0,
      difficulty: quizData.difficulty || 'Easy',
      subject: quizData.subject || '',
      answers: quizData.answers || [],
      timestamp: new Date().toISOString(),
      synced: false,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.QUIZ_RESULTS], 'readwrite');
      const store = transaction.objectStore(STORES.QUIZ_RESULTS);
      const request = store.add(quizResult);

      request.onsuccess = () => {
        console.log('Quiz result saved offline:', request.result);
        resolve({ ...quizResult, id: request.result });
      };

      request.onerror = () => {
        console.error('Error saving quiz result:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all unsynced quiz results
  async getUnsyncedQuizResults() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.QUIZ_RESULTS], 'readonly');
      const store = transaction.objectStore(STORES.QUIZ_RESULTS);
      const index = store.index('synced');
      const request = index.openCursor();
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // Filter for unsynced records (synced === false)
          if (cursor.value.synced === false) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get quiz results by user
  async getQuizResultsByUser(userId) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.QUIZ_RESULTS], 'readonly');
      const store = transaction.objectStore(STORES.QUIZ_RESULTS);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Mark quiz result as synced
  async markQuizResultSynced(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.QUIZ_RESULTS], 'readwrite');
      const store = transaction.objectStore(STORES.QUIZ_RESULTS);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          data.syncedAt = new Date().toISOString();
          const updateRequest = store.put(data);

          updateRequest.onsuccess = () => {
            resolve(data);
          };

          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  // Delete synced quiz results (cleanup)
  async deleteSyncedQuizResults() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.QUIZ_RESULTS], 'readwrite');
      const store = transaction.objectStore(STORES.QUIZ_RESULTS);
      const index = store.index('synced');
      const request = index.openCursor(true); // synced = true

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // ============================================
  // AUTH TOKEN OPERATIONS
  // ============================================

  // Save authentication token
  async saveAuthToken(tokenData) {
    await this.ensureDB();

    const token = {
      id: 'auth_token',
      token: tokenData.token,
      userId: tokenData.userId,
      user: tokenData.user,
      expiresAt: tokenData.expiresAt || null,
      createdAt: new Date().toISOString(),
      deviceId: tokenData.deviceId || this.getDeviceId()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.AUTH_TOKEN], 'readwrite');
      const store = transaction.objectStore(STORES.AUTH_TOKEN);
      const request = store.put(token);

      request.onsuccess = () => {
        console.log('Auth token saved');
        resolve(token);
      };

      request.onerror = () => {
        console.error('Error saving auth token:', request.error);
        reject(request.error);
      };
    });
  }

  // Get authentication token
  async getAuthToken() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.AUTH_TOKEN], 'readonly');
      const store = transaction.objectStore(STORES.AUTH_TOKEN);
      const request = store.get('auth_token');

      request.onsuccess = () => {
        const token = request.result;
        
        // Check if token is expired
        if (token && token.expiresAt) {
          const expiresAt = new Date(token.expiresAt);
          if (expiresAt < new Date()) {
            // Token expired, delete it
            this.deleteAuthToken();
            resolve(null);
            return;
          }
        }

        resolve(token);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Delete authentication token
  async deleteAuthToken() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.AUTH_TOKEN], 'readwrite');
      const store = transaction.objectStore(STORES.AUTH_TOKEN);
      const request = store.delete('auth_token');

      request.onsuccess = () => {
        console.log('Auth token deleted');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Check if token is valid
  async isTokenValid() {
    const token = await this.getAuthToken();
    if (!token) return false;

    if (token.expiresAt) {
      return new Date(token.expiresAt) > new Date();
    }

    return true;
  }

  // ============================================
  // GAME PROGRESS OPERATIONS
  // ============================================

  // Save game progress offline
  async saveGameProgress(gameData) {
    await this.ensureDB();

    const progress = {
      userId: gameData.userId,
      gameId: gameData.gameId,
      score: gameData.score || 0,
      level: gameData.level || 1,
      progress: gameData.progress || {},
      timestamp: new Date().toISOString(),
      synced: false,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.GAME_PROGRESS], 'readwrite');
      const store = transaction.objectStore(STORES.GAME_PROGRESS);
      const request = store.add(progress);

      request.onsuccess = () => {
        resolve({ ...progress, id: request.result });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get unsynced game progress
  async getUnsyncedGameProgress() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.GAME_PROGRESS], 'readonly');
      const store = transaction.objectStore(STORES.GAME_PROGRESS);
      const index = store.index('synced');
      const request = index.openCursor();
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // Filter for unsynced records (synced === false)
          if (cursor.value.synced === false) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Mark game progress as synced
  async markGameProgressSynced(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.GAME_PROGRESS], 'readwrite');
      const store = transaction.objectStore(STORES.GAME_PROGRESS);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          data.syncedAt = new Date().toISOString();
          const updateRequest = store.put(data);

          updateRequest.onsuccess = () => resolve(data);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ============================================
  // SYNC QUEUE OPERATIONS
  // ============================================

  // Add item to sync queue
  async addToSyncQueue(item) {
    await this.ensureDB();

    const queueItem = {
      type: item.type, // 'quiz' or 'game'
      data: item.data,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.add(queueItem);

      request.onsuccess = () => {
        resolve({ ...queueItem, id: request.result });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get unsynced queue items
  async getUnsyncedQueueItems() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('synced');
      const request = index.openCursor();
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // Filter for unsynced records (synced === false)
          if (cursor.value.synced === false) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Mark queue item as synced
  async markQueueItemSynced(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          data.syncedAt = new Date().toISOString();
          const updateRequest = store.put(data);

          updateRequest.onsuccess = () => resolve(data);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  // Get or create device ID
  getDeviceId() {
    let deviceId = localStorage.getItem('learnplay-device-id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('learnplay-device-id', deviceId);
    }
    return deviceId;
  }

  // Clear all offline data (for logout)
  async clearAllData() {
    await this.ensureDB();

    const stores = Object.values(STORES);
    const promises = stores.map(storeName => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    return Promise.all(promises);
  }

  // Get storage statistics
  async getStorageStats() {
    await this.ensureDB();

    const stats = {};

    // Count unsynced quiz results
    const unsyncedQuizzes = await this.getUnsyncedQuizResults();
    stats.unsyncedQuizzes = unsyncedQuizzes.length;

    // Count unsynced game progress
    const unsyncedGames = await this.getUnsyncedGameProgress();
    stats.unsyncedGames = unsyncedGames.length;

    // Count unsynced queue items
    const unsyncedQueue = await this.getUnsyncedQueueItems();
    stats.unsyncedQueue = unsyncedQueue.length;

    return stats;
  }
}

// Create singleton instance
const indexedDBManager = new IndexedDBManager();

export default indexedDBManager;

