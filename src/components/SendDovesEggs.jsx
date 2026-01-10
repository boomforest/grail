import React, { useState } from 'react'
import { X, HelpCircle } from 'lucide-react'

function SendDovesEggs({ profile, supabase, onClose, onSuccess, transferType }) {
  // transferType can be 'DOVES' or 'EGGS', passed from PalomasMenu
  const [sendType, setSendType] = useState(
    transferType === 'DOVES' ? 'doves' : transferType === 'EGGS' ? 'eggs' : null
  )
  const [showExplainer, setShowExplainer] = useState(null)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [workDescription, setWorkDescription] = useState('')
  const [deliveryDays, setDeliveryDays] = useState(30)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Get background image
  const getBackgroundImage = () => {
    if (!supabase) return null
    const isMobile = window.innerWidth <= 768
    const filename = isMobile ? 'backgroundmobile.png' : 'backgrounddesktop.png'
    const { data: { publicUrl } } = supabase.storage
      .from('tarot-cards')
      .getPublicUrl(filename)
    return publicUrl
  }

  const backgroundUrl = getBackgroundImage()

  const handleSendDoves = async () => {
    if (!recipient || !amount) {
      setError('Please fill in recipient and amount')
      return
    }

    const recipientUsername = recipient.trim().toUpperCase()
    const sendAmount = parseInt(amount)

    if (sendAmount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (sendAmount > profile.dov_balance) {
      setError('Insufficient Palomas')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Find recipient
      const { data: recipientProfile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', recipientUsername)
        .single()

      if (findError || !recipientProfile) {
        setError('Recipient not found')
        setIsLoading(false)
        return
      }

      if (recipientProfile.id === profile.id) {
        setError('Cannot send to yourself')
        setIsLoading(false)
        return
      }

      // FIFO: Get sender's active transactions ordered by received_at
      const { data: senderTransactions, error: txError } = await supabase
        .from('paloma_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_expired', false)
        .gte('expires_at', new Date().toISOString())
        .order('received_at', { ascending: true })

      if (txError) {
        console.error('Error fetching transactions:', txError)
        setError('Transfer failed')
        setIsLoading(false)
        return
      }

      // Deduct from oldest transactions first (FIFO)
      let remaining = sendAmount
      for (const tx of senderTransactions) {
        if (remaining <= 0) break

        const deductAmount = Math.min(remaining, tx.amount)

        if (tx.amount === deductAmount) {
          await supabase
            .from('paloma_transactions')
            .delete()
            .eq('id', tx.id)
        } else {
          await supabase
            .from('paloma_transactions')
            .update({ amount: tx.amount - deductAmount })
            .eq('id', tx.id)
        }

        remaining -= deductAmount
      }

      // Create new transaction for recipient (fresh 1-year expiration)
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)

      await supabase
        .from('paloma_transactions')
        .insert([{
          user_id: recipientProfile.id,
          amount: sendAmount,
          transaction_type: 'received',
          source: `doves_from_${profile.username}`,
          received_at: new Date().toISOString(),
          expires_at: expirationDate.toISOString(),
          metadata: {
            sender_username: profile.username,
            sender_id: profile.id,
            send_type: 'doves'
          }
        }])

      // Update balances
      await supabase
        .from('profiles')
        .update({
          dov_balance: profile.dov_balance - sendAmount,
          last_status_update: new Date().toISOString()
        })
        .eq('id', profile.id)

      await supabase
        .from('profiles')
        .update({
          dov_balance: recipientProfile.dov_balance + sendAmount,
          last_status_update: new Date().toISOString()
        })
        .eq('id', recipientProfile.id)

      onSuccess(`Sent ${sendAmount} Doves to ${recipientUsername} 🕊️`)
      onClose()
    } catch (err) {
      console.error('Send Doves error:', err)
      setError('Transfer failed: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEggs = async () => {
    if (!recipient || !amount || !workDescription) {
      setError('Please fill in all fields')
      return
    }

    const recipientUsername = recipient.trim().toUpperCase()
    const totalAmount = parseInt(amount)

    if (totalAmount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (totalAmount > profile.dov_balance) {
      setError('Insufficient Palomas')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Find recipient
      const { data: recipientProfile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', recipientUsername)
        .single()

      if (findError || !recipientProfile) {
        setError('Recipient not found')
        setIsLoading(false)
        return
      }

      if (recipientProfile.id === profile.id) {
        setError('Cannot send to yourself')
        setIsLoading(false)
        return
      }

      // Calculate split: 50% hatches immediately, 50% in escrow
      const hatchedAmount = Math.floor(totalAmount / 2)
      const pendingAmount = totalAmount - hatchedAmount

      // FIFO: Deduct full amount from sender
      const { data: senderTransactions, error: txError } = await supabase
        .from('paloma_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_expired', false)
        .gte('expires_at', new Date().toISOString())
        .order('received_at', { ascending: true })

      if (txError) {
        console.error('Error fetching transactions:', txError)
        setError('Transfer failed')
        setIsLoading(false)
        return
      }

      const usedTransactionIds = []
      let remaining = totalAmount

      for (const tx of senderTransactions) {
        if (remaining <= 0) break

        usedTransactionIds.push(tx.id)
        const deductAmount = Math.min(remaining, tx.amount)

        if (tx.amount === deductAmount) {
          await supabase
            .from('paloma_transactions')
            .delete()
            .eq('id', tx.id)
        } else {
          await supabase
            .from('paloma_transactions')
            .update({ amount: tx.amount - deductAmount })
            .eq('id', tx.id)
        }

        remaining -= deductAmount
      }

      // Create transaction for hatched amount (immediate)
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)

      await supabase
        .from('paloma_transactions')
        .insert([{
          user_id: recipientProfile.id,
          amount: hatchedAmount,
          transaction_type: 'received',
          source: `eggs_hatched_from_${profile.username}`,
          received_at: new Date().toISOString(),
          expires_at: expirationDate.toISOString(),
          metadata: {
            sender_username: profile.username,
            sender_id: profile.id,
            send_type: 'eggs_hatched',
            total_eggs_amount: totalAmount
          }
        }])

      // Create eggs_transaction for escrow
      const expectedDelivery = new Date()
      expectedDelivery.setDate(expectedDelivery.getDate() + deliveryDays)

      await supabase
        .from('eggs_transactions')
        .insert([{
          sender_id: profile.id,
          recipient_id: recipientProfile.id,
          total_amount: totalAmount,
          hatched_amount: hatchedAmount,
          pending_amount: pendingAmount,
          status: 'pending',
          work_description: workDescription,
          delivery_window_days: deliveryDays,
          expected_delivery_date: expectedDelivery.toISOString(),
          source_transaction_ids: usedTransactionIds,
          metadata: {
            sender_username: profile.username,
            recipient_username: recipientProfile.username
          }
        }])

      // Update sender's balance (full amount deducted)
      await supabase
        .from('profiles')
        .update({
          dov_balance: profile.dov_balance - totalAmount,
          eggs_pending_sent: (profile.eggs_pending_sent || 0) + pendingAmount,
          last_status_update: new Date().toISOString()
        })
        .eq('id', profile.id)

      // Update recipient's balance (only hatched amount) and pending received
      await supabase
        .from('profiles')
        .update({
          dov_balance: recipientProfile.dov_balance + hatchedAmount,
          eggs_pending_received: (recipientProfile.eggs_pending_received || 0) + pendingAmount,
          last_status_update: new Date().toISOString()
        })
        .eq('id', recipientProfile.id)

      onSuccess(`Sent ${totalAmount} Eggs to ${recipientUsername} 🥚\n${hatchedAmount} hatched immediately, ${pendingAmount} pending work approval`)
      onClose()
    } catch (err) {
      console.error('Send Eggs error:', err)
      setError('Transfer failed: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial choice screen
  if (!sendType) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: backgroundUrl ? `url(${backgroundUrl})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>
              Send Palomas
            </h2>
            <button onClick={onClose} style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem'
            }}>
              <X size={24} color="#7f8c8d" />
            </button>
          </div>

          <p style={{
            fontSize: '0.95rem',
            color: '#555',
            marginBottom: '2rem',
            lineHeight: '1.5'
          }}>
            Choose how to send value to another person
          </p>

          {/* Send Doves Option */}
          <div
            onClick={() => setSendType('doves')}
            style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              border: '2px solid #2196f3',
              borderRadius: '15px',
              padding: '1.5rem',
              marginBottom: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🕊️</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1976d2', marginBottom: '0.5rem' }}>
                  Send Doves
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>
                  Instant, complete transfer for fixed things
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowExplainer('doves')
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <HelpCircle size={20} color="#1976d2" />
              </button>
            </div>
          </div>

          {/* Send Eggs Option */}
          <div
            onClick={() => setSendType('eggs')}
            style={{
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              border: '2px solid #ff9800',
              borderRadius: '15px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🥚</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f57c00', marginBottom: '0.5rem' }}>
                  Send Eggs
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>
                  50% now, 50% when work is approved
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowExplainer('eggs')
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <HelpCircle size={20} color="#f57c00" />
              </button>
            </div>
          </div>
        </div>

        {/* Explainer Modal */}
        {showExplainer && (
          <div
            onClick={() => setShowExplainer(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              padding: '2rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '15px',
                padding: '2rem',
                maxWidth: '450px',
                width: '100%'
              }}
            >
              {showExplainer === 'doves' ? (
                <>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1976d2', marginBottom: '1rem' }}>
                    🕊️ Send Doves
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', marginBottom: '1rem' }}>
                    Doves arrive instantly in the recipient's account.
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', marginBottom: '1rem' }}>
                    Use these for <strong>fixed, objective things</strong> like food, merch, studio time, room bookings, or anything that already exists.
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6' }}>
                    The transaction is immediate and complete.
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f57c00', marginBottom: '1rem' }}>
                    🥚 Send Eggs
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', marginBottom: '1rem' }}>
                    Eggs are for <strong>creative work in progress</strong>.
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', marginBottom: '1rem' }}>
                    When you send Eggs, the full amount leaves your account immediately. <strong>Half hatches right away</strong> in the recipient's account. The other half hatches only when you approve the work that was agreed upon.
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#777', lineHeight: '1.5', fontStyle: 'italic' }}>
                    This creates a clean agreement structure for interpretive services without legal friction.
                  </p>
                </>
              )}
              <button
                onClick={() => setShowExplainer(null)}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  padding: '0.75rem',
                  background: showExplainer === 'doves' ? '#2196f3' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Send Doves Form
  if (sendType === 'doves') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: backgroundUrl ? `url(${backgroundUrl})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        overflowY: 'auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}>
          {/* Info button - bottom left */}
          <button
            onClick={() => setShowExplainer('doves')}
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid #2196f3',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#2196f3',
              fontSize: '1.2rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(33, 150, 243, 0.2)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(33, 150, 243, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ℹ️
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1976d2' }}>
              🕊️ Send Doves
            </h2>
            <button onClick={() => setSendType(null)} style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              fontSize: '0.9rem',
              color: '#7f8c8d'
            }}>
              ← Back
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem' }}>
            Instant, complete transfer
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
              Recipient Username
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.toUpperCase())}
              placeholder="USERNAME"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '1rem',
                textTransform: 'uppercase'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '1rem'
              }}
            />
            <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '0.5rem' }}>
              Your balance: {profile?.dov_balance || 0} Palomas
            </div>
          </div>

          {error && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSendDoves}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem',
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
            }}
          >
            {isLoading ? 'Sending...' : 'Send Doves 🕊️'}
          </button>
        </div>
      </div>
    )
  }

  // Send Eggs Form
  if (sendType === 'eggs') {
    const hatchedAmount = amount ? Math.floor(parseInt(amount) / 2) : 0
    const pendingAmount = amount ? parseInt(amount) - hatchedAmount : 0

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: backgroundUrl ? `url(${backgroundUrl})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        overflowY: 'auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}>
          {/* Info button - bottom left */}
          <button
            onClick={() => setShowExplainer('eggs')}
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid #ff9800',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ff9800',
              fontSize: '1.2rem',
              transition: 'all 0.2s',
              zIndex: 10
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 152, 0, 0.2)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 152, 0, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ℹ️
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f57c00' }}>
              🥚 Send Eggs
            </h2>
            <button onClick={() => setSendType(null)} style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              fontSize: '0.9rem',
              color: '#7f8c8d'
            }}>
              ← Back
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem' }}>
            50% hatches now, 50% when work is approved
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
              Recipient Username
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.toUpperCase())}
              placeholder="USERNAME"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '1rem',
                textTransform: 'uppercase'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
              Total Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '1rem'
              }}
            />
            <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '0.5rem' }}>
              Your balance: {profile?.dov_balance || 0} Palomas
            </div>
            {amount && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: '#fff3e0',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#555'
              }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  ✅ <strong>{hatchedAmount}</strong> hatches immediately
                </div>
                <div>
                  ⏳ <strong>{pendingAmount}</strong> pending work approval
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
              Work Description
            </label>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="What work is being agreed upon? (e.g., 'Logo design for Casa de Copas', 'Mix and master 3 tracks')"
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
              Delivery Window
            </label>
            <select
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '1rem'
              }}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days (recommended)</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {error && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSendEggs}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem',
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)'
            }}
          >
            {isLoading ? 'Sending...' : 'Send Eggs 🥚'}
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default SendDovesEggs
