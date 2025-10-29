import { useState, useEffect } from 'react'

function PalomasHistory({ profile, supabase, onClose }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile && supabase) {
      loadTransactions()
    }
  }, [profile, supabase])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`user_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading transactions:', error)
      } else {
        setTransactions(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
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
    const isSender = transaction.user_id === profile.id
    const isReceiver = transaction.recipient_id === profile.id

    if (transaction.transaction_type === 'sent' && isSender) {
      return {
        type: 'Sent',
        amount: `-${transaction.paloma_amount}`,
        otherParty: transaction.recipient_username || 'Unknown',
        color: '#dc3545',
        icon: '↑'
      }
    } else if (transaction.transaction_type === 'received' || (transaction.transaction_type === 'sent' && isReceiver)) {
      return {
        type: 'Received',
        amount: `+${transaction.paloma_amount}`,
        otherParty: transaction.username,
        color: '#28a745',
        icon: '↓'
      }
    } else if (transaction.transaction_type === 'purchased') {
      return {
        type: 'Purchased',
        amount: `+${transaction.paloma_amount}`,
        otherParty: 'Casa de Copas',
        color: '#28a745',
        icon: '💳'
      }
    } else if (transaction.transaction_type === 'love_bonus') {
      return {
        type: 'Love Bonus',
        amount: `+${transaction.love_amount} ❤️`,
        otherParty: 'Casa de Copas',
        color: '#e91e63',
        icon: '✨'
      }
    } else if (transaction.transaction_type === 'cashed_out') {
      return {
        type: 'Cashed Out',
        amount: `-${transaction.paloma_amount}`,
        otherParty: 'Withdrawal',
        color: '#dc3545',
        icon: '💰'
      }
    }

    return {
      type: transaction.transaction_type,
      amount: transaction.paloma_amount,
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
          ) : transactions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#8b4513'
            }}>
              No transactions yet
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {transactions.map((transaction) => {
                const display = getTransactionDisplay(transaction)
                return (
                  <div
                    key={transaction.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: `2px solid ${display.color}20`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '1.2rem'
                        }}>
                          {display.icon}
                        </span>
                        <span style={{
                          fontWeight: '600',
                          color: '#333',
                          fontSize: '1rem'
                        }}>
                          {display.type}
                        </span>
                      </div>
                      <span style={{
                        fontWeight: '700',
                        color: display.color,
                        fontSize: '1.1rem'
                      }}>
                        {display.amount}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      color: '#666'
                    }}>
                      <span>{display.otherParty}</span>
                      <span>{formatDate(transaction.created_at)}</span>
                    </div>
                    {transaction.description && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        {transaction.description}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PalomasHistory
