import { useState, useEffect } from 'react'
import { listPowerUps, getPowerUpImageUrl } from '../utils/powerUpsUtils'

/**
 * Store Page - Browse power-ups by category
 * Immersive tarot card-style design
 */
function StorePage({ supabase, onClose }) {
  const [activeTab, setActiveTab] = useState('studios')
  const [powerUps, setPowerUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => {
    loadPowerUps()
  }, [activeTab, supabase])

  async function loadPowerUps() {
    if (!supabase) return

    setLoading(true)
    setError(null)

    try {
      const data = await listPowerUps(supabase, activeTab)
      setPowerUps(data)
    } catch (err) {
      console.error('Error loading power-ups:', err)
      setError('Failed to load power-ups')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'studios', label: 'Studios', icon: '🎙️' },
    { id: 'pros', label: 'Pros', icon: '🎵' },
    { id: 'health', label: 'Health', icon: '🧘' }
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10003,
      overflow: 'hidden'
    }}>
      {/* Minimal header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Tabs - minimal pill style */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '30px',
          padding: '4px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                background: activeTab === tab.id
                  ? 'rgba(210, 105, 30, 0.9)'
                  : 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Title - subtle */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.85rem',
          fontWeight: '500',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          Power-Ups
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)'
            e.target.style.color = 'white'
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)'
            e.target.style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          ×
        </button>
      </div>

      {/* Main content - cards */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem 2rem 2rem',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '1.1rem'
          }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{
            color: '#ff6b6b',
            fontSize: '1.1rem'
          }}>
            {error}
          </div>
        ) : powerUps.length === 0 ? (
          <div style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: '1.1rem'
          }}>
            No offerings available yet
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '1rem'
          }}>
            {powerUps.map((powerUp, index) => (
              <TarotCard
                key={powerUp.id}
                powerUp={powerUp}
                supabase={supabase}
                isSelected={selectedCard === powerUp.id}
                onClick={() => setSelectedCard(selectedCard === powerUp.id ? null : powerUp.id)}
                index={index}
                total={powerUps.length}
              />
            ))}
          </div>
        )}
      </div>

      {/* Subtle footer hint */}
      <div style={{
        textAlign: 'center',
        padding: '0.75rem',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '0.8rem',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)'
      }}>
        Coming soon: Redeem with Doves
      </div>
    </div>
  )
}

/**
 * Tarot Card Component - Fighter/Game card style display
 */
function TarotCard({ powerUp, supabase, isSelected, onClick, index, total }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageUrl = powerUp.image_path
    ? getPowerUpImageUrl(supabase, powerUp.image_path)
    : null

  // Card dimensions - tall tarot proportions (roughly 2:3 ratio)
  const cardHeight = 'calc(100vh - 180px)'
  const cardWidth = 'calc((100vh - 180px) * 0.6)'
  const maxWidth = total <= 2 ? '400px' : total <= 3 ? '320px' : '280px'

  // Parse description into stat-like lines
  const descriptionLines = powerUp.description
    ? powerUp.description.split(/[,.\n]/).filter(line => line.trim()).slice(0, 5)
    : []

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        height: cardHeight,
        width: cardWidth,
        maxWidth: maxWidth,
        minWidth: '220px',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSelected
          ? '0 30px 60px rgba(210, 105, 30, 0.5), 0 0 60px rgba(210, 105, 30, 0.3), inset 0 0 30px rgba(210, 105, 30, 0.1)'
          : '0 20px 40px rgba(0, 0, 0, 0.6)',
        border: isSelected
          ? '2px solid rgba(255, 200, 100, 0.8)'
          : '2px solid rgba(255, 255, 255, 0.15)',
        flexShrink: 0
      }}
      onMouseOver={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'scale(1.03) translateY(-10px)'
          e.currentTarget.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(210, 105, 30, 0.2)'
          e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.3)'
        }
      }}
      onMouseOut={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.6)'
          e.currentTarget.style.border = '2px solid rgba(255, 255, 255, 0.15)'
        }
      }}
    >
      {/* Background image - fills the card */}
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={powerUp.title}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease'
          }}
        />
      ) : null}

      {/* Gradient fallback / placeholder */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(160deg, #2a1810 0%, #4a2820 30%, #1a0a05 100%)',
        display: (imageUrl && imageLoaded && !imageError) ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '4rem',
          opacity: 0.3
        }}>
          ✨
        </div>
      </div>

      {/* Left side gradient for text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '70%',
        background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Top gradient for name area */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '25%',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Card name - top left, retro RPG style */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        right: '4.5rem',
        zIndex: 2
      }}>
        <div style={{
          background: 'rgba(20, 12, 8, 0.9)',
          border: '3px solid #f4a460',
          borderRadius: '4px',
          padding: '0.5rem 0.75rem',
          boxShadow: '3px 3px 0px rgba(0,0,0,0.5)',
          display: 'inline-block'
        }}>
          <h3 style={{
            margin: 0,
            color: '#ffe4c4',
            fontSize: '1.1rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            lineHeight: 1.2
          }}>
            {powerUp.title}
          </h3>
        </div>
      </div>

      {/* Price badge - top right, coin style */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'linear-gradient(135deg, #ffd700 0%, #daa520 50%, #b8860b 100%)',
        border: '3px solid #8b4513',
        color: '#4a2810',
        padding: '0.4rem 0.6rem',
        borderRadius: '4px',
        fontSize: '0.9rem',
        fontWeight: '800',
        boxShadow: '3px 3px 0px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        zIndex: 2,
        fontFamily: 'monospace'
      }}>
        {powerUp.price_doves}
        <span style={{ fontSize: '0.9rem' }}>🕊️</span>
      </div>

      {/* Stats/Info - 8-bit retro game style */}
      <div style={{
        position: 'absolute',
        bottom: '1.25rem',
        left: '1rem',
        right: '1rem',
        zIndex: 2
      }}>
        {/* Retro stat box container */}
        <div style={{
          background: 'rgba(20, 12, 8, 0.85)',
          border: '3px solid #f4a460',
          borderRadius: '4px',
          padding: '0.6rem',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(255,220,180,0.15)'
        }}>
          {/* Stat lines */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            {descriptionLines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.3rem 0.5rem',
                  background: idx % 2 === 0 ? 'rgba(244, 164, 96, 0.15)' : 'transparent',
                  borderRadius: '2px'
                }}
              >
                <span style={{
                  color: '#ffd700',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}>
                  ♦
                </span>
                <span style={{
                  color: '#ffe4c4',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  fontFamily: 'system-ui, sans-serif',
                  letterSpacing: '0.3px'
                }}>
                  {line.trim()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Select indicator - pixel style */}
        {isSelected && (
          <div style={{
            marginTop: '0.75rem',
            textAlign: 'center',
            color: '#ffd700',
            fontSize: '0.8rem',
            fontWeight: '700',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
          }}>
            ✦ SELECTED ✦
          </div>
        )}
      </div>

      {/* Pixel-style corner decorations */}
      <div style={{
        position: 'absolute',
        bottom: '0.4rem',
        right: '0.4rem',
        width: '12px',
        height: '12px',
        background: '#f4a460',
        boxShadow: '-4px 0 0 #f4a460, 0 -4px 0 #f4a460, -8px 0 0 #f4a460, 0 -8px 0 #f4a460',
        pointerEvents: 'none',
        opacity: 0.6
      }} />
      <div style={{
        position: 'absolute',
        top: '0.4rem',
        left: '0.4rem',
        width: '12px',
        height: '12px',
        background: '#f4a460',
        boxShadow: '4px 0 0 #f4a460, 0 4px 0 #f4a460, 8px 0 0 #f4a460, 0 8px 0 #f4a460',
        pointerEvents: 'none',
        opacity: 0.6
      }} />
    </div>
  )
}

export default StorePage
