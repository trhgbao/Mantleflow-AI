import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Define Mantle Sepolia chain
const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://explorer.sepolia.mantle.xyz' },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [mantleSepolia, mainnet],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [mantleSepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

export { mantleSepolia };
