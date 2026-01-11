import { useState, useEffect, useCallback } from 'react'

// Cache-bust: v2.0 - Fixed increment_balance issue
function PalomasHistory({ profile, supabase, onClose }) {
  const [transactions, setTransactions] = useState([])
  const [eggsInFlight, setEggsInFlight] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTransactions = useCallback(async () => {
    if (!profile?.id || !supabase) return

    setLoading(true)
    try {
      // Load Doves received (exclude 'sent' type transactions)
      const { data: dovesReceivedData, error: dovesReceivedError } = await supabase
        .from('paloma_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .neq('transaction_type', 'sent')
        .order('created_at', { ascending: false })
        .limit(50)

      if (dovesReceivedError) {
        console.error('Error loading received paloma transactions:', dovesReceivedError)
      }

      // Load Doves sent (paloma_transactions in sender's own account)
      const { data: dovesSentData, error: dovesSentError } = await supabase
        .from('paloma_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'sent')
        .order('created_at', { ascending: false })
        .limit(50)

      if (dovesSentError) {
        console.error('Error loading sent paloma transactions:', dovesSentError)
      }

      // Load completed Eggs transactions
      const { data: eggsData, error: eggsError } = await supabase
        .from('eggs_transactions')
        .select(`
          *,
          sender:profiles!eggs_transactions_sender_id_fkey(username),
          recipient:profiles!eggs_transactions_recipient_id_fkey(username)
        `)
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50)

      if (eggsError) {
        console.error('Error loading eggs transactions:', eggsError)
      }

      // Combine and sort all transactions
      const allTransactions = [
        ...(dovesReceivedData || []).map(t => ({ ...t, type: 'doves', direction: 'received' })),
        ...(dovesSentData || []).map(t => ({ ...t, type: 'doves', direction: 'sent' })),
        ...(eggsData || []).map(t => ({ ...t, type: 'eggs' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setTransactions(allTransactions)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.username, supabase])

  const loadEggsInFlight = useCallback(async () => {
    if (!profile?.id || !supabase) return

    try {
      const { data, error } = await supabase
        .from('eggs_transactions')
        .select(`
          *,
          sender:profiles!eggs_transactions_sender_id_fkey(username),
          recipient:profiles!eggs_transactions_recipient_id_fkey(username)
        `)
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading hatching eggs:', error)
      } else {
        setEggsInFlight(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }, [profile?.id, supabase])

  useEffect(() => {
    loadTransactions()
    loadEggsInFlight()
  }, [loadTransactions, loadEggsInFlight])

  const handleMarkDone = async (eggId, recipientId, pendingAmount) => {
    try {
      // Use the database function to release the payment with SECURITY DEFINER privileges
      const { error } = await supabase
        .rpc('release_eggs_payment', { p_egg_id: eggId })

      if (error) {
        console.error('Error releasing eggs payment (checking if succeeded anyway):', error)
        // Check if egg was actually updated by verifying its status
        const { data: eggCheck } = await supabase
          .from('eggs_transactions')
          .select('status')
          .eq('id', eggId)
          .single()

        // If status is approved, the transaction succeeded despite the error - don't throw
        if (eggCheck?.status === 'approved') {
          console.log('Transaction succeeded despite RPC error')
        } else {
          throw error
        }
      }

      // Update sender's pending count (reduce eggs_pending_sent)
      const { error: senderError } = await supabase
        .from('profiles')
        .update({
          eggs_pending_sent: Math.max(0, (profile.eggs_pending_sent || 0) - pendingAmount),
          last_status_update: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (senderError) {
        console.error('Error updating sender pending:', senderError)
        // Don't throw - this is just a counter update
      }

      // Success! Reload eggs in flight and transactions
      loadEggsInFlight()
      loadTransactions()
    } catch (err) {
      console.error('Error marking egg as done:', err)
      alert('Failed to release payment. Please try again.')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTransactionDisplay = (transaction) => {
    // Handle Doves transactions (paloma_transactions)
    if (transaction.type === 'doves') {
      const source = transaction.source || ''

      // Handle sent Doves
      if (transaction.direction === 'sent' || transaction.transaction_type === 'sent') {
        // Extract recipient username from source (transfer_to_USERNAME) or metadata
        const recipientUsername = transaction.metadata?.recipient_username
          || source.replace('transfer_to_', '')
          || 'Unknown'

        return {
          type: `Sent ${transaction.amount} Dov${transaction.amount !== 1 ? 's' : ''}`,
          amount: `-${transaction.amount}`,
          otherParty: `@${recipientUsername}`,
          color: '#dc3545',
          icon: '🕊️'
        }
      }

      // Handle received Doves
      const isReceived = source.includes('transfer_from_') || source.includes('eggs_approved_from_') || source.includes('eggs_hatched_from_')

      if (isReceived) {
        const senderUsername = source
          .replace('transfer_from_', '')
          .replace('eggs_approved_from_', '')
          .replace('eggs_hatched_from_', '')
        const isFromEggs = source.includes('eggs_approved') || source.includes('eggs_hatched')
        const date = formatDate(transaction.created_at)

        return {
          type: `Received ${transaction.amount} Dov${transaction.amount !== 1 ? 's' : ''}`,
          amount: `+${transaction.amount}`,
          otherParty: isFromEggs ? `@${senderUsername} (from Eggs ${date})` : `@${senderUsername}`,
          color: '#28a745',
          icon: '🕊️'
        }
      }

      return {
        type: `Received ${transaction.amount} Dov${transaction.amount !== 1 ? 's' : ''}`,
        amount: `+${transaction.amount}`,
        otherParty: source || 'Casa de Copas',
        color: '#28a745',
        icon: '📥'
      }
    }

    // Handle Eggs transactions (eggs_transactions) - only show hatched amount
    if (transaction.type === 'eggs') {
      const isSender = transaction.sender_id === profile.id
      const otherParty = isSender ? transaction.recipient?.username : transaction.sender?.username
      const amount = isSender ? transaction.hatched_amount : transaction.hatched_amount
      const date = formatDate(transaction.created_at)

      return {
        type: isSender ? `Sent ${amount} Dov${amount !== 1 ? 's' : ''}` : `Received ${amount} Dov${amount !== 1 ? 's' : ''}`,
        amount: isSender ? `-${amount}` : `+${amount}`,
        otherParty: `@${otherParty} (from Eggs sent ${date})`,
        color: isSender ? '#dc3545' : '#28a745',
        icon: '🕊️'
      }
    }

    return {
      type: 'Transaction',
      amount: transaction.amount || 0,
      otherParty: 'Unknown',
      color: '#6c757d',
      icon: '•'
    }
  }

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
      zIndex: 10002,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fff, #f8f8f8)',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '3px solid #d2691e',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: '#d2691e',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            Transaction History
          </h2>
        </div>

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
            transition: 'opacity 0.2s',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}
          onMouseOver={(e) => e.target.style.opacity = '1'}
          onMouseOut={(e) => e.target.style.opacity = '0.7'}
        >
          ×
        </button>

        {/* Transactions List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginTop: '1rem'
        }}>
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#8b4513'
            }}>
              Loading transactions...
            </div>
          ) : (
            <>
              {/* Hatching Eggs Section */}
              {eggsInFlight.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#ff9800',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid #ddd',
                    paddingBottom: '0.5rem'
                  }}>
                    Hatching Eggs
                  </h3>
                  {eggsInFlight.map((egg) => {
                    const isSender = egg.sender_id === profile.id
                    const otherParty = isSender ? egg.recipient?.username : egg.sender?.username

                    return (
                      <div
                        key={egg.id}
                        style={{
                          padding: '0.75rem 0',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.9rem' }}>
                          <span style={{ color: '#666' }}>
                            {isSender ? 'To' : 'From'} @{otherParty} - {egg.pending_amount} Dovs pending
                          </span>
                        </div>
                        {isSender && (
                          <button
                            onClick={() => handleMarkDone(egg.id, egg.recipient_id, egg.pending_amount)}
                            style={{
                              background: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            Done
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Completed Transactions Section */}
              {transactions.length === 0 && eggsInFlight.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#999'
                }}>
                  No transactions yet
                </div>
              ) : transactions.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#8b4513',
                    marginBottom: '0.75rem',
                    borderBottom: '1px solid #ddd',
                    paddingBottom: '0.5rem'
                  }}>
                    Completed Transactions
                  </h3>
                  {transactions.map((transaction) => {
                    const display = getTransactionDisplay(transaction)
                    return (
                      <div
                        key={transaction.id}
                        style={{
                          padding: '0.75rem 0',
                          borderBottom: '1px solid #eee',
                          fontSize: '0.9rem'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem'
                        }}>
                          <span style={{ color: display.color, fontWeight: '500' }}>
                            {display.type}
                          </span>
                          <span style={{ color: display.color, fontWeight: '500' }}>
                            {display.amount}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#666'
                        }}>
                          {display.otherParty} • {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PalomasHistory
