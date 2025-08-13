import React from 'react'

const WelcomeModal = ({ onClose, onBuyPalomas }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Close button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'color 0.3s ease',
            padding: '5px',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => e.target.style.color = '#334155'}
          onMouseOut={(e) => e.target.style.color = '#64748b'}
        >
          ×
        </button>

        {/* Content */}
        <div style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: '1.6',
          color: '#1e293b'
        }}>
          {/* Welcome Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
            }}>
              🏆
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Welcome to the Grail App
            </h2>
          </div>

          {/* Main description */}
          <div style={{
            fontSize: '17px',
            fontStyle: 'italic',
            marginBottom: '28px',
            color: '#475569',
            textAlign: 'center',
            padding: '0 8px'
          }}>
            This is the economy hub for the Casa de Copas community—think nonprofit casino: 
            instead of profits going to a corporation, extra funds support studio time, classes, 
            and creative grants for emerging Mexican artists.
          </div>

          {/* Beta Access Section */}
          <div style={{
            backgroundColor: '#f1f5f9',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              color: '#0f172a'
            }}>
              July–August Beta Access
            </h3>
            <p style={{
              fontSize: '16px',
              fontStyle: 'italic',
              margin: '0',
              color: '#475569',
              lineHeight: '1.5'
            }}>
              You're invited to work and play at Casa any weekday from 12–6pm, 
              as long as you have a positive Paloma balance—that's your entry ticket.
            </p>
          </div>

          {/* How it works */}
          <div style={{
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#fefce8',
              borderRadius: '12px',
              border: '1px solid #fde047'
            }}>
              <div style={{
                fontSize: '24px',
                marginRight: '16px'
              }}>
                💰
              </div>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#854d0e',
                  marginBottom: '4px'
                }}>
                  Buy Palomas through the app
                </div>
                <div style={{
                  fontSize: '14px',
                  fontStyle: 'italic',
                  color: '#a16207'
                }}>
                  Then use them inside for coffee, merch, classes, and more—just tap and go.
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <button
              onClick={onBuyPalomas}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
                transform: 'translateY(0)',
                minWidth: '200px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 24px rgba(124, 58, 237, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.3)'
              }}
            >
              Get Your First Palomas
            </button>
          </div>

          {/* Footer message */}
          <div style={{
            fontSize: '15px',
            fontStyle: 'italic',
            textAlign: 'center',
            color: '#64748b',
            lineHeight: '1.5',
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            Thanks for helping us launch this dream. You're not just testing an app—you're building a movement.
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  )
}

export default WelcomeModal