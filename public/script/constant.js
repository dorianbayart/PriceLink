const NETWORK = {
    'arbitrum-arbitrum-goerli': {
        rpc: '',
    },
    'arbitrum-arbitrum-mainnet': {
        rpc: 'https://arb1.arbitrum.io/rpc',
    },
    'avalanche-avalanche-mainnet': {
        rpc: 'https://api.avax.network/ext/bc/C/rpc',
    },
    'avalanche-avalanche-testnet': {
        rpc: '',
    },
    'base-base-goerli-testnet': {
        rpc: '',
    },
    'bnb-chain-bnb-chain-mainnet': {
        rpc: 'https://bsc-dataseed.binance.org',
    },
    'bnb-chain-bnb-chain-testnet': {
        rpc: '',
    },
    'ethereum-ethereum-mainnet': {
        rpc: 'https://cloudflare-eth.com',
    },
    'ethereum-goerli-testnet': {
        rpc: '',
    },
    'ethereum-sepolia-testnet': {
        rpc: 'https://rpc.ankr.com/eth_sepolia',
    },
    'fantom-fantom-mainnet': {
        rpc: 'https://rpcapi.fantom.network',
    },
    'fantom-fantom-testnet': {
        rpc: '',
    },
    'gnosis-chain-gnosis-chain-mainnet': {
        rpc: 'https://rpc.gnosischain.com',
    },
    'harmony-harmony-mainnet': {
        rpc: '',
    },
    'klaytn-klaytn-baobab-testnet': {
        rpc: '',
    },
    'metis-metis-mainnet': {
        rpc: '',
    },
    'moonbeam-moonbeam-mainnet': {
        rpc: '',
    },
    'moonriver-moonriver-mainnet': {
        rpc: '',
    },
    'optimism-optimism-goerli': {
        rpc: '',
    },
    'optimism-optimism-mainnet': {
        rpc: '',
    },
    'polygon-mumbai-testnet': {
        rpc: '',
    },
    'polygon-polygon-mainnet': {
        rpc: 'https://polygon-rpc.com',
    },
    'solana-solana-devnet': {
        rpc: '',
    },
    'solana-solana-mainnet': {
        rpc: '',
    },
    'starknet-starknet-testnet': {
        rpc: '',
    },
};

const ABI = [
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
