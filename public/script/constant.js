const NETWORK = {
  'arbitrum.arbitrum-goerli': {
    rpc: 'https://goerli-rollup.arbitrum.io/rpc',
  },
  'arbitrum.arbitrum-mainnet': {
    rpc: 'https://arb1.arbitrum.io/rpc',
  },
  'avalanche.avalanche-mainnet': {
    rpc: 'https://api.avax.network/ext/bc/C/rpc',
  },
  'avalanche.avalanche-testnet': {
    rpc: 'https://api.avax-test.network/ext/bc/C/rpc',
  },
  'base.base-mainnet': {
    rpc: 'https://mainnet.base.org',
  },
  'base.base-goerli-testnet': {
    rpc: 'https://goerli.base.org',
  },
  'bnb-chain.bnb-chain-mainnet': {
    rpc: 'https://bsc-dataseed.binance.org',
  },
  'bnb-chain.bnb-chain-testnet': {
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  },
  'ethereum.ethereum-mainnet': {
    rpc: 'https://cloudflare-eth.com',
  },
  'ethereum.goerli-testnet': {
    rpc: 'https://rpc.ankr.com/eth_goerli',
  },
  'ethereum.sepolia-testnet': {
    rpc: 'https://rpc.sepolia.org',
  },
  'fantom.fantom-mainnet': {
    rpc: 'https://rpcapi.fantom.network',
  },
  'fantom.fantom-testnet': {
    rpc: 'https://rpc.testnet.fantom.network',
  },
  'gnosis-chain.gnosis-chain-mainnet': {
    rpc: 'https://rpc.gnosischain.com',
  },
  'harmony.harmony-mainnet': {
    rpc: 'https://api.harmony.one',
  },
  'klaytn.klaytn-baobab-testnet': {
    rpc: 'https://api.baobab.klaytn.net:8651',
  },
  'metis.metis-mainnet': {
    rpc: 'https://andromeda.metis.io/?owner=1088',
  },
  'moonbeam.moonbeam-mainnet': {
    rpc: 'https://rpc.api.moonbeam.network',
  },
  'moonriver.moonriver-mainnet': {
    rpc: 'https://rpc.api.moonriver.moonbeam.network',
  },
  'optimism.optimism-goerli': {
    rpc: 'https://goerli.optimism.io',
  },
  'optimism.optimism-mainnet': {
    rpc: 'https://mainnet.optimism.io',
  },
  'polygon.mumbai-testnet': {
    rpc: 'https://rpc.ankr.com/polygon_mumbai',
  },
  'polygon.polygon-mainnet': {
    rpc: 'https://polygon-rpc.com',
  },
  'solana.solana-devnet': {
    rpc: 'https://api.devnet.solana.com',
  },
  'solana.solana-mainnet': {
    rpc: 'https://api.mainnet-beta.solana.com',
  },
  'starknet.starknet-mainnet': {
    rpc: 'https://starknet-mainnet.public.blastapi.io',
  },
  'starknet.starknet-testnet': {
    rpc: 'https://starknet-testnet.public.blastapi.io',
  },
};

const ABI = [
  // getRoundData
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // latestRoundData
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const SCREENER_INITIALIZER = [
  {
    id: 'bnb-chain.bnb-chain-mainnet+spy-usd'
  },
  // {
  //   id: 'polygon.polygon-mainnet+AAPL-usd'
  // },
  {
    id: 'polygon.polygon-mainnet+tsla-usd'
  },
  {
    id: 'bnb-chain.bnb-chain-mainnet+coin-usd'
  },
  {
    id: 'polygon.polygon-mainnet+xau-usd'
  },
  // {
  //   id: 'polygon.polygon-mainnet+xag-usd'
  // },
  {
    id: 'ethereum.ethereum-mainnet+eur-usd'
  },
  {
    id: 'ethereum.ethereum-mainnet+jpy-usd'
  },
  {
    id: 'ethereum.ethereum-mainnet+mcap-usd'
  },
  {
    id: 'polygon.polygon-mainnet+btc-usd'
  },
  {
    id: 'polygon.polygon-mainnet+eth-usd'
  },
  {
    id: 'polygon.polygon-mainnet+link-usd'
  },
  {
    id: 'ethereum.ethereum-mainnet+rai-usd'
  },
  {
    id: 'gnosis-chain.gnosis-chain-mainnet+dpi-usd'
  }
]

const SYMBOLS = {
  'usd': '$',
  'eth': 'Ξ'
}
