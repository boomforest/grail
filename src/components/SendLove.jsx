import React, { useState, useEffect } from 'react'

function SendLove({ profile, supabase, onClose, onSuccess }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [recentRecipients, setRecentRecipients] = useState([])


  // Fetch recent love recipients
  useEffect(() => {
    const fetchRecentRecipients = async () => {
      if (!supabase || !profile) return

      try {
        // For now, skip fetching recent recipients due to database schema issues
        // This feature can be re-enabled once the schema is updated
        /*
        const { data, error } = await supabase
          .from('release_notifications')
          .select('username, created_at')
          .eq('type', 'love')
          .eq('from_username', profile.username)
          .order('created_at', { ascending: false })
          .limit(5)
        */
        const data = null
        const error = null

        if (!error && data) {
          // Get unique recipients (in case admin sent multiple to same person)
          const uniqueRecipients = []
          const seen = new Set()
          
          for (const item of data) {
            if (!seen.has(item.username)) {
              seen.add(item.username)
              uniqueRecipients.push(item.username)
            }
          }
          
          setRecentRecipients(uniqueRecipients.slice(0, 5))
        }
      } catch (err) {
        console.error('Error fetching recent recipients:', err)
      }
    }

    fetchRecentRecipients()
  }, [supabase, profile])

  const handleSendLove = async (e) => {
    e.preventDefault()
    
    if (!recipient.trim()) {
      setError('Please enter a username')
      return
    }

    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setSending(true)
    setError('')

    try {
      // Check if recipient exists
      const { data: recipientProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', recipient.trim())
        .single()

      if (fetchError || !recipientProfile) {
        setError('User not found')
        setSending(false)
        return
      }

      if (recipientProfile.username.toUpperCase() === profile.username.toUpperCase()) {
        setError("You can't send love to yourself!")
        setSending(false)
        return
      }

      // Create a love notification with amount
      const loveNotification = {
        user_id: recipientProfile.id,
        username: recipientProfile.username,
        token_type: 'LOVE',
        amount: parseInt(amount),
        reason: `${profile.username} sent you ${amount} Love!`,
        created_at: new Date().toISOString()
      }

      // Insert the love notification
      const { error: insertError } = await supabase
        .from('release_notifications')
        .insert([loveNotification])

      if (insertError) {
        console.error('Error sending love:', insertError)
        setError('Failed to send love')
        setSending(false)
        return
      }

      // Update recipient's LOV balance
      const { data: currentProfile, error: fetchBalanceError } = await supabase
        .from('profiles')
        .select('lov_balance')
        .eq('id', recipientProfile.id)
        .single()

      if (fetchBalanceError) {
        console.error('Error fetching recipient LOV balance:', fetchBalanceError)
        setError('Failed to update balance')
        setSending(false)
        return
      }

      const newLovBalance = (currentProfile.lov_balance || 0) + parseInt(amount)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ lov_balance: newLovBalance })
        .eq('id', recipientProfile.id)

      if (updateError) {
        console.error('Error updating balance:', updateError)
        setError('Failed to update balance')
        setSending(false)
        return
      }

      // Record the transaction in love_transactions table
      const { error: transactionError } = await supabase
        .from('love_transactions')
        .insert([
          {
            sender_id: profile.id,
            sender_username: profile.username,
            recipient_id: recipientProfile.id,
            recipient_username: recipientProfile.username,
            amount: parseInt(amount),
            transaction_type: 'sent',
            description: `Sent ${amount} Love to ${recipientProfile.username}`
          }
        ])

      if (transactionError) {
        console.error('Error recording transaction:', transactionError)
        // Don't fail the whole operation if just the transaction record fails
      }

      // Success
      if (onSuccess) {
        onSuccess(`${amount} Love sent to ${recipientProfile.username}!`)
      }
      
      // Reset form
      setRecipient('')
      setAmount('')
      
      // Close after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)

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
        background: 'linear-gradient(135deg, #fff0f5, #ffe0ec)',
        borderRadius: '25px',
        padding: '2rem',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(233, 30, 99, 0.3)',
        border: '3px solid #e91e63',
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
            color: '#e91e63',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '1'}
          onMouseOut={(e) => e.target.style.opacity = '0.7'}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#e91e63',
            margin: '0',
            fontWeight: 'normal',
            fontStyle: 'italic'
          }}>
            Send Love
          </h2>
          <p style={{
            fontSize: '0.9rem',
            color: '#ad1457',
            marginTop: '0.5rem',
            opacity: 0.8
          }}>
            Send love tokens to a community member
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSendLove}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#ad1457',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Send love to:
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter username"
              disabled={sending}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #f8bbd0',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#e91e63'}
              onBlur={(e) => e.target.style.borderColor = '#f8bbd0'}
            />
          </div>

          {/* Recent Recipients */}
          {recentRecipients.length > 0 && (
            <div style={{ 
              marginBottom: '1.5rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '12px',
              border: '1px solid #f8bbd0'
            }}>
              <div style={{
                fontSize: '0.8rem',
                color: '#ad1457',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Recent recipients:
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                {recentRecipients.map((username, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setRecipient(username)
                      setError('')
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: 'linear-gradient(45deg, #fce4ec, #f8bbd0)',
                      border: '1px solid #e91e63',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      color: '#ad1457',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'linear-gradient(45deg, #e91e63, #f06292)'
                      e.target.style.color = 'white'
                      e.target.style.transform = 'scale(1.05)'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'linear-gradient(45deg, #fce4ec, #f8bbd0)'
                      e.target.style.color = '#ad1457'
                      e.target.style.transform = 'scale(1)'
                    }}
                  >
                    {username}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#ad1457',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Amount of Love to send:
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              disabled={sending}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #f8bbd0',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#e91e63'}
              onBlur={(e) => e.target.style.borderColor = '#f8bbd0'}
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

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #e91e63',
                borderRadius: '12px',
                background: 'transparent',
                color: '#e91e63',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              style={{
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '12px',
                background: sending 
                  ? 'linear-gradient(45deg, #bdbdbd, #9e9e9e)'
                  : 'linear-gradient(45deg, #e91e63, #f06292)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: sending ? 'not-allowed' : 'pointer',
                boxShadow: sending 
                  ? 'none'
                  : '0 4px 15px rgba(233, 30, 99, 0.3)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {sending ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></span>
                  Sending...
                </>
              ) : (
                <>
                  Send Love
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* Animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default SendLove