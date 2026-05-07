import { useNavigate } from 'react-router'

function Home() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-9 bg-green-300">
      <h1 className="font-bold text-6xl">This is the Home Page!</h1>
      <p className="text-lg">
        Basically, this page is gonna be full of instructions with instructions,
        with a sample grid, maybe our names
      </p>
      <p className="text-xl">Then a play button below 🡇 </p>

      {/* May want to move this button to components/ */}
      <button
        className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-green-600 px-6 font-medium text-neutral-50 transition-all duration-75 [box-shadow:5px_5px_rgba(100,100,100,0.25)] active:translate-x-0.75 active:translate-y-0.75 active:[box-shadow:0px_0px_rgb(100_100_100)] cursor-pointer"
        onClick={() => navigate('/select')}
      >
        Play!
      </button>

      <button
        className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-green-600 px-6 font-medium text-neutral-50 transition-all duration-75 [box-shadow:5px_5px_rgba(100,100,100,0.25)] active:translate-x-0.75 active:translate-y-0.75 active:[box-shadow:0px_0px_rgb(100_100_100)] cursor-pointer"
        onClick={() => navigate('/config')}
      >
        View Config!
      </button>
    </main>
  )
}

export default Home
