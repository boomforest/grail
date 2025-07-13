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
            background: 'rgba(25
