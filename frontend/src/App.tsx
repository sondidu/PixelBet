import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './pages/Home'
import TemporaryPage from './pages/TemporaryPage'
import ConfigPage from './pages/Config'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/temporary-page" element={<TemporaryPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App
