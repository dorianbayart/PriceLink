'use strict'

const CACHE_NAME = 'price-link-v0'

const urlsToCache = [
  'index.html',
  './',
  // assets
  './public/assets/favicon_full_512.svg',
  './public/assets/favicon_full_512.png',
  './public/assets/favicon_256.svg',
  './public/assets/favicon_256.png',
  // scripts
  './public/script/constant.js',
  './public/script/index.js',
  // styles
  './public/style/footer.css',
  './public/style/page.css',
  './public/style/reset.css',
  // others
  'https://cdn.jsdelivr.net/npm/web3@1/dist/web3.min.js',
  'https://cdn.jsdelivr.net/npm/@observablehq/plot/+esm',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@100;200;300;400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;200;300;400;500&display=swap'
]

const staleUrls = [
  'raw.githubusercontent.com/dorianbayart/documentation',
  'reference-data-directory.vercel.app',
  'web3.min.js',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]

self.addEventListener('install', (event) => {
  event.waitUntil(async () => {
    const cache = await caches.open(CACHE_NAME)
    return cache.addAll(urlsToCache)
  })
})

/** Stale while revalidate */
self.addEventListener('fetch', event => {
  const { request } = event

  if (request.url.startsWith(self.location.origin) || staleUrls.find(url => request.url.includes(url))) {
    /* Stale while revalidate */
    console.log(`StaleWhileRevalidate - URL: ${request.url}`)
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const networkFetch = fetch(request).then(response => {
          // update the cache with a clone of the network response
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone)
          })
          return response
        }).catch(function (reason) {
          console.error('ServiceWorker fetch failed: ', reason)
        })
        // prioritize cached response over network
        return cachedResponse || networkFetch
      })
    )
  } else {
    /* Network firsst */
    console.log(`NetworkFirst - URL: ${request.url}`)
    event.respondWith(
      fetch(request)
      .catch(error => {
        return caches.match(request)
      })
    )
  }
})
