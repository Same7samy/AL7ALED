const CACHE_NAME = 'alkhaled-v2';
// This list should be updated if new static assets are added.
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './components/AlertDialog.tsx',
  './components/BottomNav.tsx',
  './components/CameraScanner.tsx',
  './components/ConfirmDialog.tsx',
  './components/DashboardCard.tsx',
  './components/DateRangePicker.tsx',
  './components/Toast.tsx',
  './components/icons.tsx',
  './pages/AddEditCustomerPage.tsx',
  './pages/AddEditProductPage.tsx',
  './pages/AddEditSupplierPage.tsx',
  './pages/AddPurchaseInvoicePage.tsx',
  './pages/CameraCapturePage.tsx',
  './pages/CameraScannerPage.tsx',
  './pages/CreditSalePage.tsx',
  './pages/CustomerDetailPage.tsx',
  './pages/CustomersPage.tsx',
  './pages/CustomFieldsSettingsPage.tsx',
  './pages/Dashboard.tsx',
  './pages/ExpensesPage.tsx',
  './pages/InvoiceDetailPage.tsx',
  './pages/InvoicesPage.tsx',
  './pages/NotificationSettingsPage.tsx',
  './pages/NotificationsPage.tsx',
  './pages/OffersPage.tsx',
  './pages/PlaceholderPage.tsx',
  './pages/ProductDetailPage.tsx',
  './pages/Products.tsx',
  './pages/PurchaseInvoiceDetailPage.tsx',
  './pages/ReportsPage.tsx',
  './pages/SalesPOS.tsx',
  './pages/SettingsPage.tsx',
  './pages/SupplierDetailPage.tsx',
  './pages/SuppliersPage.tsx',
  // External assets
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://unpkg.com/@zxing/library@0.21.0/umd/index.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching assets');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache assets during install:', error);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchedResponsePromise = fetch(event.request).then((networkResponse) => {
        // We only cache successful responses
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
        // If the network fails and there's no cache, this will be a network error
      });
      
      // Return the cached response if it's available, otherwise wait for the network
      return cachedResponse || fetchedResponsePromise;
    })
  );
});
