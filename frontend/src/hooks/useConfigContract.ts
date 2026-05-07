import { useMemo } from 'react'
import { useWallet } from '../context/WalletContext'
import { Config__factory } from '../types'

const ADDRESS = import.meta.env.VITE_CONFIG_CONTRACT_ADDRESS

export function useConfigContract() {
  const { signer } = useWallet()

  return useMemo(() => {
    if (!signer) return null
    return Config__factory.connect(ADDRESS, signer)
  }, [signer])
}
