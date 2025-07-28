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
  onShowCupGame,
  onShowSendMeritsForm,
  onWalletSave,
  onLogout,
  onProfileUpdate,
  message,
  onShowSendForm,
  onShowReleaseForm,
  onPayPalClick
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
        {/* Top Navigation - Three evenly spaced sections */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '0 0.5rem',
          gap: '0.5rem'
        }}>
          {/* Left - Profile Section */}
          <div 
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #d2691e',
              borderRadius: '50%',
              padding: '0.4rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              width: '70px',
              height: '70px',
              position: 'relative'
            }}
          >
            <ProfilePicture
              supabase={supabase}
              user={user}
              profile={profile}
              onProfileUpdate={onProfileUpdate}
              size="small"
              showUpload={false}
            />
            <div style={{
              fontSize: '0.7rem',
              fontWeight: '500',
              color: '#8b4513',
              fontStyle: 'italic',
              marginTop: '0.2rem',
              textAlign: 'center',
              lineHeight: '1'
            }}>
              {(profile?.username || 'User').length > 6 
                ? (profile?.username || 'User').substring(0, 6) + '...'
                : (profile?.username || 'User')}
            </div>
            
            {/* Admin indicators */}
            {isAdmin && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                display: 'flex',
                gap: '2px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowNotifications()
                  }}
                  style={{
                    background: '#d2691e',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  🔔
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowSendMeritsForm()
                  }}
                  style={{
                    background: '#d2691e',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                  title="Send Merits"
                >
                  ⭐
                </button>
              </div>
            )}
          </div>

          {/* Center - Cup Game */}
          <button
            onClick={onShowCupGame}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #d2691e',
              borderRadius: '50%',
              width: '70px',
              height: '70px',
              fontSize: '1.8rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
              transition: 'all 0.3s ease',
              color: '#d2691e'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)'
              e.target.style.boxShadow = '0 6px 20px rgba(210, 105, 30, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.boxShadow = '0 4px 15px rgba(210, 105, 30, 0.3)'
            }}
            title="Cup Game"
          >
            🏆
            <div style={{
              fontSize: '0.7rem',
              fontWeight: '500',
              color: '#8b4513',
              fontStyle: 'italic',
              marginTop: '0.2rem'
            }}>
              Cups
            </div>
          </button>

          {/* Right - Hanglight */}
          <a 
            href="https://hanglight.mx" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #d2691e',
              borderRadius: '50%',
              width: '70px',
              height: '70px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)'
            }}
          >
            🟢
            <div style={{
              fontSize: '0.7rem',
              fontWeight: '500',
              color: '#8b4513',
              fontStyle: 'italic',
              marginTop: '0.2rem'
            }}>
              Hang
            </div>
          </a>

          {/* Settings Panel */}
          {showSettings && (
            <div style={{
              position: 'absolute',
              top: '4rem',
              left: '0.5rem',
              right: '0.5rem',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              padding: '1rem',
              zIndex: 1000
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <ProfilePicture
                  supabase={supabase}
                  user={user}
                  profile={profile}
                  onProfileUpdate={onProfileUpdate}
                  size="large"
                  showUpload={true}
                />
              </div>
              
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

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '0.8rem',
            marginBottom: '1.5rem',
            backgroundColor: message.includes('successful') || message.includes('Sent') || message.includes('Released') || message.includes('connected') ? '#d4edda' : 
                           message.includes('failed') ? '#f8d7da' : '#fff3cd',
            color: message.includes('successful') || message.includes('Sent') || message.includes('Released') || message.includes('connected') ? '#155724' : 
                   message.includes('failed') ? '#721c24' : '#856404',
            borderRadius: '15px',
            fontSize: '0.8rem',
            fontStyle: 'italic'
          }}>
            {message}
          </div>
        )}

        {/* Palomas Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🕊️</div>
          <h2 style={{
            fontSize: '2.2rem',
            color: '#d2691e',
            margin: '0 0 0.4rem 0',
            fontWeight: 'normal',
            fontStyle: 'italic'
          }}>
            Palomas
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '0.6rem 1.2rem',
            display: 'inline-block',
            fontSize: '1.2rem',
            fontWeight: '500',
            color: '#8b4513',
            marginBottom: '1.2rem',
            fontStyle: 'italic'
          }}>
            {formatNumber(profile?.total_palomas_collected)}
          </div>
          <br />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
            {isAdmin ? (
              <button
                onClick={() => onShowSendForm('DOV')}
                style={{
                  background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.7rem 1.8rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                  width: '180px',
                  fontStyle: 'italic'
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
                  padding: '0.7rem 1.8rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                  width: '180px',
                  fontStyle: 'italic'
                }}
              >
                Release
              </button>
            )}
            
            {/* Get Palomas Button */}
            <button
              onClick={onPayPalClick}
              style={{
                background: 'linear-gradient(45deg, #0070ba, #003087)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.7rem 1.8rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 112, 186, 0.3)',
                width: '180px',
                fontStyle: 'italic'
              }}
            >
              Get
            </button>
          </div>
        </div>

        {/* Tiempo Section */}
        <div>
          <h2 style={{
            fontSize: '2.2rem',
            color: '#8b4513',
            margin: '0 0 0.4rem 0',
            fontWeight: 'normal',
            fontStyle: 'italic'
          }}>
            Tiempo
          </h2>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>⏳</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '0.6rem 1.2rem',
            display: 'inline-block',
            fontSize: '1.2rem',
            fontWeight: '500',
            color: '#8b4513',
            marginBottom: '1.2rem',
            fontStyle: 'italic'
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
                padding: '0.7rem 1.8rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                width: '180px',
                margin: '0 auto',
                fontStyle: 'italic'
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
                padding: '0.7rem 1.8rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                width: '180px',
                margin: '0 auto',
                display: 'block',
                fontStyle: 'italic'
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
