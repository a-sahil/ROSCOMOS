import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './config/flow' // Initialize Flow configuration
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import CreateCircle from './pages/CreateCircle'
import CircleDetails from './pages/CircleDetails'
import SplashScreen from './components/SplashScreen'
import ThreeBackground from './components/ThreeBackground'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [selectedCircle, setSelectedCircle] = useState(null)
  const [splashDone, setSplashDone] = useState(false)
  const showAmbientBackground = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth > 768,
    [],
  )

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} onSelectCircle={setSelectedCircle} />
      case 'create':
        return <CreateCircle onNavigate={setCurrentPage} />
      case 'details':
        return <CircleDetails circle={selectedCircle} onNavigate={setCurrentPage} />
      default:
        return <LandingPage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950" style={{ position: 'relative', background: 'var(--bg-primary)' }}>
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      {showAmbientBackground && <ThreeBackground />}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Navbar onNavigate={setCurrentPage} />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        <Footer />
      </div>
    </div>
  )
}

export default App
