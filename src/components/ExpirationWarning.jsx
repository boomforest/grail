import React, { useState, useEffect } from 'react'

function ExpirationWarning({ supabase, userId }) {
  const [expirationData, setExpirationData] = useState({
    expiring30Days: 0,
    expiring90Days: 0,
    nextExpirationDate: null,
    loading: true
  })

  useEffect(() => {
    if (!supabase || !userId) return

    const checkExpiring = async () => {
      try {
        const now = new Date()
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

        // Get all active transactions
        const { data: transactions, error } = await supabase
          .from('paloma_transactions')
          .select('amount, expires_at')
          .eq('user_id', userId)
          .eq('is_expired', false)
          .gte('expires_at', now.toISOString())
          .order('expires_at', { ascending: true })

        if (error) {
          console.error('Error fetching expiration data:', error)
          setExpirationData({ expiring30Days: 0, expiring90Days: 0, nextExpirationDate: null, loading: false })
          return
        }

        let expiring30 = 0
        let expiring90 = 0
        let nextExpiration = null

        transactions?.forEach((tx, index) => {
          const expiresAt = new Date(tx.expires_at)

          // Track the next expiration (first in sorted list)
          if (index === 0) {
            nextExpiration = expiresAt
          }

          if (expiresAt <= thirtyDaysFromNow) {
            expiring30 += tx.amount
          } else if (expiresAt <= ninetyDaysFromNow) {
            expiring90 += tx.amount
          }
        })

        setExpirationData({
          expiring30Days: expiring30,
          expiring90Days: expiring90,
          nextExpirationDate: nextExpiration,
          loading: false
        })
      } catch (error) {
        console.error('Error in checkExpiring:', error)
        setExpirationData({ expiring30Days: 0, expiring90Days: 0, nextExpirationDate: null, loading: false })
      }
    }

    checkExpiring()

    // Refresh every 5 minutes
    const interval = setInterval(checkExpiring, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [supabase, userId])

  if (expirationData.loading) {
    return null
  }

  // Show warning if any Palomas expiring in next 30 days
  if (expirationData.expiring30Days > 0) {
    const daysUntilNext = expirationData.nextExpirationDate
      ? Math.ceil((expirationData.nextExpirationDate - new Date()) / (1000 * 60 * 60 * 24))
      : null

    return (
      <div style={{
        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
        border: '2px solid #ffc107',
        borderRadius: '12px',
        padding: '1rem',
        margin: '1rem 0',
        boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#856404',
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              <strong>{expirationData.expiring30Days} Palomas</strong> expiring in the next 30 days
            </div>
            {daysUntilNext !== null && (
              <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                Next expiration: {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''} from now
              </div>
            )}
          </div>
        </div>
        {expirationData.expiring90Days > 0 && (
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(133, 100, 4, 0.2)',
            fontSize: '0.85rem',
            color: '#856404',
            opacity: 0.8
          }}>
            Plus {expirationData.expiring90Days} more expiring in 31-90 days
          </div>
        )}
        <div style={{
          marginTop: '0.75rem',
          fontSize: '0.8rem',
          color: '#856404',
          fontStyle: 'italic'
        }}>
          Use or gift them before they expire! Palomas last 1 year from receipt.
        </div>
      </div>
    )
  }

  // Show info banner if Palomas expiring in 31-90 days
  if (expirationData.expiring90Days > 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)',
        border: '1px solid #17a2b8',
        borderRadius: '10px',
        padding: '0.75rem',
        margin: '1rem 0',
        fontSize: '0.9rem',
        color: '#0c5460'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <span>
            {expirationData.expiring90Days} Palomas expiring in 31-90 days
          </span>
        </div>
      </div>
    )
  }

  // No expirations soon - no warning needed
  return null
}

export default ExpirationWarning
