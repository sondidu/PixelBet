import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { useConfigContract } from './useConfigContract'
import type { Config } from '../types'

const MAX_ARRAY_LENGTH = 10

async function readArray<T>(
  fn: (index: number) => Promise<T>,
): Promise<T[]> {
  const results = await Promise.allSettled(
    Array.from({ length: MAX_ARRAY_LENGTH }, (_, i) => fn(i)),
  )
  const values: T[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') values.push(r.value)
    else break
  }
  return values
}

async function fetchAllConfig(contract: Config) {
  const [
    globalMinBet,
    globalMaxBet,
    houseFeePercentage,
    minMultiplier,
    maxMultiplier,
    validGridSizes,
    validColourCounts,
    validBettingDurations,
  ] = await Promise.all([
    contract.globalMinBet(),
    contract.globalMaxBet(),
    contract.houseFeePercentage(),
    contract.minMultiplier(),
    contract.maxMultiplier(),
    readArray((i) => contract.validGridSizes(i)),
    readArray((i) => contract.validColourCounts(i)),
    readArray((i) => contract.validBettingDurations(i)),
  ])

  return {
    globalMinBet: ethers.formatEther(globalMinBet),
    globalMaxBet: ethers.formatEther(globalMaxBet),
    houseFeePercentage: Number(houseFeePercentage),
    minMultiplier: Number(minMultiplier) / 1000,
    maxMultiplier: Number(maxMultiplier) / 1000,
    validGridSizes: validGridSizes.map(Number),
    validColourCounts: validColourCounts.map(Number),
    validBettingDurations: validBettingDurations.map(Number),
    raw: {
      globalMinBet: globalMinBet.toString(),
      globalMaxBet: globalMaxBet.toString(),
      houseFeePercentage: houseFeePercentage.toString(),
      minMultiplier: minMultiplier.toString(),
      maxMultiplier: maxMultiplier.toString(),
    },
  }
}

export function useConfig() {
  const contract = useConfigContract()

  return useQuery({
    queryKey: ['config'],
    queryFn: () => fetchAllConfig(contract!),
    enabled: !!contract,
  })
}
