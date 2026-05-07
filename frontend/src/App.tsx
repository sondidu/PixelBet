import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './pages/Home'
import TemporaryPage from './pages/TemporaryPage'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/temporary-page" element={<TemporaryPage />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App
