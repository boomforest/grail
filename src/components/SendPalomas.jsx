import React, { useState } from 'react'
import { getTarotCardName } from '../utils/transactionUtils'

function SendPalomas({ profile, supabase, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleSendPalomas = async (e) => {
    e.preventDefault()
    
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const palomasToSend = parseInt(amount)
    
    if (palomasToSend > (profile?.dov_balance || 0)) {
      setError('Insufficient Palomas balance')
      return
    }

    setSending(true)
    setError('')

    try {
      // First try to resolve CUP333 alias, fallback to JPR333
      const { data: aliasResult, error: aliasError } = await supabase
        .rpc('resolve_user_alias', { username_input: 'CUP333' })
        .single()

      let adminUserId, adminUsername;
      
      if (!aliasError && aliasResult) {
        adminUserId = aliasResult.resolved_user_id
        adminUsername = aliasResult.resolved_username
      } else {
        // Fallback to direct JPR333 lookup
        const { data: adminProfile, error: adminError } = await supabase
          .from('profiles')
          .select('id, username, dov_balance')
          .eq('username', 'JPR333')
          .single()

        if (adminError || !adminProfile) {
          setError('Casa de Copas account not found')
          setSending(false)
          return
        }
        
        adminUserId = adminProfile.id
        adminUsername = adminProfile.username
      }

      // Get the actual admin profile data
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('id, username, dov_balance')
        .eq('id', adminUserId)
        .single()

      if (adminError || !adminProfile) {
        setError('Casa de Copas account not found')
        setSending(false)
        return
      }

      // Update sender's Paloma balance (deduct)
      const newSenderBalance = (profile.dov_balance || 0) - palomasToSend
      const { error: senderUpdateError } = await supabase
        .from('profiles')
        .update({ dov_balance: newSenderBalance })
        .eq('id', profile.id)

      if (senderUpdateError) {
        console.error('Error updating sender balance:', senderUpdateError)
        setError('Failed to send Palomas')
        setSending(false)
        return
      }

      // Update admin's Paloma balance (add)
      const newAdminBalance = (adminProfile.dov_balance || 0) + palomasToSend
      const { error: adminUpdateError } = await supabase
        .from('profiles')
        .update({ dov_balance: newAdminBalance })
        .eq('id', adminUserId)

      if (adminUpdateError) {
        console.error('Error updating admin balance:', adminUpdateError)
        setError('Failed to send Palomas')
        setSending(false)
        return
      }

      // Record Paloma send transaction
      const { error: sendTransactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: profile.id,
          username: profile.username,
          transaction_type: 'sent',
          paloma_amount: palomasToSend,
          love_amount: 0,
          recipient_id: adminUserId,
          recipient_username: 'CUP333', // Show as Casa de Copas
          user_cup_level: getTarotCardName(profile.tarot_level || 1, profile.username),
          description: `Sent ${palomasToSend} Palomas to Casa de Copas (CUP333)`,
          created_at: new Date().toISOString()
        }])

      if (sendTransactionError) {
        console.error('Error recording send transaction:', sendTransactionError)
      }

      // Calculate and award 33% Love bonus
      const loveBonus = Math.floor(palomasToSend * 0.33)
      if (loveBonus > 0) {
        // Update sender's Love balance
        const newLovBalance = (profile.lov_balance || 0) + loveBonus
        
        const { error: lovUpdateError } = await supabase
          .from('profiles')
          .update({ lov_balance: newLovBalance })
          .eq('id', profile.id)

        if (lovUpdateError) {
          console.error('Error updating Love balance:', lovUpdateError)
        } else {
          // Record Love bonus transaction
          const { error: bonusTransactionError } = await supabase
            .from('transactions')
            .insert([{
              user_id: profile.id,
              username: profile.username,
              transaction_type: 'love_bonus',
              paloma_amount: 0,
              love_amount: loveBonus,
              user_cup_level: getTarotCardName(profile.tarot_level || 1, profile.username),
              description: `33% Love bonus for sending ${palomasToSend} Palomas`,
              created_at: new Date().toISOString()
            }])

          if (bonusTransactionError) {
            console.error('Error recording Love bonus transaction:', bonusTransactionError)
          }
        }
      }

      // Success
      if (onSuccess) {
        onSuccess(`${palomasToSend} Palomas sent successfully! You received ${loveBonus} Love tokens as bonus! 💎`)
      }
      
      // Reset form
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
        maxWidth: '450px',
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

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            <img 
              src={supabase ? 
                supabase.storage.from('tarot-cards').getPublicUrl('DOV.png').data.publicUrl 
                : '/placeholder-dove.png'
              }
              alt="Palomas"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.outerHTML = '🕊️'
              }}
            />
          </div>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#d2691e',
            margin: '0',
            fontWeight: 'normal',
            fontStyle: 'italic'
          }}>
            Send Palomas
          </h2>
          <p style={{
            fontSize: '0.9rem',
            color: '#8b4513',
            marginTop: '0.5rem',
            opacity: 0.8
          }}>
            Send to CUP333 (Casa de Copas) and earn 33% Love bonus!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSendPalomas}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#8b4513',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Amount of Palomas to send:
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              max={profile?.dov_balance || 0}
              disabled={sending}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #deb887',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#d2691e'}
              onBlur={(e) => e.target.style.borderColor = '#deb887'}
            />
            <p style={{
              fontSize: '0.8rem',
              color: '#8b4513',
              marginTop: '0.5rem',
              margin: '0.5rem 0 0'
            }}>
              Your balance: {profile?.total_palomas_collected || 0} Palomas
            </p>
          </div>

          {/* Bonus Info */}
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid #daa520',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#b8860b',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              💎 Love Bonus Preview:
            </div>
            <div style={{
              fontSize: '1.1rem',
              color: '#8b4513',
              fontWeight: '600'
            }}>
              Send {amount || '0'} Palomas → Get {Math.floor((parseInt(amount) || 0) * 0.33)} Love tokens!
            </div>
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
                border: '2px solid #d2691e',
                borderRadius: '12px',
                background: 'transparent',
                color: '#d2691e',
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
              disabled={sending || !amount || parseInt(amount) <= 0}
              style={{
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '12px',
                background: sending || !amount || parseInt(amount) <= 0
                  ? 'linear-gradient(45deg, #bdbdbd, #9e9e9e)'
                  : 'linear-gradient(45deg, #d2691e, #cd853f)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: sending || !amount || parseInt(amount) <= 0 ? 'not-allowed' : 'pointer',
                boxShadow: sending || !amount || parseInt(amount) <= 0
                  ? 'none'
                  : '0 4px 15px rgba(210, 105, 30, 0.3)',
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
                  Send Palomas
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

export default SendPalomas