import React from 'react'

function ChooseSendType({ onBack, onSelectDoves, onSelectEggs }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.9rem',
            color: '#666',
            cursor: 'pointer',
            marginBottom: '1rem',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          ← Back
        </button>

        {/* Title */}
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Choose transfer type
        </h2>

        <p style={{
          fontSize: '0.9rem',
          color: '#666',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          How would you like to send?
        </p>

        {/* Doves Button */}
        <button
          onClick={onSelectDoves}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            border: '2px solid #2196f3',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{
            fontSize: '2.5rem'
          }}>
            🕊️
          </div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1976d2'
          }}>
            Instant
          </div>
        </button>

        {/* Eggs Button */}
        <button
          onClick={onSelectEggs}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            border: '2px solid #ff9800',
            borderRadius: '15px',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{
            fontSize: '2.5rem'
          }}>
            🐣
          </div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#f57c00'
          }}>
            Half now, half later
          </div>
        </button>
      </div>
    </div>
  )
}

export default ChooseSendType
