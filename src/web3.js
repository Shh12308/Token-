import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from 'wagmi/chains'

const projectId = 'YOUR_REAL_PROJECT_ID'

const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet],
  projectId
})

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet],
  metadata: {
    name: 'CryptoBean',
    description: 'Crypto Wallet App',
    url: 'https://your-site.com',
    icons: []
  }
})
