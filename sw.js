'use strict'

const urlsToCache = [
  'index.html',
  './',
  // assets
  './public/assets/favicon_full.svg',
  // scripts
  './public/script/constant.js',
  './public/script/index.js',
  // styles
  './public/style/footer.css',
  './public/style/page.css',
  './public/style/reset.css',
  // others
  'https://cdn.jsdelivr.net/npm/web3@1/dist/web3.min.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@100;200;300;400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100;200;300;400;500&display=swap'
]

const staleUrls = [
  'raw.githubusercontent.com/dorianbayart/documentation',
  'reference-data-directory.vercel.app',
  'web3.min.js',
  'fonts.googleapis.com'
]

self.addEventListener('install', (event) => {
  event.waitUntil(async () => {
    const cache = await caches.open("sw-cache")
    return cache.addAll(urlsToCache)
  })
})

/** Stale while revalidate */
self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin) || staleUrls.find(url => event.request.url.contains(url))) {
    /* Stale while revalidate */
    console.log(`StaleWhileRevalidate - URL: ${event.request.url}`)
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const networkFetch = fetch(event.request).then(response => {
          // update the cache with a clone of the network response
          const responseClone = response.clone()
          caches.open(url.searchParams.get('name')).then(cache => {
            cache.put(event.request, responseClone)
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
    console.log(`NetworkFirst - URL: ${event.request.url}`)
    event.respondWith(
      fetch(event.request)
      .catch(error => {
        return caches.match(event.request)
      })
    )
  }
})
