export { ABI, SCREENER_INITIALIZER, SYMBOLS };

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
    id: 'ethereum.ethereum-mainnet+spy-usd-kalman-24-5'
  },
  // {
  //   id: 'polygon.polygon-mainnet+AAPL-usd'
  // },
  {
    id: 'ethereum.ethereum-mainnet+tsla-usd-kalman-24-5'
  },
  {
    id: 'bnb-chain.bnb-chain-mainnet+coin-usd'
  },
  {
    id: 'ethereum.ethereum-mainnet+nvda-usd-kalman-24-5'
  },
  {
    id: 'ethereum.ethereum-mainnet+paxg-usd'
  },
  // {
  //   id: 'polygon.polygon-mainnet+xag-usd'
  // },
  {
    id: 'optimism.op-mainnet+eur-usd'
  },
  {
    id: 'monad.monad-mainnet+jpy-usd'
  },
  {
    id: 'arbitrum.arbitrum-mainnet+mcap-usd'
  },
  {
    id: 'ethereum.ethereum-mainnet+btc-usd'
  },
  {
    id: 'ethereum.ethereum-mainnet+eth-usd'
  },
  {
    id: 'ethereum.ethereum-mainnet+link-usd'
  }
]

const SYMBOLS = {
  'usd': '$',
  'eth': 'Ξ'
}
