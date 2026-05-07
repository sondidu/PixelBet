import { Link } from 'react-router'
import { useWallet } from '../context/WalletContext'
import { useConfig } from '../hooks/useConfig'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0) parts.push(`${s}s`)
  return parts.join(' ')
}

function ConfigPage() {
  const { account, connect } = useWallet()
  const { data, isLoading, error } = useConfig()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-9 bg-green-300">
      <h1 className="font-bold text-4xl">Global Configuration</h1>

      {!account ? (
        <button
          className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-green-600 px-6 font-medium text-neutral-50 transition-all duration-75 [box-shadow:5px_5px_rgba(100,100,100,0.25)] active:translate-x-0.75 active:translate-y-0.75 active:[box-shadow:0px_0px_rgb(100_100_100)] cursor-pointer"
          onClick={connect}
        >
          Connect Wallet
        </button>
      ) : (
        <>
          {isLoading && <p className="text-lg">Loading config...</p>}
          {error && <p className="text-lg text-red-700">Error loading config</p>}

          {data && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="text-left">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="px-6 py-3">Parameter</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3">Raw</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-3 font-medium">Global Min Bet</td>
                    <td className="px-6 py-3">{data.globalMinBet} ETH</td>
                    <td className="px-6 py-3 text-gray-500">{data.raw.globalMinBet} wei</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium">Global Max Bet</td>
                    <td className="px-6 py-3">{data.globalMaxBet} ETH</td>
                    <td className="px-6 py-3 text-gray-500">{data.raw.globalMaxBet} wei</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium">House Fee</td>
                    <td className="px-6 py-3">{data.houseFeePercentage}%</td>
                    <td className="px-6 py-3 text-gray-500">{data.raw.houseFeePercentage}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium">Min Multiplier</td>
                    <td className="px-6 py-3">{data.minMultiplier}x</td>
                    <td className="px-6 py-3 text-gray-500">{data.raw.minMultiplier}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium">Max Multiplier</td>
                    <td className="px-6 py-3">{data.maxMultiplier}x</td>
                    <td className="px-6 py-3 text-gray-500">{data.raw.maxMultiplier}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium">Valid Grid Sizes</td>
                    <td className="px-6 py-3">{data.validGridSizes.map((s) => `${s}x${s}`).join(', ')}</td>
                    <td className="px-6 py-3 text-gray-500">[{data.validGridSizes.join(', ')}]</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium">Valid Colour Counts</td>
                    <td className="px-6 py-3">{data.validColourCounts.join(', ')}</td>
                    <td className="px-6 py-3 text-gray-500">[{data.validColourCounts.join(', ')}]</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium">Betting Durations</td>
                    <td className="px-6 py-3">{data.validBettingDurations.map(formatDuration).join(', ')}</td>
                    <td className="px-6 py-3 text-gray-500">[{data.validBettingDurations.join(', ')}] seconds</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <Link
            to="https://eth-sepolia.blockscout.com/address/0xCb63b144703DdB057Ac3dfBb01eB8201A7C75b9A"
            target="_blank"
            className="flex items-center justify-center text-green-700 underline hover:text-green-900"
          >
            View contract on Blockscout
            <ArrowTopRightOnSquareIcon className="size-4 ml-1" />
          </Link>
        </>
      )}
    </main>
  )
}

export default ConfigPage
