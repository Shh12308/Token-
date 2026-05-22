import { useAccount, useWalletClient } from 'wagmi'
import { ethers } from 'ethers'
import { getSessionWallet } from './session'

export const useWallet = () => {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const internalWallet = getSessionWallet()

  // 🔥 External wallet (MetaMask / WalletConnect)
  if (isConnected && walletClient) {
    const provider = new ethers.BrowserProvider(walletClient.transport)

    return {
      type: 'external',
      address,
      signer: async () => await provider.getSigner(),
      provider
    }
  }

  // 🔐 Internal wallet
  if (internalWallet) {
    return {
      type: 'internal',
      address: internalWallet.address,
      signer: async () => internalWallet,
      provider: internalWallet.provider || null
    }
  }

  return null
}
