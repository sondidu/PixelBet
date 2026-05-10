import { useNavigate } from 'react-router'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import Card from '../components/Card'
import Button from '../components/Button'

const BLOCKSCOUT_BASE = 'https://eth-sepolia.blockscout.com/address/'

const DEPLOYED_CONTRACTS: {
  name: string
  address?: string
  description: string
}[] = [
  {
    name: 'Config',
    address: import.meta.env.VITE_CONFIG_CONTRACT_ADDRESS,
    description:
      'Stores platform-wide settings like bet limits, fee, and valid grid sizes.',
  },
  {
    name: 'GameManager',
    address: import.meta.env.VITE_GAME_MANAGER_CONTRACT_ADDRESS,
    description:
      'Manages round lifecycle — creation, resolution, cancellation.',
  },
  {
    name: 'Betting',
    address: import.meta.env.VITE_BETTING_CONTRACT_ADDRESS,
    description:
      'Handles bet placement, payouts, refunds, and house fee withdrawal.',
  },
]

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function Circle({ num }: { num: number }) {
  return (
    <span className="shrink-0 w-8 h-8 rounded-full [box-shadow:3px_3px_rgba(100,100,100,0.25)] bg-green-600 text-white flex items-center justify-center font-bold text-sm">
      {num}
    </span>
  )
}

function Home() {
  const navigate = useNavigate()
  const deployed = DEPLOYED_CONTRACTS.filter(c => c.address)

  return (
    <main className="min-h-screen bg-green-300">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="font-bold text-7xl sm:text-8xl text-green-900 tracking-tight">
          PixelBet
        </h1>
        <p className="mt-4 text-xl text-green-800 max-w-xl">
          Provably fair colour betting on the blockchain.
        </p>
        <Button className="mt-10" onClick={() => navigate('/select')}>
          Play!
        </Button>
      </section>

      {/* What is PixelBet? */}
      <Card>
        <h2 className="text-3xl font-bold text-green-900 mb-4">
          What is PixelBet?
        </h2>
        <p className="text-gray-700 leading-relaxed">
          PixelBet is a blockchain-based betting platform where players wager on
          the outcome of a randomly generated colour grid. A House creates a
          round by choosing a grid size and number of colours. Players then bet
          on which colour they think will dominate the board — all without
          seeing it. After betting closes, the board is revealed and winners
          collect their payouts.
        </p>
        <p className="text-gray-700 leading-relaxed mt-4">
          Every round runs on the Sepolia testnet using native ETH. No trust
          required — every outcome is verifiable on-chain.
        </p>
      </Card>

      {/* How It Works */}
      <Card>
        <h2 className="text-3xl font-bold text-green-900 mb-8">How It Works</h2>
        <ol className="space-y-6">
          <li className="flex gap-4">
            <Circle num={1} />
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                House creates a round
              </h3>
              <p className="text-gray-700 mt-1">
                They pick a grid size (6x6 to 11x11), number of colours (3 to
                7), bet limits, and a betting window duration. They also commit
                a secret seed hash to the blockchain.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <Circle num={2} />
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Players place bets
              </h3>
              <p className="text-gray-700 mt-1">
                During the betting window, players choose a colour and wager
                ETH. Bet early for a higher payout multiplier (up to 3x) — later
                bets get lower multipliers (down to 1x).
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <Circle num={3} />
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                House reveals the seed
              </h3>
              <p className="text-gray-700 mt-1">
                After betting closes, the House reveals their original seed. The
                contract verifies it matches the committed hash, generates the
                board, and determines the winning colour.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <Circle num={4} />
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Winners claim payouts
              </h3>
              <p className="text-gray-700 mt-1">
                Players who bet on the dominant colour withdraw their winnings.
                The House collects a 5% fee from the pot.
              </p>
            </div>
          </li>
        </ol>
      </Card>

      {/* Board Generation */}
      <Card>
        <h2 className="text-3xl font-bold text-green-900 mb-4">
          How is the board generated?
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          The board is generated deterministically from the House's secret seed.
          The seed is locked in (via its hash) before any bets are placed, so no
          one can manipulate the outcome.
        </p>
        <pre className="bg-gray-900 rounded-lg p-5 text-sm text-green-200 overflow-x-auto">
          <code>{`for each cell i in the grid:
    hash = keccak256(seed, i)
    colour = hash[0] % numColours

winning colour = colour with the most cells

if tied:
    sort tied colours by index
    winning colour = tied[ keccak256(seed, "tiebreaker")[0] % numTied ]`}</code>
        </pre>
        <p className="text-gray-600 mt-4 text-sm">
          The same seed always produces the same board. Anyone can verify the
          result independently.
        </p>
      </Card>

      {/* Deployed Contracts */}
      <Card>
        <h2 className="text-3xl font-bold text-green-900 mb-4">
          Deployed Contracts
        </h2>
        <p className="text-gray-700 mb-6">
          All contracts are deployed on the Sepolia testnet and are publicly
          verifiable on Blockscout.
        </p>
        {deployed.length === 0 ? (
          <p className="text-gray-500 italic">No contracts configured yet.</p>
        ) : (
          <ul className="space-y-4">
            {deployed.map(contract => (
              <li
                key={contract.name}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {contract.name}
                  </h3>
                  <a
                    href={`${BLOCKSCOUT_BASE}${contract.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-green-700 hover:text-green-900 underline text-sm font-mono"
                  >
                    {shortenAddress(contract.address!)}
                    <ArrowTopRightOnSquareIcon className="size-4 ml-1" />
                  </a>
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  {contract.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Footer */}
      <footer className="text-center text-green-900 text-sm py-6 space-y-1">
        <p>
          PixelBet | IFB452 Blockchain Technology - Assignment 3 | Semester 1,
          2026
        </p>
        <p>
          By{' '}
          <a
            href="https://github.com/sondidu"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-green-700"
          >
            @sondidu
          </a>{' '}
          and{' '}
          <a
            href="https://github.com/xcl040"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-green-700"
          >
            @xcl040
          </a>
        </p>
      </footer>
    </main>
  )
}

export default Home
