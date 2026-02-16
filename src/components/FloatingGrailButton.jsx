import React from 'react'

function FloatingGrailButton({ onGrailClick, supabase }) {
  return (
    <>
      {/* Antisocial Media text - centered */}
      <span
        onClick={onGrailClick}
        style={{
          position: 'fixed',
          bottom: '2.5rem',
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

      {/* Alfa 91.3 logo - bottom right */}
      <img
        src={supabase ? supabase.storage.from('tarot-cards').getPublicUrl('ALFA.webp').data.publicUrl : ''}
        alt="91.3 Alfa"
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          height: '96px',
          width: 'auto',
          objectFit: 'contain',
          opacity: 0.5,
          transition: 'opacity 0.3s ease',
          zIndex: 9999
        }}
        onMouseOver={(e) => e.target.style.opacity = '0.8'}
        onMouseOut={(e) => e.target.style.opacity = '0.5'}
        onError={(e) => {
          console.log('Alfa 91.3 logo failed to load')
          e.target.style.display = 'none'
        }}
      />
    </>
  )
}

export default FloatingGrailButton
