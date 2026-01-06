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
    // Immediate restart: Skip IDLE state
    setIsWinner(false)
    setShowConfetti(false)
    startTimer()
  }

  // ... (lines 114-282 unchanged) ...

  {
    isOfficial && (
      <p className="attempts-remaining">
        {(() => {
          const remaining = MAX_OFFICIAL_ATTEMPTS - attempts
          if (remaining <= 0) return "That was your last official try."
          return `${remaining} attempt${remaining === 1 ? '' : 's'} left!`
        })()}
      </p>
    )
  }
                      </>
                    )
}
                  </div >
                )}
              </div >
            )}
          </div >

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

        </div >

  <footer className="footer">
    <p>Quality dry cleaning since 2003</p>
    <div className="admin-reset" onClick={initiateReset}>Reset for Next Customer</div>
  </footer>

{/* PIN Pad Modal */ }
{
  showPinPad && (
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
  )
}
      </div >
    </div >
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
