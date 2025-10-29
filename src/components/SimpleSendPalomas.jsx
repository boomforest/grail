import { useState } from 'react'

function SimpleSendPalomas({ profile, supabase, onClose }) {
  const [recipient, setRecipient] = useState('CDC333') // Default to Casa
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showCustomRecipient, setShowCustomRecipient] = useState(false) // Toggle for custom recipient
  const [showReceipt, setShowReceipt] = useState(false) // Show receipt after send
  const [receiptData, setReceiptData] = useState(null) // Store receipt info

  const handleSend = async (e) => {
    e.preventDefault()

    // Use CDC333 as default if no custom recipient is set
    const finalRecipient = recipient.trim() || 'CDC333'

    if (!finalRecipient) {
      setError('Please enter a recipient username')
      return
    }

    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const palomasToSend = parseInt(amount)

    if (palomasToSend > (profile?.total_palomas_collected || 0)) {
      setError('Insufficient Palomas balance')
      return
    }

    setSending(true)
    setError('')

    try {
      // Get recipient profile
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('id, username, total_palomas_collected')
        .eq('username', finalRecipient.toUpperCase())
        .single()

      if (recipientError || !recipientProfile) {
        setError('Recipient not found')
        setSending(false)
        return
      }

      if (recipientProfile.id === profile.id) {
        setError('Cannot send to yourself')
        setSending(false)
        return
      }

      // Update sender's Paloma balance (deduct)
      const newSenderBalance = (profile.total_palomas_collected || 0) - palomasToSend
      const { error: senderUpdateError } = await supabase
        .from('profiles')
        .update({ total_palomas_collected: newSenderBalance })
        .eq('id', profile.id)

      if (senderUpdateError) {
        console.error('Error updating sender balance:', senderUpdateError)
        setError('Failed to send Palomas')
        setSending(false)
        return
      }

      // Update recipient's Paloma balance (add)
      const newRecipientBalance = (recipientProfile.total_palomas_collected || 0) + palomasToSend
      const { error: recipientUpdateError } = await supabase
        .from('profiles')
        .update({ total_palomas_collected: newRecipientBalance })
        .eq('id', recipientProfile.id)

      if (recipientUpdateError) {
        console.error('Error updating recipient balance:', recipientUpdateError)
        setError('Failed to send Palomas')
        setSending(false)
        return
      }

      // If sending to CDC333, give 77% love token bonus
      let loveBonus = 0
      if (recipientProfile.username === 'CDC333') {
        loveBonus = Math.floor(palomasToSend * 0.77)

        if (loveBonus > 0) {
          const newLovBalance = (profile.lov_balance || 0) + loveBonus

          const { error: lovUpdateError } = await supabase
            .from('profiles')
            .update({ lov_balance: newLovBalance })
            .eq('id', profile.id)

          if (lovUpdateError) {
            console.error('Error updating Love balance:', lovUpdateError)
          }
        }
      }

      // Success - Show receipt (don't call onSuccess to prevent auto-close)
      setReceiptData({
        amount: palomasToSend,
        recipient: recipientProfile.username,
        sender: profile.username,
        timestamp: new Date(),
        transactionId: `TXN${Date.now()}`,
        loveBonus: loveBonus
      })
      setShowReceipt(true)

    } catch (err) {
      console.error('Error:', err)
      setError('Something went wrong')
      setSending(false)
    }
  }

  // If showing receipt, render receipt view
  if (showReceipt && receiptData) {
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
        zIndex: 10001,
        padding: '1rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #fff, #f8f8f8)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '2px solid #d2691e',
          position: 'relative',
          textAlign: 'center'
        }}>
          {/* Close button */}
          <button
            onClick={() => {
              // Just close everything and go back to home
              onClose()
            }}
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

          {/* Dove Image with Amount Overlay */}
          <div style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '2rem'
          }}>
            <img
              src={supabase.storage.from('tarot-cards').getPublicUrl('DOV.png').data.publicUrl}
              alt="Palomas"
              style={{
                width: '200px',
                height: '200px',
                objectFit: 'contain',
                display: 'block'
              }}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            {/* Amount displayed over the dove */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '3rem',
              fontWeight: '900',
              color: '#d2691e',
              textShadow: '2px 2px 4px rgba(255,255,255,0.9), -2px -2px 4px rgba(255,255,255,0.9), 2px -2px 4px rgba(255,255,255,0.9), -2px 2px 4px rgba(255,255,255,0.9)',
              pointerEvents: 'none'
            }}>
              {receiptData.amount}
            </div>
          </div>

          {/* Recipient Username */}
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#d2691e',
            marginBottom: '1rem'
          }}>
            {receiptData.recipient === 'CDC333' ? 'Casa de Copas' : receiptData.recipient}
          </div>

          {/* Love Bonus (if applicable) */}
          {receiptData.loveBonus > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.1), rgba(240, 98, 146, 0.1))',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid rgba(233, 30, 99, 0.3)'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#8b4513',
                marginBottom: '0.5rem',
                fontWeight: '600'
              }}>
                Love Token Bonus!
              </div>
              <div style={{
                fontSize: '1.2rem',
                color: '#e91e63',
                fontWeight: '700'
              }}>
                +{receiptData.loveBonus} Love Tokens
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#8b4513',
                marginTop: '0.25rem',
                marginBottom: '0.75rem',
                opacity: 0.7
              }}>
                77% bonus for sending to Casa de Copas
              </div>

              {/* Cup Game Button */}
              <button
                onClick={() => {
                  onClose() // Close everything and return to dashboard
                  // User can then click the cup game from dashboard
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #e91e63, #f06292)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(233, 30, 99, 0.3)',
                  transition: 'all 0.3s',
                  marginTop: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.4)'
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 2px 8px rgba(233, 30, 99, 0.3)'
                }}
              >
                View Cup Game Progress
              </button>
            </div>
          )}

          {/* Instructions */}
          <div style={{
            background: 'rgba(139, 69, 19, 0.1)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#8b4513',
            fontStyle: 'italic'
          }}>
            Show this to the bartender
          </div>
        </div>
      </div>
    )
  }

  // Normal send form view
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fff8dc, #f5deb3)',
        borderRadius: '25px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(210, 105, 30, 0.3)',
        border: '3px solid #d2691e',
        position: 'relative'
      }}>
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
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '1'}
          onMouseOut={(e) => e.target.style.opacity = '0.7'}
        >
          ×
        </button>

        {/* Balance and Recipient */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: '600',
            color: '#d2691e'
          }}>
            {profile?.total_palomas_collected || 0}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#8b4513',
            marginTop: '0.5rem',
            opacity: 0.8
          }}>
            {showCustomRecipient ? `Sending to: ${recipient}` : 'Sending to Casa de Copas'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSend}>
          {/* Amount input and Dove send button row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              min="1"
              max={profile?.total_palomas_collected || 0}
              disabled={sending}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '2px solid #deb887',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                transition: 'border-color 0.2s',
                outline: 'none',
                textAlign: 'center'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d2691e'}
              onBlur={(e) => e.target.style.borderColor = '#deb887'}
            />

            {/* Dove emoji send button */}
            <button
              type="submit"
              disabled={sending || !amount || parseInt(amount) <= 0}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '12px',
                background: sending || !amount || parseInt(amount) <= 0
                  ? 'linear-gradient(45deg, #bdbdbd, #9e9e9e)'
                  : 'linear-gradient(45deg, #d2691e, #cd853f)',
                fontSize: '2rem',
                cursor: sending || !amount || parseInt(amount) <= 0 ? 'not-allowed' : 'pointer',
                boxShadow: sending || !amount || parseInt(amount) <= 0
                  ? 'none'
                  : '0 4px 15px rgba(210, 105, 30, 0.3)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {sending ? '⏳' : '🕊️'}
            </button>
          </div>

          {/* Custom recipient input (only show if toggled) */}
          {showCustomRecipient && (
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.toUpperCase())}
                placeholder="Recipient Username"
                disabled={sending}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #deb887',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
                onFocus={(e) => e.target.style.borderColor = '#d2691e'}
                onBlur={(e) => e.target.style.borderColor = '#deb887'}
              />
            </div>
          )}

          {/* Toggle button for custom recipient */}
          <button
            type="button"
            onClick={() => {
              if (showCustomRecipient) {
                setRecipient('CDC333')
                setShowCustomRecipient(false)
              } else {
                setRecipient('')
                setShowCustomRecipient(true)
              }
            }}
            disabled={sending}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem 1rem',
              border: '1px solid #d2691e',
              borderRadius: '8px',
              background: 'rgba(210, 105, 30, 0.1)',
              color: '#d2691e',
              fontSize: '0.85rem',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.5 : 1,
              transition: 'all 0.2s',
              width: '100%'
            }}
            onMouseOver={(e) => {
              if (!sending) {
                e.target.style.background = 'rgba(210, 105, 30, 0.2)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(210, 105, 30, 0.1)';
            }}
          >
            {showCustomRecipient ? 'Send to Casa de Copas' : 'Send to another user'}
          </button>

          {/* Error message */}
          {error && (
            <div style={{
              background: '#ffebee',
              border: '1px solid #ffcdd2',
              borderRadius: '10px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#c62828',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default SimpleSendPalomas
