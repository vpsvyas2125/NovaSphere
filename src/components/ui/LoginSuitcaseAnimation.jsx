import { useEffect, useState } from 'react'

export default function LoginSuitcaseAnimation({ children }) {
  const [stage, setStage] = useState('enter')

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStage('stop')
    }, 1800)

    const timer2 = setTimeout(() => {
      setStage('open')
    }, 2400)

    const timer3 = setTimeout(() => {
      setStage('ready')
    }, 3300)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  return (
    <div className="suitcase-scene">

      {/* Ambient glow */}

      <div className="scene-glow scene-glow-one" />
      <div className="scene-glow scene-glow-two" />

      {/* Stars */}

      <div className="scene-stars">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* Walking man */}

      <div
        className={`traveler ${
          stage === 'enter'
            ? 'traveler-enter'
            : 'traveler-stop'
        }`}
      >

        {/* Head */}

        <div className="traveler-head" />

        {/* Body */}

        <div className="traveler-body">
          <div className="traveler-arm traveler-arm-left" />
          <div className="traveler-arm traveler-arm-right" />
        </div>

        {/* Legs */}

        <div className="traveler-leg traveler-leg-left" />
        <div className="traveler-leg traveler-leg-right" />

        {/* Suitcase */}

        <div
          className={`traveler-suitcase ${
            stage === 'open' || stage === 'ready'
              ? 'suitcase-open'
              : ''
          }`}
        >
          <div className="suitcase-handle" />

          <div className="suitcase-body">

            <div className="suitcase-lock" />

            <div className="suitcase-panel">
              <span />
              <span />
              <span />
            </div>

          </div>

          {/* Login panel comes from suitcase */}

          <div
            className={`login-reveal ${
              stage === 'ready'
                ? 'login-reveal-ready'
                : ''
            }`}
          >
            {children}
          </div>

        </div>

      </div>

      {/* Ground */}

      <div className="scene-ground">
        <div className="ground-line" />
      </div>

      {/* Status */}

      <div
        className={`arrival-message ${
          stage === 'ready'
            ? 'arrival-message-hide'
            : ''
        }`}
      >
        <span className="arrival-dot" />
        Preparing your learning universe...
      </div>

    </div>
  )
}