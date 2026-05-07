import { BrowserRouter, Routes, Route } from 'react-router'
import TemporaryPage from './pages/TemporaryPage'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TemporaryPage />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App
