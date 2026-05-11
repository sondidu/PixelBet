import { useNavigate } from "react-router"
export default function SelectPage() {
  const navigate = useNavigate()
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
        <h1 className="font-bold text-4xl text-center mt-12">Select a Game</h1>
        <button className="mt-10 self-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" onClick={() => navigate('/round')}>
          HOUSE
        </button>
    </main>
  )
}

