# PriceLink - PWA

> Chainlink  
> Realtime  
> Prices  
> Decentralized  
> OnChain  

## What is it ?

PriceLink is a Progressive Web Application (PWA) that displays real-time prices of various assets, including stocks, forex, cryptocurrencies, and indices.  
It fetches this data using Chainlink's decentralized on-chain smart contracts, ensuring accurate and tamper-proof price feeds directly from multiple blockchain networks.

## Why ?

PriceLink was created to explore and demonstrate how Chainlink oracles work, providing reliable real-time data to decentralized applications. It’s a fun and educational project that showcases the integration of blockchain technology with a user-friendly web interface, built just for the joy of learning and experimentation!

## How ?

The app uses simple JavaScript paired with the [web3.js library](https://web3js.readthedocs.io) to connect to various blockchain networks (e.g., Ethereum, Polygon, Binance Smart Chain) and query Chainlink price feed contracts.  
Designed as a PWA, PriceLink offers an installable, native app-like experience on both mobile and desktop devices.

## Features

- **Real-time Price Updates**: Continuously fetches the latest asset prices from Chainlink oracles.
- **Multiple Asset Types**: Supports stocks (e.g., TSLA), forex (e.g., EUR/USD), cryptocurrencies (e.g., BTC/USD), and indices (e.g., SPY/USD).
- **Decentralized Data**: Relies on Chainlink’s decentralized oracle network for secure and reliable price feeds.
- **Customizable Screener**: Add or remove assets to track your favorite prices in real time.
- **Historical Data**: View 24-hour price history graphs for selected assets.
- **PWA Support**: Installable on mobile and desktop devices with offline access capabilities.

## How it Works

PriceLink connects to multiple blockchain networks via their RPC endpoints, as defined in `constant.js`. For each network, it interacts with Chainlink price feed smart contracts using the ABI specified in the code. The app:

1. **Initializes**: Loads a list of supported networks and fetches available price feeds.
2. **Fetches Data**: Queries Chainlink contracts for real-time prices and historical data using `web3.js`.
3. **Updates UI**: Displays prices in a customizable screener and renders 24-hour price graphs using the [Observable Plot library](https://observablehq.com/@observablehq/plot).
4. **Handles Interaction**: Allows users to add/remove assets and drag-and-drop them within the screener.

The app dynamically updates prices at intervals, ensuring the data stays current without overwhelming the network.

## Usage

1. **Launch the App**: Open PriceLink in your browser.
2. **Browse Assets**: Scroll through the list of available assets, organized by blockchain network.
3. **Add to Screener**: Click an asset to add it to the screener at the top, where real-time prices and mini graphs are displayed.
4. **View Details**: Click an asset in the screener to see detailed info, including a larger 24-hour price graph.
5. **Remove Assets**: Drag an asset from the screener to the trash icon (appears during drag) to remove it.
6. **Search**: Use the search bar to filter assets by name, type, or network.

## Installation

PriceLink is a PWA, meaning it can be installed on your device for a seamless, app-like experience with offline support.

- **Mobile Devices (iOS/Android)**:
  1. Open the app in your browser (e.g., Chrome or Safari).
  2. Look for the "Add to Home Screen" option in the browser menu or a prompt.
  3. Tap to install, and launch it from your home screen.

- **Desktop (Chrome/Edge)**:
  1. Open the app in your browser.
  2. Click the install icon (usually a `+` in the address bar) or find "Install PriceLink" in the browser menu.
  3. Launch it from your applications menu or desktop shortcut.

Once installed, PriceLink works offline by caching key assets via its service worker (`sw.js`).

---

## Development

Want to run PriceLink locally or contribute? Here’s how:

### Prerequisites
- A modern web browser (e.g., Chrome, Firefox).
- A local server (e.g., `http-server` or `live-server`) to serve the files.

### Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/dorianbayart/PriceLink.git
   cd PriceLink
   ```

2. **Install a Local Server (if not already installed)**:
   ```bash
   npm install -g http-server
   ```

3. **Run the App**:
   ```bash
   http-server
   ```
   Open your browser and navigate to http://localhost:8080.

4. **Modify and Test**:
   - Edit files in the `public/script/` or `public/style/` directories as needed.  
   - The app reloads automatically when served locally.

### Contributing
Submit issues or pull requests on the [GitHub repository](https://github.com/dorianbayart/PriceLink).  
Ensure your changes align with the project’s MIT License.


## Credits and Acknowledgments
- Chainlink: For its decentralized oracle network and price feed contracts.
- web3.js: For seamless blockchain interaction.
- Observable Plot: For rendering price history graphs.
- DragDropTouch: For enabling drag-and-drop on touch devices.
- Author: Dorian Bayart


## License
This project is released under the MIT License (LICENSE). Feel free to use, modify, and distribute it as you see fit.


---


### Some code

To fetch a list of all supported networks programmatically, use this JavaScript snippet:
```js
fetch('https://raw.githubusercontent.com/dorianbayart/documentation/main/src/features/data/chains.ts')
.then((resp) => resp.text())
.then((text) => text.split('CHAINS: Chain[] =').slice(-2)[0].split('export')[0]) // extract relevant data
.then((str) => ('{ data:'+str+'}').replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ').replaceAll('https": ','https:').replace(/\,(?!\s*?[\{\[\"\'\w])/g, ''))
.then(JSON.parse)
.then(console.log)
```

This returns an array of pages, each containing an array of networks supported by PriceLink, which can be used to explore available price feeds.
