import React from 'react'

const formatTimeAgo = (dateString) => {
  const now = new Date()
  const then = new Date(dateString)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0)
}

function NotificationsFeed({ onBack, notifications, onRefresh }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <h1 style={{
          fontSize: '2.5rem',
          color: '#d2691e',
          marginBottom: '2rem',
          fontWeight: 'normal',
          textAlign: 'center'
        }}>
          🕊️ Release Feed
        </h1>

        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <button
            onClick={onRefresh}
            style={{
              background: 'rgba(210, 105, 30, 0.1)',
              border: '1px solid #d2691e',
              borderRadius: '15px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              color: '#d2691e'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        <div style={{
          maxHeight: '70vh',
          overflowY: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '1rem'
        }}>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#8b4513',
              padding: '2rem',
              fontSize: '1.1rem'
            }}>
              No token releases yet...
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div key={index} style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#fff',
                borderRadius: '15px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#d2691e',
                    fontSize: '1.1rem'
                  }}>
                    🕊️ {notification.username}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#8b4513',
                    opacity: 0.7
                  }}>
                    {formatTimeAgo(notification.created_at)}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '1rem',
                  color: '#333',
                  marginBottom: '0.5rem'
                }}>
                  Released <strong>{formatNumber(notification.amount)} {notification.token_type === 'DOV' ? 'Palomas' : 'Palomitas'}</strong>
                </div>
                
                {notification.reason && notification.reason !== 'Token release' && (
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    fontStyle: 'italic',
                    backgroundColor: '#f8f9fa',
                    padding: '0.5rem',
                    borderRadius: '8px'
                  }}>
                    "{notification.reason}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationsFeed
