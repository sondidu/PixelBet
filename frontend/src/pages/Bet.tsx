import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import "./ColourBetPage.css"; // only for: @keyframes blink, no-spinner, swatch ::before

// ── Types ─────────────────────────────────────────────────────────────────────

type Colour = "red" | "yellow" | "blue" | null;
type CellColour = "red" | "yellow" | "blue" | "empty";

const CURRENCIES = ["WEI", "ETH"] as const;
type Currency = (typeof CURRENCIES)[number];

const RoundState = {
  OPEN: 0,
  RESOLVED: 1,
  CANCELLED: 2,
} as const;
type RoundState = (typeof RoundState)[keyof typeof RoundState];

interface Round {
  id: bigint;
  house: string;
  gridSize: number;
  numColours: number;
  minBet: bigint;
  maxBet: bigint;
  commitHash: string;
  revealedSeed: string;
  winningColour: number;
  bettingWindowStart: bigint;
  bettingWindowEnd: bigint;
  state: RoundState;
}

interface ToastState {
  message: string;
  visible: boolean;
}

// ── Colour config ─────────────────────────────────────────────────────────────
// Each entry maps a GameManager colour index to its Tailwind-safe bg class,
// hover bg class, and hex (used for swatch ::before via CSS var).

const COLOUR_NAMES = ["red", "yellow", "blue", "green", "purple", "orange", "cyan"] as const;
type ColourName = (typeof COLOUR_NAMES)[number];

// Cell bg + hover — must use full Tailwind class strings (not dynamic)
const CELL_COLOUR_CLASS: Record<ColourName, string> = {
  red:    "bg-[#e8000d] hover:bg-[#bf0009]",
  yellow: "bg-[#f5d000] hover:bg-[#c9a800]",
  blue:   "bg-[#1a18f5] hover:bg-[#120fcf]",
  green:  "bg-[#00a63e] hover:bg-[#007a2e]",
  purple: "bg-[#8b00cc] hover:bg-[#6a009e]",
  orange: "bg-[#f57200] hover:bg-[#c95c00]",
  cyan:   "bg-[#00b8d4] hover:bg-[#008fa3]",
};

// Swatch bg (same colours)
const SWATCH_BG: Record<ColourName, string> = {
  red:    "bg-[#e8000d]",
  yellow: "bg-[#f5d000]",
  blue:   "bg-[#1a18f5]",
  green:  "bg-[#00a63e]",
  purple: "bg-[#8b00cc]",
  orange: "bg-[#f57200]",
  cyan:   "bg-[#00b8d4]",
};

// Winner badge inner colour (via CSS var on ::before — handled in CSS)
const BADGE_BG: Record<ColourName, string> = {
  red:    "bg-[#e8000d]",
  yellow: "bg-[#f5d000]",
  blue:   "bg-[#1a18f5]",
  green:  "bg-[#00a63e]",
  purple: "bg-[#8b00cc]",
  orange: "bg-[#f57200]",
  cyan:   "bg-[#00b8d4]",
};

// Winner text colour
const WINNER_TEXT_COLOUR: Record<ColourName, string> = {
  red:    "text-[#e8000d]",
  yellow: "text-[#c9a800]",
  blue:   "text-[#1a18f5]",
  green:  "text-[#00a63e]",
  purple: "text-[#8b00cc]",
  orange: "text-[#f57200]",
  cyan:   "text-[#00b8d4]",
};

function colourName(index: number): ColourName {
  return COLOUR_NAMES[index] ?? "red";
}

// ── Mock round — replace with useGameManager hook ─────────────────────────────
function useMockRound(): Round {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return {
    id: 0n,
    house: "0xHouse",
    gridSize: 7,
    numColours: 3,
    minBet: 100n,
    maxBet: 1_000_000_000_000_000_000n,
    commitHash: "0x0",
    revealedSeed: "0x0",
    winningColour: 0,
    bettingWindowStart: now,
    bettingWindowEnd: now + 3600n,
    state: RoundState.OPEN,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BetPage() {
  const navigate = useNavigate();

  // TODO: replace with useGameManagerRound(roundId)
  const round = useMockRound();

  const windowEnd   = Number(round.bettingWindowEnd);
  const windowStart = Number(round.bettingWindowStart);

  const [cells, setCells] = useState<CellColour[]>(
    Array(round.gridSize * round.gridSize).fill("empty")
  );
  const [selectedColour, setSelectedColour] = useState<Colour>(null);
  const [betAmount, setBetAmount]           = useState("");
  const [currency, setCurrency]             = useState<Currency>("ETH");
  const [secondsLeft, setSecondsLeft]       = useState(0);
  const [toast, setToast] = useState<ToastState>({ message: "", visible: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer countdown (read-only — driven by GameManager's bettingWindowEnd) ──
  useEffect(() => {
    const tick = () =>
      setSecondsLeft(Math.max(0, windowEnd - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowEnd]);

  const bettingOpen = round.state === RoundState.OPEN && secondsLeft > 0;
  const isResolved  = round.state === RoundState.RESOLVED;
  const isCancelled = round.state === RoundState.CANCELLED;
  const timerUrgent = secondsLeft <= 10 && secondsLeft > 0 && bettingOpen;

  const progressPct =
    windowEnd - windowStart > 0
      ? (secondsLeft / (windowEnd - windowStart)) * 100
      : 0;

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast((p) => ({ ...p, visible: false })),
      2500
    );
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleColourSelect = (name: Colour) =>
    setSelectedColour((prev) => (prev === name ? null : name));

  const handleCellClick = (index: number) => {
    if (!bettingOpen) return;
    if (!selectedColour) { showToast("Pick a colour first!"); return; }
    setCells((prev) => {
      const next = [...prev];
      next[index] = next[index] === selectedColour ? "empty" : selectedColour;
      return next;
    });
  };

  const placeBet = () => {
    if (!bettingOpen)   { showToast("Betting window is closed!"); return; }
    if (!selectedColour){ showToast("Choose a colour to bet on!"); return; }
    const amount = parseFloat(betAmount);
    if (!betAmount || isNaN(amount) || amount <= 0) {
      showToast("Enter a valid bet amount!");
      return;
    }
    showToast(`✓ Bet placed: ${amount} ${currency} on ${selectedColour.toUpperCase()}`);
    // TODO: call Betting.placeBet(round.id, colourIndex, { value: amountInWei })
  };

  const claimWinnings = () => {
    showToast("Claiming winnings...");
    // TODO: call Betting.claimWinnings(round.id)
  };

  const claimRefund = () => {
    showToast("Claiming refund...");
    // TODO: call Betting.claimRefund(round.id)
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const roundColours = Array.from({ length: round.numColours }, (_, i) => colourName(i));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="font-bangers bg-white min-h-screen grid grid-cols-[1fr_440px] grid-rows-[auto_1fr] text-black tracking-wide">

      {/* ── BACK ── */}
      <button
        className="col-span-2 w-fit mt-5 ml-6 bg-white border-[3px] border-black rounded-[10px] text-black font-bangers text-[22px] tracking-[2px] px-6 py-1.5 cursor-pointer transition-colors duration-150 hover:bg-black hover:text-white active:scale-[0.97]"
        onClick={() => navigate(-1)}
      >
        BACK
      </button>

      {/* ── GRID ── */}
      <div className="flex items-center justify-center pt-6 pr-4 pb-7 pl-10">
        <div
          role="grid"
          aria-label="Betting grid"
          className="border-[3px] border-black rounded-[14px] overflow-hidden w-full max-w-[480px] aspect-square grid"
          style={{ gridTemplateColumns: `repeat(${round.gridSize}, 1fr)` }}
        >
          {cells.map((cell, i) => (
            <div
              key={i}
              role="gridcell"
              onClick={() => handleCellClick(i)}
              className={[
                "border border-black aspect-square cursor-pointer transition-colors duration-100",
                cell === "empty"
                  ? "bg-white hover:bg-[#eeeeee]"
                  : CELL_COLOUR_CLASS[cell as ColourName],
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-col gap-6 justify-center pt-6 pr-10 pb-7 pl-4">

        {/* ── BETTING OPEN ── */}
        {bettingOpen && (
          <>
            {/* Timer */}
            <div className="border-[3px] border-black rounded-md px-5 pt-3.5 pb-4 text-center">
              <div className="text-base tracking-[3px] text-black mb-0.5">
                REMAINING TIME
              </div>
              <div
                className={[
                  "font-bangers text-[68px] tracking-[4px] leading-none",
                  timerUrgent ? "text-[#e8000d] animate-blink" : "text-black",
                ].join(" ")}
              >
                {formatTime(secondsLeft)}
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Colour picker */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3.5 justify-center flex-wrap">
                {roundColours.map((colour) => (
                  <label key={colour} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="colour"
                      value={colour}
                      checked={selectedColour === colour}
                      onChange={() => handleColourSelect(colour as Colour)}
                      aria-label={`Bet on ${colour}`}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <div
                      className={[
                        "w-20 h-20 rounded-[20px] border-[3px] block cursor-pointer transition-transform duration-150",
                        SWATCH_BG[colour],
                        selectedColour === colour
                          ? "border-black scale-[1.12]"
                          : "border-transparent hover:scale-[1.07]",
                      ].join(" ")}
                    />
                  </label>
                ))}
              </div>
              <p className="text-xl tracking-[2px] text-black text-center">
                CHOOSE YOUR COLOUR TO BET
              </p>
            </div>

            {/* Bet amount */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <span className="text-xl tracking-[2px] whitespace-nowrap">
                  BET AMOUNT:
                </span>
                <input
                  id="betAmount"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="no-spinner w-[120px] bg-white border-[2.5px] border-black rounded text-black font-bangers text-xl tracking-wide px-2.5 py-1.5 outline-none focus:border-[#555]"
                />
                <select
                  id="betCurrency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-[72px] bg-white border-[2.5px] border-black rounded text-black font-bangers text-lg tracking-wide px-1 py-1.5 outline-none cursor-pointer appearance-none text-center transition-colors duration-150 hover:bg-black hover:text-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={placeBet}
                className="bg-white border-[3px] border-black rounded-full text-black font-bangers text-[32px] tracking-[4px] px-16 py-2.5 cursor-pointer transition-colors duration-150 hover:bg-black hover:text-white active:scale-[0.97]"
              >
                BET!
              </button>
            </div>
          </>
        )}

        {/* ── RESOLVED ── */}
        {isResolved && (
          <>
            <h2 className="font-bangers text-[50px] tracking-[3px] text-black leading-[1.1]">
              BOARD REVEALED!!
            </h2>

            <div className="flex gap-3.5 items-end flex-wrap">
              {roundColours.map((colour, index) => {
                const isWinner = index === round.winningColour;
                return (
                  <div
                    key={colour}
                    className={[
                      "flex items-center justify-center rounded-[18px]",
                      isWinner
                        ? "winner-badge w-[108px] h-[108px] bg-black rounded-[22px] p-2 relative"
                        : `w-[88px] h-[88px] ${BADGE_BG[colour]}`,
                    ].join(" ")}
                    // data attr used by CSS ::before to set inner colour
                    data-colour={colour}
                  >
                    <span
                      className={[
                        "font-bangers text-[40px] tracking-wide relative z-10",
                        colour === "yellow" ? "text-black" : "text-white",
                      ].join(" ")}
                    >
                      —
                      {/* TODO: replace — with actual count from getBets / board gen */}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-bangers text-[42px] tracking-[2px] text-black">
                <span className={WINNER_TEXT_COLOUR[colourName(round.winningColour)]}>
                  {colourName(round.winningColour).charAt(0).toUpperCase() +
                    colourName(round.winningColour).slice(1)}
                </span>
                {" WIN!!"}
              </p>
              <p className="font-bangers text-2xl tracking-[2px] text-black">
                SEED: {round.revealedSeed.slice(0, 14)}…
              </p>
            </div>

            <button
              onClick={claimWinnings}
              className="self-start bg-black border-[3px] border-black rounded-full text-white font-bangers text-[28px] tracking-[3px] px-11 py-3 cursor-pointer transition-colors duration-150 hover:bg-white hover:text-black active:scale-[0.97]"
            >
              CLAIM REWARD!
            </button>
          </>
        )}

        {/* ── CANCELLED ── */}
        {isCancelled && (
          <>
            <h2 className="font-bangers text-[50px] tracking-[3px] text-black leading-[1.1]">
              BETTING CANCELLED
            </h2>
            <p className="text-xl tracking-[2px] text-black text-center">
              The house cancelled this betting.
            </p>
            <button
              onClick={claimRefund}
              className="self-start bg-black border-[3px] border-black rounded-full text-white font-bangers text-[28px] tracking-[3px] px-11 py-3 cursor-pointer transition-colors duration-150 hover:bg-white hover:text-black active:scale-[0.97]"
            >
              CLAIM REFUND
            </button>
          </>
        )}

        {/* ── WINDOW CLOSED, AWAITING RESOLUTION ── */}
        {!bettingOpen && !isResolved && !isCancelled && (
          <>
            <h2 className="font-bangers text-[50px] tracking-[3px] text-black leading-[1.1]">
              BETTING CLOSED
            </h2>
            <div className="border-[3px] border-black rounded-md px-5 pt-3.5 pb-4 text-center">
              <div className="text-base tracking-[3px] text-black mb-0.5">FINAL TIME</div>
              <div className="font-bangers text-[68px] tracking-[4px] leading-none text-black">
                00:00:00
              </div>
            </div>
            <p className="text-xl tracking-[2px] text-black text-center">
              Waiting for house to reveal result…
            </p>
          </>
        )}
      </div>

      {/* ── TOAST ── */}
      <div
        role="status"
        aria-live="polite"
        className={[
          "fixed bottom-7 left-1/2 -translate-x-1/2 bg-black text-white rounded-full px-7 py-2.5",
          "font-bangers text-xl tracking-[2px] pointer-events-none whitespace-nowrap z-[999]",
          "transition-all duration-[250ms]",
          toast.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-[60px]",
        ].join(" ")}
      >
        {toast.message}
      </div>
    </div>
  );
}