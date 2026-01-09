// PWA Utility Functions
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOnlineStatus();
    this.setupUpdateAvailable();
  }

  // Register Service Worker
  async registerServiceWorker() {
    // In development we avoid registering a service worker because it can
    // serve cached assets and cause the app to revert to older versions
    // on hard refresh. We also proactively unregister any existing service
    // workers so the developer sees live changes immediately.
    if (process.env.NODE_ENV !== 'production') {
      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
          console.log('Service Workers unregistered (development mode)');
        } catch (err) {
          console.error('Error unregistering service workers in dev:', err);
        }
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              this.showUpdateAvailable();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Setup install prompt
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      // Show install button
      this.showInstallButton();
    });

    // Track if app is already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallButton();
      console.log('PWA was installed');
    });
  }

  // Setup online/offline status
  setupOnlineStatus() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showOnlineMessage();
      // Sync offline data when back online
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineMessage();
    });
  }

  // Setup update available notification
  setupUpdateAvailable() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker is controlling the page
        window.location.reload();
      });
    }
  }

  // Show install button
  showInstallButton() {
    // Create install button if it doesn't exist
    let installButton = document.getElementById('pwa-install-button');
    if (!installButton) {
      installButton = document.createElement('button');
      installButton.id = 'pwa-install-button';
      installButton.innerHTML = '📱 Install App';
      installButton.className = 'pwa-install-button';
      installButton.onclick = () => this.installApp();
      document.body.appendChild(installButton);
    }
    installButton.style.display = 'block';
  }

  // Hide install button
  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // Install the app
  async installApp() {
    if (this.deferredPrompt) {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      // Clear the deferredPrompt
      this.deferredPrompt = null;
      this.hideInstallButton();
    }
  }

  // Show online message
  showOnlineMessage() {
    this.showNotification('You are back online!', 'success');
  }

  // Show offline message
  showOfflineMessage() {
    this.showNotification('You are offline. Some features may be limited.', 'warning');
  }

  // Show update available
  showUpdateAvailable() {
    const updateButton = document.createElement('button');
    updateButton.innerHTML = '🔄 Update Available - Click to Refresh';
    updateButton.className = 'pwa-update-button';
    updateButton.onclick = () => window.location.reload();
    document.body.appendChild(updateButton);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (updateButton.parentNode) {
        updateButton.parentNode.removeChild(updateButton);
      }
    }, 10000);
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `pwa-notification pwa-notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Sync offline data
  async syncOfflineData() {
    try {
      // Get offline data from localStorage or IndexedDB
      const offlineData = this.getOfflineData();
      
      if (offlineData && offlineData.length > 0) {
        // Sync with server
        for (const data of offlineData) {
          try {
            await fetch('/api/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data)
            });
            
            // Remove synced data
            this.removeOfflineData(data.id);
          } catch (error) {
            console.error('Error syncing offline data:', error);
          }
        }
        
        this.showNotification('Offline data synced successfully!', 'success');
      }
    } catch (error) {
      console.error('Error in sync process:', error);
    }
  }

  // Get offline data
  getOfflineData() {
    try {
      const data = localStorage.getItem('learnplay-offline-data');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting offline data:', error);
      return [];
    }
  }

  // Save offline data
  saveOfflineData(data) {
    try {
      const existingData = this.getOfflineData();
      existingData.push({
        ...data,
        id: Date.now(),
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('learnplay-offline-data', JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  // Remove offline data
  removeOfflineData(id) {
    try {
      const existingData = this.getOfflineData();
      const filteredData = existingData.filter(item => item.id !== id);
      localStorage.setItem('learnplay-offline-data', JSON.stringify(filteredData));
    } catch (error) {
      console.error('Error removing offline data:', error);
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }

  // Show notification
  async showPushNotification(title, options = {}) {
    if (await this.requestNotificationPermission()) {
      const notification = new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return notification;
    }
  }

  // Check if app is installed
  isAppInstalled() {
    return this.isInstalled || window.matchMedia('(display-mode: standalone)').matches;
  }

  // Check if app is online
  isAppOnline() {
    return this.isOnline;
  }
}

// Create global instance
const pwaManager = new PWAManager();

// Add PWA styles
const pwaStyles = `
  .pwa-install-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    transition: transform 0.2s ease;
  }

  .pwa-install-button:hover {
    transform: translateY(-2px);
  }

  .pwa-update-button {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #28a745;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }

  .pwa-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    color: #333;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 300px;
  }

  .pwa-notification-success {
    border-left: 4px solid #28a745;
  }

  .pwa-notification-warning {
    border-left: 4px solid #ffc107;
  }

  .pwa-notification-error {
    border-left: 4px solid #dc3545;
  }

  .pwa-notification button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = pwaStyles;
document.head.appendChild(styleSheet);

export default pwaManager;
