import React from 'react'
import WalletInput from './WalletInput'
import ProfilePicture from './ProfilePicture'

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0)
}

function Dashboard({ 
  profile,
  user,
  supabase,
  isAdmin,
  showSettings,
  setShowSettings,
  onShowNotifications,
  onWalletSave,
  onLogout,
  onProfileUpdate,
  message,
  onShowSendForm,
  onShowReleaseForm
}) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '1rem',
      position: 'relative',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '0 0.5rem'
        }}>
          {/* Left side - Profile Picture & Settings */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem'
          }}>
            <ProfilePicture
              supabase={supabase}
              user={user}
              profile={profile}
              onProfileUpdate={onProfileUpdate}
              size="small"
              showUpload={true}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ⚙️
              </button>
              {isAdmin && (
                <button
                  onClick={onShowNotifications}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  🔔
                </button>
              )}
            </div>
          </div>

          {/* Center - Username */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#8b4513'
          }}>
            {profile?.username || 'User'}
          </div>

          {/* Right side - Hanglight link */}
          <a 
            href="https://hanglight.mx" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              fontSize: '1.5rem',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🟢
          </a>

          {showSettings && (
            <div style={{
              position: 'absolute',
              top: '3rem',
              left: '0.5rem',
              right: '0.5rem',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              padding: '1rem',
              zIndex: 1000
            }}>
              <WalletInput 
                onWalletSave={onWalletSave}
                currentWallet={profile?.wallet_address}
              />
              
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: message.includes('successful') || message.includes('Sent') || message.includes('Released') || message.includes('connected') ? '#d4edda' : 
                           message.includes('failed') ? '#f8d7da' : '#fff3cd',
            color: message.includes('successful') || message.includes('Sent') || message.includes('Released') || message.includes('connected') ? '#155724' : 
                   message.includes('failed') ? '#721c24' : '#856404',
            borderRadius: '15px',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🕊️</div>
          <h2 style={{
            fontSize: '2.8rem',
            color: '#d2691e',
            margin: '0 0 0.5rem 0',
            fontWeight: 'normal'
          }}>
            Palomas
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '0.75rem 1.5rem',
            display: 'inline-block',
            fontSize: '1.4rem',
            fontWeight: '500',
            color: '#8b4513',
            marginBottom: '1.5rem'
          }}>
            {formatNumber(profile?.dov_balance)}
          </div>
          <br />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
            {isAdmin ? (
              <button
                onClick={() => onShowSendForm('DOV')}
                style={{
                  background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.8rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                  width: '200px'
                }}
              >
                Send
              </button>
            ) : (
              <button
                onClick={() => onShowReleaseForm('DOV')}
                style={{
                  background: 'linear-gradient(45deg, #8b4513, #a0522d)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.8rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                  width: '200px'
                }}
              >
                Release
              </button>
            )}
            
            <button
              onClick={() => {
                if (!user) {
                  // This should be handled by the parent component
                  return
                }
                // Pass user ID to PayPal so webhook knows who paid
                const paypalUrl = `https://www.paypal.com/ncp/payment/LEWS26K7J8FAC?custom_id=${user.id}`
                window.open(paypalUrl, '_blank')
                // Parent component should handle setting message
              }}
              style={{
                background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.8rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                width: '200px'
              }}
            >
              Collect
            </button>
          </div>
        </div>

        <div>
          <h2 style={{
            fontSize: '2.8rem',
            color: '#8b4513',
            margin: '0 0 0.5rem 0',
            fontWeight: 'normal'
          }}>
            Palomitas
          </h2>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🕊️</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '0.75rem 1.5rem',
            display: 'inline-block',
            fontSize: '1.4rem',
            fontWeight: '500',
            color: '#8b4513',
            marginBottom: '1.5rem'
          }}>
            {formatNumber(profile?.djr_balance)}
          </div>
          <br />
          {isAdmin ? (
            <button
              onClick={() => onShowSendForm('DJR')}
              style={{
                background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.8rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                width: '200px',
                margin: '0 auto'
              }}
            >
              Send
            </button>
          ) : (
            <button
              onClick={() => onShowReleaseForm('DJR')}
              style={{
                background: 'linear-gradient(45deg, #8b4513, #a0522d)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.8rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                width: '200px',
                margin: '0 auto',
                display: 'block'
              }}
            >
              Release
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
