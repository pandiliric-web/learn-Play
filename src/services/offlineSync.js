// Offline Sync Service
// Handles automatic synchronization of offline data when connection is restored

import indexedDBManager from '../utils/indexedDB';
import { authAPI, progressAPI } from './api';

class OfflineSyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
    this.retryDelay = 5000; // 5 seconds
    this.maxRetries = 3;
  }

  // Initialize sync service
  init() {
    // Listen for online event
    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...');
      this.syncAll();
    });

    // Periodic sync check (every 30 seconds when online)
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000);

    // Initial sync if online
    if (navigator.onLine) {
      setTimeout(() => this.syncAll(), 2000); // Wait 2 seconds after page load
    }
  }

  // Sync all offline data
  async syncAll() {
    if (this.isSyncing) {
      console.log('Sync already in progress...');
      return;
    }

    if (!navigator.onLine) {
      console.log('Offline, cannot sync');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'sync_started' });

    try {
      // Ensure IndexedDB is initialized
      await indexedDBManager.init();

      // Check if we have a valid token
      const token = await indexedDBManager.getAuthToken();
      if (!token) {
        console.log('No auth token found, skipping sync');
        this.isSyncing = false;
        return;
      }

      // Sync quiz results
      const quizResults = await indexedDBManager.getUnsyncedQuizResults();
      console.log(`Found ${quizResults.length} unsynced quiz results`);

      for (const quizResult of quizResults) {
        try {
          await this.syncQuizResult(quizResult);
        } catch (error) {
          console.error('Error syncing quiz result:', error);
          // Continue with next item
        }
      }

      // Sync game progress
      const gameProgress = await indexedDBManager.getUnsyncedGameProgress();
      console.log(`Found ${gameProgress.length} unsynced game progress`);

      for (const progress of gameProgress) {
        try {
          await this.syncGameProgress(progress);
        } catch (error) {
          console.error('Error syncing game progress:', error);
        }
      }

      // Clean up synced data (optional - keep for 7 days)
      await this.cleanupSyncedData();

      this.notifyListeners({ 
        type: 'sync_completed', 
        quizCount: quizResults.length,
        gameCount: gameProgress.length
      });

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error);
      this.notifyListeners({ type: 'sync_error', error: error.message });
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync a single quiz result
  async syncQuizResult(quizResult) {
    try {
      // Prepare payload (exclude IndexedDB-specific fields)
      const payload = {
        userId: quizResult.userId,
        quizId: quizResult.quizId,
        quizScore: quizResult.score, // Map score to quizScore for backend
        totalQuestions: quizResult.totalItems,
        correctAnswers: quizResult.correctAnswers,
        timeSpent: quizResult.timeSpent,
        difficulty: quizResult.difficulty,
        subject: quizResult.subject,
        gameType: 'Quiz',
        answers: quizResult.answers,
        timestamp: quizResult.timestamp
      };

      // Get auth token
      const token = await indexedDBManager.getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      // Make API call
      const response = await fetch('/api/progress/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle duplicate submission
        if (response.status === 409 || errorData.message?.includes('duplicate')) {
          console.log('Duplicate quiz submission, marking as synced');
          await indexedDBManager.markQuizResultSynced(quizResult.id);
          return;
        }

        // Handle authentication error
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed during sync');
          // Token might be expired, clear it
          await indexedDBManager.deleteAuthToken();
          throw new Error('Authentication failed');
        }

        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Mark as synced
      await indexedDBManager.markQuizResultSynced(quizResult.id);

      console.log('Quiz result synced successfully:', quizResult.id);
      return data;
    } catch (error) {
      console.error('Error syncing quiz result:', error);
      throw error;
    }
  }

  // Sync game progress
  async syncGameProgress(progress) {
    try {
      const payload = {
        userId: progress.userId,
        gameId: progress.gameId,
        score: progress.score,
        level: progress.level,
        progress: progress.progress,
        timestamp: progress.timestamp
      };

      const token = await indexedDBManager.getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/progress/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await indexedDBManager.deleteAuthToken();
          throw new Error('Authentication failed');
        }
        throw new Error(`Sync failed: ${response.status}`);
      }

      await indexedDBManager.markGameProgressSynced(progress.id);
      console.log('Game progress synced successfully:', progress.id);
    } catch (error) {
      console.error('Error syncing game progress:', error);
      throw error;
    }
  }

  // Cleanup old synced data (older than 7 days)
  async cleanupSyncedData() {
    try {
      await indexedDBManager.ensureDB();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      // Get all synced quiz results
      const transaction = indexedDBManager.db.transaction(['quizResults'], 'readwrite');
      const store = transaction.objectStore('quizResults');
      const index = store.index('synced');
      const request = index.openCursor(true); // synced = true

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const data = cursor.value;
          if (data.syncedAt && new Date(data.syncedAt).getTime() < sevenDaysAgo) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      request.onerror = () => {
        console.error('Error cleaning up synced data');
      };
    } catch (error) {
      console.error('Error cleaning up synced data:', error);
    }
  }

  // Manual sync trigger
  async manualSync() {
    return this.syncAll();
  }

  // Add sync listener
  addSyncListener(listener) {
    this.syncListeners.push(listener);
  }

  // Remove sync listener
  removeSyncListener(listener) {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  // Notify all listeners
  notifyListeners(event) {
    this.syncListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  // Get sync status
  async getSyncStatus() {
    const stats = await indexedDBManager.getStorageStats();
    return {
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine,
      unsyncedQuizzes: stats.unsyncedQuizzes,
      unsyncedGames: stats.unsyncedGames,
      unsyncedQueue: stats.unsyncedQueue
    };
  }
}

// Create singleton instance
const offlineSyncService = new OfflineSyncService();

// Initialize on load
if (typeof window !== 'undefined') {
  offlineSyncService.init();
}

export default offlineSyncService;

