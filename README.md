# PixelBet

PixelBet is a blockchain-based gambling platform where players wager on the outcome of a randomly generated colour grid. A House creates a game round by committing a secret seed and configuring a grid (6×6 to 11×11) with a chosen number of colours (3–7). Players bet blindly on which colour they predict will dominate the grid. After the betting window closes, the House reveals their seed — the smart contract verifies it, deterministically generates the board, identifies the winning colour, and distributes payouts. Provably fair randomness is enforced on-chain via a commit-reveal scheme using `keccak256`.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React + TypeScript | UI framework |
| Vite | Build tool and dev server |
| ethers.js | Wallet connection and contract interaction |

### Backend (Smart Contracts)

| Technology | Purpose |
|------------|---------|
| Solidity ^0.8.x | Smart contract language |
| Remix IDE | Contract development and compilation |
| Sepolia Testnet | Deployment network |
| ERC-20 | Token standard for wagering and payouts |

---

## Deployment

| Component | URL |
|-----------|-----|
| Frontend (Vercel) | https://pixel-bet.vercel.app |
| GameManager Contract (Sepolia Etherscan) | _TBD_ |
| Betting Contract (Sepolia Etherscan) | _TBD_ |
| Config Contract (Sepolia Etherscan) | _TBD_ |

---

## Smart Contracts

Three contracts make up the backend:

- **GameManager** — Round lifecycle management: creation, resolution, and cancellation.
- **Betting** — Wager placement, dynamic payout multiplier calculation, and winnings claims.
- **Config** — Platform-wide settings (bet limits, fee percentage, valid grid sizes, colour counts, betting durations).

---

## How It Works

1. **House creates a round** — Commits a `keccak256` hash of a secret seed along with grid parameters and a betting window duration.
2. **Players place bets** — During the open betting window, players choose a colour and submit a wager in ERC-20 tokens. Earlier bets earn higher payout multipliers.
3. **House resolves the round** — After the window closes, the House reveals the original seed. The contract verifies the hash, generates the board deterministically, and records the winning colour.
4. **Players claim winnings** — Winning players call `claimWinnings` to receive their payout, minus a House fee.

---

## Team

| Name | GitHub |
|------|--------|
| Sean Dewantoro | [@sondidu](https://github.com/sondidu) |
| Xu Chen Loo | [@xcl040](https://github.com/xcl040) |

---

_IFB452 — Blockchain Technology | Semester 1, 2026_
