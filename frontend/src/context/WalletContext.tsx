import { createContext, useContext, useState } from 'react'
import { ethers } from 'ethers'

interface WalletContextValue {
  signer: ethers.Signer | null
  account: string | null
  connect: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  async function connect() {
    if (!window.ethereum) {
      alert('MetaMask not found')
      return
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner()

    setSigner(signer)
    setAccount(await signer.getAddress())
  }

  return (
    <WalletContext.Provider value={{ signer, account, connect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
