import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './pages/Home'
import TemporaryPage from './pages/TemporaryPage'
import ConfigPage from './pages/Config'
import SelectPage from './pages/Select'
import BetPage from './pages/Bet'
import RoundHousePage from './pages/round_house'

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/select" element={<SelectPage />} />
          <Route path='/round_house' element={<RoundHousePage />} />
          <Route path= "/round" element={<BetPage/>} />
          <Route path="/temporary-page" element={<TemporaryPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App
