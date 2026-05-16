import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet } from 'wagmi/chains'

const projectId = 'bf6e2d08dd50b5a337ceb5cb9203bb5d'

const metadata = {
  name: 'CryptoBean',
  description: 'Crypto Wallet App',
  url: 'https://token-six-gamma.vercel.app',
  icons: []
}

const chains = [mainnet]

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata
})

export const modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  chains
})
