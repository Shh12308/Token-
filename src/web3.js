import { createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { walletConnect } from '@wagmi/connectors';

// ⚠️ Replace this with your real WalletConnect Project ID
const projectId = 'YOUR_PROJECT_ID';

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    walletConnect({
      projectId,
      showQrModal: true
    })
  ],
  transports: {
    [mainnet.id]: http()
  }
});
