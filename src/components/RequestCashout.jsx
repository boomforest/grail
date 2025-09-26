import React, { useState } from 'react'
import { getTarotCardName, getCashOutTaxRate, calculateCashOut } from '../utils/transactionUtils'

function RequestCashout({ profile, supabase, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [email, setEmail] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState('')

  // Calculate cash-out details
  const palomasToRedeem = parseInt(amount) || 0
  const cashOutDetails = palomasToRedeem > 0 ? 
    calculateCashOut(palomasToRedeem, profile?.tarot_level || 1, profile?.username) : 
    { taxRate: 0, taxAmount: 0, cashAmount: 0, payoutPercentage: 0 }

  const handleRequestCashout = async (e) => {
    e.preventDefault()
    
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    const palomasToRedeem = parseInt(amount)
    
    if (palomasToRedeem > (profile?.dov_balance || 0)) {
      setError('Insufficient Palomas balance')
      return
    }

    if (palomasToRedeem < 10) {
      setError('Minimum cashout amount is 10 Palomas')
      return
    }

    setRequesting(true)
    setError('')

    try {
      // Update user's Paloma balance (deduct)
      const newBalance = (profile.dov_balance || 0) - palomasToRedeem
      const { error: balanceUpdateError } = await supabase
        .from('profiles')
        .update({ dov_balance: newBalance })
        .eq('id', profile.id)

      if (balanceUpdateError) {
        console.error('Error updating balance:', balanceUpdateError)
        setError('Failed to process cashout request')
        setRequesting(false)
        return
      }

      // Record cashout transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: profile.id,
          username: profile.username,
          transaction_type: 'cashed_out',
          paloma_amount: -palomasToRedeem, // Negative because it's leaving their account
          love_amount: 0,
          tax_rate: cashOutDetails.taxRate,
          user_cup_level: getTarotCardName(profile.tarot_level || 1, profile.username),
          description: `Cashout request: ${palomasToRedeem} Palomas → $${cashOutDetails.cashAmount} (${(cashOutDetails.payoutPercentage).toFixed(1)}% after ${(cashOutDetails.taxRate * 100).toFixed(1)}% tax) to ${email}`,
          created_at: new Date().toISOString()
        }])

      if (transactionError) {
        console.error('Error recording transaction:', transactionError)
      }

      // Create a cashout request record (for admin to process)
      const { error: requestError } = await supabase
        .from('cashout_requests')
        .insert([{
          user_id: profile.id,
          username: profile.username,
          email: email,
          paloma_amount: palomasToRedeem,
          cash_amount: cashOutDetails.cashAmount,
          tax_rate: cashOutDetails.taxRate,
          tax_amount: cashOutDetails.taxAmount,
          status: 'pending',
          user_cup_level: getTarotCardName(profile.tarot_level || 1, profile.username),
          created_at: new Date().toISOString()
        }])

      if (requestError) {
        console.error('Error creating cashout request:', requestError)
        setError('Failed to create cashout request')
        setRequesting(false)
        return
      }

      // Success
      if (onSuccess) {
        onSuccess(`Cashout request submitted! You'll receive $${cashOutDetails.cashAmount} at ${email} within 10 business days. 💰`)
      }
      
      // Reset form
      setAmount('')
      setEmail('')
      
      // Close after a short delay
      setTimeout(() => {
        onClose()
      }, 3000)

    } catch (err) {
      console.error('Error:', err)
      setError('Something went wrong')
      setRequesting(false)
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
        background: 'linear-gradient(135deg, #f0f8ff, #e6f3ff)',
        borderRadius: '25px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(70, 130, 180, 0.3)',
        border: '3px solid #4682b4',
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
            color: '#4682b4',
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
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💰</div>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#4682b4',
            margin: '0',
            fontWeight: 'normal',
            fontStyle: 'italic'
          }}>
            Request Cashout
          </h2>
          <p style={{
            fontSize: '0.9rem',
            color: '#2f4f4f',
            marginTop: '0.5rem',
            opacity: 0.8
          }}>
            Convert your Palomas to cash via PayPal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRequestCashout}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2f4f4f',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Amount of Palomas to cash out:
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (minimum 10)"
              min="10"
              max={profile?.dov_balance || 0}
              disabled={requesting}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #b0d4f1',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4682b4'}
              onBlur={(e) => e.target.style.borderColor = '#b0d4f1'}
            />
            <p style={{
              fontSize: '0.8rem',
              color: '#2f4f4f',
              marginTop: '0.5rem',
              margin: '0.5rem 0 0'
            }}>
              Your balance: {profile?.dov_balance || 0} Palomas
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2f4f4f',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              PayPal email address:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={requesting}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #b0d4f1',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4682b4'}
              onBlur={(e) => e.target.style.borderColor = '#b0d4f1'}
            />
          </div>

          {/* Cashout Calculation */}
          {palomasToRedeem >= 10 && (
            <div style={{
              background: 'rgba(70, 130, 180, 0.1)',
              border: '1px solid #4682b4',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#2f4f4f',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                💰 Cashout Calculation:
              </div>
              <div style={{ fontSize: '0.9rem', color: '#2f4f4f', lineHeight: '1.4' }}>
                <div>• {palomasToRedeem} Palomas</div>
                <div>• Tax ({(cashOutDetails.taxRate * 100).toFixed(1)}%): -${cashOutDetails.taxAmount}</div>
                <div>• <strong>You receive: ${cashOutDetails.cashAmount}</strong></div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                  Cup level: {getTarotCardName(profile?.tarot_level || 1, profile?.username)}
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: '#856404',
              lineHeight: '1.4'
            }}>
              <strong>⚠️ Important:</strong><br/>
              • Cashouts may take up to 10 business days to process<br/>
              • Minimum cashout amount is 10 Palomas<br/>
              • Tax rates decrease as you progress through cup levels<br/>
              • Funds will be sent to your PayPal email address<br/>
              • This action cannot be undone once submitted
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
              disabled={requesting}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #4682b4',
                borderRadius: '12px',
                background: 'transparent',
                color: '#4682b4',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: requesting ? 'not-allowed' : 'pointer',
                opacity: requesting ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={requesting || !amount || parseInt(amount) < 10 || !email}
              style={{
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '12px',
                background: requesting || !amount || parseInt(amount) < 10 || !email
                  ? 'linear-gradient(45deg, #bdbdbd, #9e9e9e)'
                  : 'linear-gradient(45deg, #4682b4, #5f9ea0)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: requesting || !amount || parseInt(amount) < 10 || !email ? 'not-allowed' : 'pointer',
                boxShadow: requesting || !amount || parseInt(amount) < 10 || !email
                  ? 'none'
                  : '0 4px 15px rgba(70, 130, 180, 0.3)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {requesting ? (
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
                  Processing...
                </>
              ) : (
                <>
                  Request Cashout
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

export default RequestCashout