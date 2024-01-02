# PriceLink - PWA

> Chainlink
> Realtime
> Prices
> Decentralized
> OnChain

## What is it ?

Display real-time prices of stocks, forex, crypto or indices using Chainlink's decentralized on-chain smart-contracts.  
PriceLink is installable as a Progressive Web Application (PWA).

## Why ?

To understand how Chainlink oracle works - Just for fun !

## How ?

Using simple Javascript and [web3.js library](https://web3js.readthedocs.io)

---


### Some code

Get list of all supported networks
```js
fetch('https://raw.githubusercontent.com/smartcontractkit/documentation/main/src/features/feeds/data/chains.ts')
.then((resp) => resp.text())
.then((text) => text.split('CHAINS: Chain[] =').slice(-2)[0].split('export')[0]) // keep useful data
.then((str) => ('{ data:'+str+'}').replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ').replaceAll('https": ','https:').replace(/\,(?!\s*?[\{\[\"\'\w])/g, ''))
.then(JSON.parse).then(console.log)
```

Returns an array of pages, each page containing an array of networks
