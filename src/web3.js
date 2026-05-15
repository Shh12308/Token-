import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from 'wagmi/chains'

const projectId = 'bf6e2d08dd50b5a337ceb5cb9203bb5d'

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
