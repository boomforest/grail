import React, { useState } from 'react'

function SimpleSendPalomas({ profile, supabase, onClose, onSuccess }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async (e) => {
    e.preventDefault()
    
    if (!recipient.trim()) {
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
        .eq('username', recipient.trim().toUpperCase())
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

      // Success
      if (onSuccess) {
        onSuccess(`${palomasToSend} Palomas sent to ${recipientProfile.username}!`)
      }
      
      // Reset form
      setRecipient('')
      setAmount('')
      
      // Close after a short delay
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err) {
      console.error('Error:', err)
      setError('Something went wrong')
      setSending(false)
    }
  }

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

        {/* Balance Only */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: '600',
            color: '#d2691e'
          }}>
            {profile?.total_palomas_collected || 0}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSend}>
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

          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              min="1"
              max={profile?.total_palomas_collected || 0}
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
                textAlign: 'center'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d2691e'}
              onBlur={(e) => e.target.style.borderColor = '#deb887'}
            />
          </div>

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

          {/* Send Button */}
          <button
            type="submit"
            disabled={sending || !recipient || !amount || parseInt(amount) <= 0}
            style={{
              width: '100%',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '12px',
              background: sending || !recipient || !amount || parseInt(amount) <= 0
                ? 'linear-gradient(45deg, #bdbdbd, #9e9e9e)'
                : 'linear-gradient(45deg, #d2691e, #cd853f)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: sending || !recipient || !amount || parseInt(amount) <= 0 ? 'not-allowed' : 'pointer',
              boxShadow: sending || !recipient || !amount || parseInt(amount) <= 0
                ? 'none'
                : '0 4px 15px rgba(210, 105, 30, 0.3)',
              transition: 'all 0.3s'
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SimpleSendPalomas