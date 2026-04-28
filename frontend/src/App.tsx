import { useState } from 'react'
import { useWallet } from './context/WalletContext'
import { useName, useSetName } from './hooks/useName'

function CounterPanel() {
  const [count, setCount] = useState(0)

  return (
    <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 shadow-2xl shadow-fuchsia-500/20 w-full">
      <div className="text-center space-y-8">
        <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-white/10 text-xs font-mono uppercase tracking-[0.3em] text-white/70">
          Counter v1.0
        </div>

        <h1 className="text-6xl font-black bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(232,121,249,0.4)]">
          Click Me
        </h1>

        <div className="relative">
          <div className="text-9xl font-black tabular-nums bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            {count}
          </div>
          <div className="absolute inset-0 text-9xl font-black tabular-nums text-fuchsia-500/20 blur-xs">
            {count}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => setCount((c) => c - 1)}
            className="group cursor-pointer relative px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="group cursor-pointer relative px-8 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold shadow-lg shadow-fuchsia-500/50 hover:shadow-fuchsia-500/80 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <span className="relative z-10">Increment +</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="absolute inset-0 flex items-center justify-center rounded-xl text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Increment +
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCount(0)}
            className="cursor-pointer px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-red-500/20 hover:border-red-400/40 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            ↺
          </button>
        </div>

        <p className="text-xs text-white/40 font-mono">
          built with <span className="text-fuchsia-400">react</span> +{' '}
          <span className="text-cyan-400">tailwind</span>
        </p>
      </div>
    </div>
  )
}

function NamePanel() {
  const { account, connect } = useWallet()
  const { data: name, isLoading, isError, error: readError } = useName()
  const { mutate: setName, isPending, error: writeError } = useSetName()
  const [input, setInput] = useState('')

  if (readError) console.error('useName error:', readError)
  if (writeError) console.error('useSetName error:', writeError)

  return (
    <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 shadow-2xl shadow-cyan-500/20 w-full">
      <div className="text-center space-y-8">
        <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-white/10 text-xs font-mono uppercase tracking-[0.3em] text-white/70">
          On-chain Name
        </div>

        <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
          SimpleContract
        </h1>

        {!account ? (
          <button
            type="button"
            onClick={connect}
            className="cursor-pointer px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/80 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <div className="relative">
              <div className="text-5xl font-black tabular-nums bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent break-all">
                {isLoading ? '…' : isError ? 'error' : name || '(empty)'}
              </div>
              <div className="absolute inset-0 text-5xl font-black tabular-nums text-cyan-500/20 blur-xs break-all">
                {isLoading ? '…' : isError ? 'error' : name || '(empty)'}
              </div>
            </div>

            <div className="flex flex-col gap-3 items-stretch">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="new name"
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-cyan-400/60 focus:bg-white/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setName(input, { onSuccess: () => setInput('') })}
                disabled={isPending || !input}
                className="cursor-pointer px-8 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold shadow-lg shadow-fuchsia-500/50 hover:shadow-fuchsia-500/80 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isPending ? 'Confirming…' : 'Set Name'}
              </button>
            </div>

            {(readError || writeError) && (
              <p className="text-xs text-red-400 font-mono break-all text-left">
                {(readError || writeError)?.message}
              </p>
            )}

            <p className="text-xs text-white/40 font-mono break-all">
              {account.slice(0, 6)}…{account.slice(-4)}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6 overflow-hidden relative">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl w-full">
        <CounterPanel />
        <NamePanel />
      </div>
    </main>
  )
}

export default App
