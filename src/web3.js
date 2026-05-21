import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, polygon, base, arbitrum } from 'wagmi/chains'

const projectId = 'bf6e2d08dd50b5a337ceb5cb9203bb5d'

const metadata = {
  name: 'CryptoBean',
  description: 'Non-custodial DeFi Wallet',
  url: 'https://token-six-gamma.vercel.app',
  icons: ['https://token-six-gamma.vercel.app/icon.png']
}

const chains = [mainnet, polygon, base, arbitrum]

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false
})

export const modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  defaultChain: mainnet
})
