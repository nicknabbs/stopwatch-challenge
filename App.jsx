import { useState, useRef, useEffect } from 'react'
import Confetti from 'react-confetti'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { logEvent, EVENT_TYPES } from './src/analytics'
import Dashboard from './src/Dashboard'
import './App.css'

// Win condition: 3.00 seconds exactly
const WIN_MIN_MS = 2995
const WIN_MAX_MS = 3005
const MAX_OFFICIAL_ATTEMPTS = 3

const CASHIER_PINS = {
  '1776': 'Summer',
  '2791': 'Lisa',
  '0902': 'Stephanie',
  '8470': 'Alyssa',
  '4746': 'Evelyn'
}

const GameState = {
  IDLE: 'idle',
  RUNNING: 'running',
  RESULT: 'result',
  WINNER: 'winner',
  GAME_OVER: 'game_over'
}

function Game() {
  const navigate = useNavigate()
  const [gameState, setGameState] = useState(GameState.IDLE)
  const [time, setTime] = useState(0)
  const [attempts, setAttempts] = useState(0) // Tracks total attempts in this session
  const [isWinner, setIsWinner] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const timerRef = useRef(null)

  // PIN Pad State
  const [showPinPad, setShowPinPad] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  // Window size for confetti
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  // Track window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const startTimer = () => {
    setGameState(GameState.RUNNING)
    setTime(0)
    logEvent(EVENT_TYPES.GAME_START, { attempt_number: attempts + 1 })

    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTime)
    }, 10)
  }

  const stopTimer = () => {
    clearInterval(timerRef.current)
    const finalTime = time

    const hitTarget = finalTime >= WIN_MIN_MS && finalTime <= WIN_MAX_MS

    // Win if hit target AND within the official attempt limit (0, 1, or 2)
    // attempts is 0-indexed, so 0, 1, 2 are the first 3 tries.
    const isOfficialAttempt = attempts < MAX_OFFICIAL_ATTEMPTS
    const validWin = hitTarget && isOfficialAttempt

    const resultState = validWin ? GameState.WINNER : GameState.RESULT
    if (validWin) {
      setIsWinner(true)
      setShowConfetti(true)
    } else {
      setIsWinner(false)
    }

    setGameState(resultState)

    // Log Result
    logEvent(EVENT_TYPES.GAME_STOP, {
      time_ms: finalTime,
      is_win: validWin,
      is_official: isOfficialAttempt,
      hit_target: hitTarget,
      attempt_index: attempts
    })

    // Increment attempts after the game logic
    setAttempts(prev => prev + 1)
  }

  const handleTryAgain = () => {
    setGameState(GameState.IDLE)
    setIsWinner(false)
    setTime(0)
    setShowConfetti(false)
  }

  // Initial Click on "Reset for Next Customer"
  const initiateReset = () => {
    setShowPinPad(true)
    setPinInput('')
    setPinError(false)
  }

  const handlePinInput = (digit) => {
    if (pinInput.length < 4) {
      setPinInput(prev => prev + digit)
      setPinError(false)
    }
  }

  const handlePinClear = () => {
    setPinInput('')
    setPinError(false)
  }

  const handlePinSubmit = () => {
    const cashierName = CASHIER_PINS[pinInput]

    if (cashierName) {
      // Success!
      logEvent(EVENT_TYPES.RESET, {
        total_attempts: attempts,
        cashier: cashierName
      })

      // Perform Reset
      setGameState(GameState.IDLE)
      setTime(0)
      setAttempts(0)
      setIsWinner(false)
      setShowConfetti(false)

      // Close Modal
      setShowPinPad(false)
      setPinInput('')
    } else {
      // Error
      setPinError(true)
      setPinInput('')
    }
  }

  const handlePinCancel = () => {
    setShowPinPad(false)
    setPinInput('')
    setPinError(false)
  }

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const centiseconds = Math.floor((ms % 1000) / 10)
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}`
  }

  // Secret triple tap on logo to go to dashboard
  const logoTapCount = useRef(0)
  const handleLogoTap = () => {
    logoTapCount.current += 1
    if (logoTapCount.current >= 5) {
      logEvent(EVENT_TYPES.VISIT_DASHBOARD)
      navigate('/dashboard')
      logoTapCount.current = 0
    }
    setTimeout(() => logoTapCount.current = 0, 2000) // Reset if too slow
  }

  // Determine current badge status
  const attemptsLeft = MAX_OFFICIAL_ATTEMPTS - attempts
  const isOfficial = attempts < MAX_OFFICIAL_ATTEMPTS

  let badgeClass = 'official-attempt'
  let badgeTitle = `ATTEMPT ${attempts + 1} OF ${MAX_OFFICIAL_ATTEMPTS}`
  let badgeSubtitle = 'Prize Eligible!'

  if (attempts === MAX_OFFICIAL_ATTEMPTS - 1) {
    badgeTitle = 'FINAL ATTEMPT!'
    badgeSubtitle = 'Last chance for prize!'
    badgeClass = 'final-attempt' // We can style this red in CSS if needed or reuse official
  } else if (!isOfficial) {
    badgeClass = 'fun-mode'
    badgeTitle = 'PLAYING FOR FUN'
    badgeSubtitle = 'Prize limit reached'
  }

  return (
    <div className="app">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={500}
          colors={['#FFD700', '#FF6B35', '#00D4AA', '#FF3366', '#FFFFFF']}
        />
      )}

      <div className="container">
        <header className="header">
          <div className="logo" onClick={handleLogoTap} title="Tap 5 times for Dashboard">
            <span className="logo-icon">👔</span>
            <h1>REGAL CLEANERS</h1>
          </div>
          <p className="tagline">Stop the clock challenge!</p>
        </header>

        {/* 
            UNIFIED GAME PANEL 
        */}
        <div className="game-panel">

          {/* Display Area changes based on state */}
          <div className="display-area">
            {gameState === GameState.IDLE && (
              <div className="challenge-info">
                <h2>🎯 THE CHALLENGE</h2>
                <h3 className="prize-announcement">WIN 3 FREE GARMENTS!</h3>
                <p>Stop exactly on <span className="target-time">3.00</span> seconds</p>

                <div className={`prize-badge ${badgeClass}`}>
                  <span className="prize-icon">{isOfficial ? '🏆' : '🎮'}</span>
                  <span className="prize-text">{badgeTitle}</span>
                  <span className="prize-subtext">{badgeSubtitle}</span>
                </div>
              </div>
            )}

            {gameState === GameState.RUNNING && (
              <div className="timer-display">
                <div className="timer-value">{formatTime(time)}</div>
                <div className="timer-label">SECONDS</div>
              </div>
            )}

            {(gameState === GameState.RESULT || gameState === GameState.WINNER) && (
              <div className="result-container">
                <div className={`result-time ${isWinner ? 'winner' : ''}`}>
                  <div className="result-value">{formatTime(time)}</div>
                  <div className="result-label">seconds</div>
                </div>

                {gameState === GameState.WINNER && (
                  <div className="winner-message">
                    <span className="winner-stars">⭐ ⭐ ⭐</span>
                    <h2 className="winner-title">🎉 WINNER! 🎉</h2>
                    <div className="prize-display">
                      <h3>3 FREE PIECES!</h3>
                      <p>Show this screen to claim.</p>
                      <p className="small-print">Won on Attempt {attempts}</p>
                    </div>
                  </div>
                )}

                {gameState === GameState.RESULT && (
                  <div className="result-message">
                    {time >= WIN_MIN_MS && time <= WIN_MAX_MS ? (
                      <>
                        <span className="result-emoji">👏</span>
                        <h2>PERFECT!</h2>
                        <p>Amazing timing!</p>
                        {!isOfficial && <p className="small-print">(Prize eligible only provided on first 3 tries)</p>}
                      </>
                    ) : (
                      <>
                        <span className="result-emoji">😅</span>
                        <h2>SO CLOSE!</h2>
                        {isOfficial && (
                          <p className="attempts-remaining">
                            {MAX_OFFICIAL_ATTEMPTS - (attempts + 1) > 0
                              ? `${MAX_OFFICIAL_ATTEMPTS - (attempts + 1)} attempts left!`
                              : "That was your last official try."}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="control-area">
            {gameState === GameState.IDLE && (
              <button className="btn btn-main btn-start" onClick={startTimer}>
                {attempts === 0 ? 'TAP TO START' : 'TRY AGAIN'}
              </button>
            )}

            {gameState === GameState.RUNNING && (
              <button className="btn btn-main btn-stop" onClick={stopTimer}>
                STOP!
              </button>
            )}

            {(gameState === GameState.RESULT || gameState === GameState.WINNER) && (
              <button className="btn btn-main btn-reset" onClick={handleTryAgain}>
                {gameState === GameState.WINNER
                  ? 'PLAY AGAIN'
                  : (attempts >= MAX_OFFICIAL_ATTEMPTS ? 'PLAY FOR FUN' : 'TRY AGAIN')}
              </button>
            )}
          </div>

        </div>

        <footer className="footer">
          <p>Quality dry cleaning since 2003</p>
          <div className="admin-reset" onClick={initiateReset}>Reset for Next Customer</div>
        </footer>

        {/* PIN Pad Modal */}
        {showPinPad && (
          <div className="modal-overlay">
            <div className="pin-modal">
              <h3>Cashier PIN Required</h3>
              <div className={`pin-display ${pinError ? 'error' : ''}`}>
                {pinError ? 'INVALID PIN' : pinInput.replace(/./g, '•') || 'Enter PIN'}
              </div>
              <div className="pin-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} className="btn-pin" onClick={() => handlePinInput(num.toString())}>{num}</button>
                ))}
                <button className="btn-pin btn-clear" onClick={handlePinClear}>C</button>
                <button className="btn-pin" onClick={() => handlePinInput('0')}>0</button>
                <button className="btn-pin btn-enter" onClick={handlePinSubmit}>OK</button>
              </div>
              <button className="btn-cancel" onClick={handlePinCancel}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App
