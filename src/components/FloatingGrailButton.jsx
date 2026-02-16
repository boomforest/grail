import React from 'react'

function FloatingGrailButton({ onGrailClick }) {
  return (
    <span
      onClick={onGrailClick}
      style={{
        position: 'fixed',
        bottom: '0.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'transparent',
        border: 'none',
        padding: '0.25rem',
        fontSize: '0.55rem',
        color: 'rgba(139, 69, 19, 0.25)',
        cursor: 'default',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: '400',
        letterSpacing: '0.5px',
        zIndex: 100,
        userSelect: 'none',
        transition: 'color 0.3s ease'
      }}
      onMouseOver={(e) => e.target.style.color = 'rgba(139, 69, 19, 0.5)'}
      onMouseOut={(e) => e.target.style.color = 'rgba(139, 69, 19, 0.25)'}
    >
      antisocial media MMXXV
    </span>
  )
}

export default FloatingGrailButton
