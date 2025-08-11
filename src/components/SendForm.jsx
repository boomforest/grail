import React from 'react'

function SendForm({ 
  tokenType, 
  onBack, 
  message, 
  transferData, 
  setTransferData, 
  isTransferring, 
  onSend 
}) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        textAlign: 'center'
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
          fontSize: '3rem',
          color: '#d2691e',
          marginBottom: '2rem',
          fontWeight: 'normal'
        }}>
          Send {tokenType}
        </h1>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: message.includes('Sent') ? '#d4edda' : '#f8d7da',
            color: message.includes('Sent') ? '#155724' : '#721c24',
            borderRadius: '20px'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            value={transferData.recipient}
            onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value.toUpperCase() })}
            placeholder="Recipient Username (ABC123)"
            maxLength={6}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.2rem',
              border: '2px solid #d2691e',
              borderRadius: '25px',
              textAlign: 'center',
              marginBottom: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <input
            type="number"
            value={transferData.amount}
            onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
            placeholder="Amount"
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.2rem',
              border: '2px solid #d2691e',
              borderRadius: '25px',
              textAlign: 'center',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={() => onSend(tokenType)}
          disabled={isTransferring}
          style={{
            background: 'linear-gradient(45deg, #d2691e, #cd853f)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            fontWeight: '500',
            cursor: 'pointer',
            opacity: isTransferring ? 0.5 : 1,
            boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)'
          }}
        >
          {isTransferring ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default SendForm
