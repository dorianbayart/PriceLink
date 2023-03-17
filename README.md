# chainlink-data-watcher

---

Get list of all supported networks
```js
fetch('https://raw.githubusercontent.com/smartcontractkit/documentation/main/src/features/feeds/data/chains.ts')
.then((resp) => resp.text())
.then((text) => text.split('CHAINS: Chain[] =').slice(-2)[0].split('export')[0]) // keep useful data
.then((str) => ('{ data:'+str+'}').replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ').replaceAll('https": ','https:').replace(/\,(?!\s*?[\{\[\"\'\w])/g, ''))
.then(JSON.parse).then(console.log)
```

Returns an array of pages, each page containing an array of networks
