import React from 'react'

function FloatingGrailButton({ onGrailClick }) {
  return (
    <button
      onClick={onGrailClick}
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '20px',
        padding: '0.5rem 1rem',
        fontSize: '0.9rem',
        color: '#d2691e',
        cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: '500',
        zIndex: 1000,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}
    >
      antisocial media MMXXV
    </button>
  )
}

export default FloatingGrailButton
