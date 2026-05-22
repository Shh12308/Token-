import React from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'

const WalletConnectButton = () => {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()

  return (
    <button onClick={() => open()}>
      {isConnected ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
    </button>
  )
}

export default WalletConnectButton
