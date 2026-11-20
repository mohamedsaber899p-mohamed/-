
const CACHE_NAME = "mohammed-quran-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./quran-icon.svg"
];

// تثبيت التطبيق وتخزين الملفات الأساسية
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// تفعيل النسخة الجديدة
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// التعامل مع الطلبات
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // تخزين نصوص القرآن والتفسير بعد تحميلها بنجاح
  if (url.hostname === "api.alquran.cloud") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch (error) {
          const saved = await cache.match(request);
          if (saved) return saved;
          throw error;
        }
      })
    );
    return;
  }

  // ملفات الموقع
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(request, copy)
            );
          }
          return response;
        })
        .catch(async () => {
          const saved = await caches.match(request);
          return saved || caches.match("./index.html");
        })
    );
  }
});
