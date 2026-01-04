import { useState, useRef, useEffect } from 'react'
import Confetti from 'react-confetti'
import './App.css'

// Win condition: 3.00 seconds exactly (plus/minus 0ms tolerance as requested "exactly")
// Actually usually we want a tiny tolerance, but let's stick to 3.00 displayed
// The previous logic was 2995 to 3005 which rounds to 3.00. We will keep that.
const WIN_MIN_MS = 2995
const WIN_MAX_MS = 3005

const GameState = {
  IDLE: 'idle',
  RUNNING: 'running',
  RESULT: 'result',
  WINNER: 'winner',
  GAME_OVER: 'game_over'
}

function App() {
  const [gameState, setGameState] = useState(GameState.IDLE)
  const [time, setTime] = useState(0)
  const [attempts, setAttempts] = useState(0) // Tracks total attempts in this session
  const [isWinner, setIsWinner] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const timerRef = useRef(null)
  
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
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      setTime(Date.now() - startTime)
    }, 10)
  }

  const stopTimer = () => {
    clearInterval(timerRef.current)
    const finalTime = time
    
    // Win Logic: Must be between 2.995s and 3.005s (rounds to 3.00)
    // AND must be the first attempt (attempt 0)
    const hitTarget = finalTime >= WIN_MIN_MS && finalTime <= WIN_MAX_MS
    
    // Valid win if they hit target AND it's their first try
    // Note: attempts is currently 0, so this IS the first try
    const validWin = hitTarget && attempts === 0

    if (validWin) {
      setIsWinner(true)
      setShowConfetti(true)
      setGameState(GameState.WINNER)
    } else {
      // If they hit the target but it wasn't the first try
      // Or if they missed the target
      setIsWinner(false) // Even if they hit target on try 2, no prize
      
      if (hitTarget) {
        // Hit target on repeat try - good job but no prize
        setGameState(GameState.RESULT) 
      } else {
        // Missed target
        setGameState(GameState.RESULT)
      }
    }
    
    // Increment attempts after the game logic
    setAttempts(prev => prev + 1)
  }

  const handleTryAgain = () => {
    // Just goes back to idle for another fun run
    setGameState(GameState.IDLE)
    setIsWinner(false)
    setTime(0)
    setShowConfetti(false)
  }

  const fullReset = () => {
    // Resets everything for a NEW CUSTOMER
    setGameState(GameState.IDLE)
    setTime(0)
    setAttempts(0)
    setIsWinner(false)
    setShowConfetti(false)
  }

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const centiseconds = Math.floor((ms % 1000) / 10)
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}`
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
          <div className="logo" onClick={fullReset} title="Tap to reset for new customer">
            <span className="logo-icon">👔</span>
            <h1>REGAL CLEANERS</h1>
          </div>
          <p className="tagline">Stop the clock challenge!</p>
        </header>

        {/* 
            UNIFIED GAME PANEL 
            We keep the start/stop button area consistent to minimize finger movement
        */}
        <div className="game-panel">
          
          {/* Display Area changes based on state */}
          <div className="display-area">
            {gameState === GameState.IDLE && (
              <div className="challenge-info">
                <h2>🎯 THE CHALLENGE</h2>
                <p>Stop exactly on <span className="target-time">3.00</span> seconds</p>
                {attempts === 0 ? (
                  <div className="prize-badge">
                    <span className="prize-icon">🏆</span>
                    <span className="prize-text">WIN 3 FREE PIECES</span>
                    <span className="prize-subtext">Cleaned & Pressed! (First Try Only)</span>
                  </div>
                ) : (
                  <div className="prize-badge practice-mode">
                    <span className="prize-text">PRACTICE MODE</span>
                    <span className="prize-subtext">Playing for fun!</span>
                  </div>
                )}
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
                        <p className="small-print">(Prize only on 1st try)</p>
                      </>
                    ) : (
                      <>
                        <span className="result-emoji">😅</span>
                        <h2>SO CLOSE!</h2>
                      </>
                    )}
                   </div>
                )}
              </div>
            )}
          </div>

          {/* 
              This is the UNIFIED BUTTON AREA 
              The Start, Stop, and Try Again buttons will all render here 
              so user doesn't have to move their finger.
          */}
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
                {gameState === GameState.WINNER ? 'PLAY AGAIN' : 'TRY AGAIN'}
              </button>
            )}
          </div>

        </div>

        <footer className="footer">
          <p>Quality dry cleaning since 2003</p>
          <div className="admin-reset" onClick={fullReset}>Reset for Next Customer</div>
        </footer>
      </div>
    </div>
  )
}

export default App
