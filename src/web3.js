import { createWeb3Modal } from '@web3modal/wagmi/react'
import { WagmiConfig, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'

const projectId = 'YOUR_PROJECT_ID' // get from WalletConnect Cloud

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    walletConnect({ projectId })
  ],
  transports: {
    [mainnet.id]: http()
  }
})

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains: [mainnet]
})
