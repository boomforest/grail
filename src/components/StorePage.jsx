import { useState, useEffect } from 'react'
import { listPowerUps, getPowerUpImageUrl } from '../utils/powerUpsUtils'

/**
 * Store Page - Browse power-ups by category
 * Public page accessible to all users
 */
function StorePage({ supabase, onClose }) {
  const [activeTab, setActiveTab] = useState('studios')
  const [powerUps, setPowerUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load power-ups for active category
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
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10003,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fef7ed, #fed7aa)',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '3px solid #d2691e',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: '#d2691e',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem'
          }}>
            ✨ Power-Ups Store
          </h2>
          <p style={{
            margin: 0,
            color: '#8b4513',
            fontSize: '0.9rem'
          }}>
            Coming soon: Redeem with Doves
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#d2691e',
            opacity: 0.7,
            transition: 'opacity 0.2s',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => e.target.style.opacity = '1'}
          onMouseOut={(e) => e.target.style.opacity = '0.7'}
        >
          ×
        </button>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid rgba(210, 105, 30, 0.2)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                background: activeTab === tab.id
                  ? 'rgba(210, 105, 30, 0.8)'
                  : 'rgba(255, 255, 255, 0.3)',
                color: activeTab === tab.id ? 'white' : '#8b4513',
                border: 'none',
                borderRadius: '10px 10px 0 0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(210, 105, 30, 0.3)'
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#8b4513'
            }}>
              Loading power-ups...
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#dc3545'
            }}>
              {error}
            </div>
          ) : powerUps.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#999'
            }}>
              No power-ups available in this category yet
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {powerUps.map(powerUp => (
                <PowerUpCard
                  key={powerUp.id}
                  powerUp={powerUp}
                  supabase={supabase}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Power-Up Card Component
 */
function PowerUpCard({ powerUp, supabase }) {
  const imageUrl = powerUp.image_path
    ? getPowerUpImageUrl(supabase, powerUp.image_path)
    : null

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)'
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}
    >
      {/* Image */}
      <div style={{
        width: '100%',
        height: '150px',
        background: imageUrl
          ? `url(${imageUrl}) center/cover`
          : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #ffecd2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '3rem'
      }}>
        {!imageUrl && '✨'}
      </div>

      {/* Content */}
      <div style={{
        padding: '1rem'
      }}>
        {/* Title and price */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '0.5rem'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: '600',
            color: '#333',
            flex: 1
          }}>
            {powerUp.title}
          </h3>
          <div style={{
            background: '#d2691e',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            marginLeft: '0.5rem',
            whiteSpace: 'nowrap'
          }}>
            {powerUp.price_doves} 🕊️
          </div>
        </div>

        {/* Description */}
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          color: '#666',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {powerUp.description}
        </p>
      </div>
    </div>
  )
}

export default StorePage
