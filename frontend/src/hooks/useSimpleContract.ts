import { useMemo } from 'react'
import { useWallet } from '../context/WalletContext'
import { SimpleContract__factory } from '../types'

const ADDRESS = import.meta.env.VITE_SIMPLE_CONTRACT_ADDRESS

export function useSimpleContract() {
  const { signer } = useWallet()

  return useMemo(() => {
    if (!signer) return null
    return SimpleContract__factory.connect(ADDRESS, signer)
  }, [signer])
}
