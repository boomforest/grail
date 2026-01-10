import React from 'react'

function FloatingGrailButton({ onGrailClick }) {
  return (
    <button
      onClick={onGrailClick}
      style={{
        position: 'fixed',
        bottom: '0.75rem',
        left: '0.75rem',
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '15px',
        padding: '0.35rem 0.75rem',
        fontSize: '0.7rem',
        color: '#d2691e',
        cursor: 'pointer',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: '500',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
      }}
    >
      antisocial media MMXXV
    </button>
  )
}

export default FloatingGrailButton
