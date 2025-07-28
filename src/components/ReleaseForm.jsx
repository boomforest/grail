import React, { useState, useEffect } from 'react'

const ReleaseForm = ({ 
  tokenType, 
  onBack, 
  message, 
  releaseData, 
  setReleaseData, 
  isReleasing, 
  onRelease,
  user,
  profile,
  supabase
}) => {
  const [claiming, setClaiming] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [gifts, setGifts] = useState([])

  // Load gifts from database
  useEffect(() => {
    loadGifts()
  }, [])

  const loadGifts = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('casa_products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading gifts:', error)
        // Fallback to sample data if table doesn't exist yet
        setGifts([{
          id: 'coffee-simple',
          name: 'Coffee',
          description: 'Fresh brewed coffee',
          category: 'Coffee',
          price: 2,
          image_url: null,
          active: true
        }])
        return
      }

      setGifts(data || [])
    } catch (error) {
      console.error('Error loading gifts:', error)
      // Fallback to sample data
      setGifts([{
        id: 'coffee-simple',
        name: 'Coffee',
        description: 'Fresh brewed coffee',
        category: 'Coffee',
        price: 2,
        image_url: null,
        active: true
      }])
    }
  }

  // Extract unique categories from gifts
  const categories = ['All', ...new Set(gifts.map(gift => gift.category))]
  
  const filteredGifts = selectedCategory === 'All' 
    ? gifts 
    : gifts.filter(gift => gift.category === selectedCategory)

  const claimGift = async (gift) => {
    if (!profile || profile.total_palomas_collected < gift.price) {
      alert(`Insufficient Palomas! You need ${gift.price} but only have ${profile.total_palomas_collected || 0}`)
      return
    }

    const confirmClaim = window.confirm(
      `Claim ${gift.name} for ${gift.price} Palomas?\n\nThis will send a receipt to Casa staff to prepare your item for pickup.`
    )

    if (!confirmClaim) return

    try {
      setClaiming(gift.id)

      // Create claim record
      const claimData = {
        user_id: user.id,
        username: profile.username,
        user_email: user.email,
        gift_id: gift.id,
        gift_name: gift.name,
        gift_category: gift.category,
        palomas_burned: gift.price,
        status: 'claimed',
        claim_time: new Date().toISOString()
      }

      const { data: claim, error: claimError } = await supabase
        .from('casa_gift_claims')
        .insert([claimData])
        .select()
        .single()

      if (claimError) throw claimError

      // Burn Palomas from user account
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_palomas_collected: profile.total_palomas_collected - gift.price,
          last_status_update: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Send admin notification
      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert([{
          type: 'gift_claim',
          title: `🎁 ${profile.username} claimed ${gift.name}`,
          message: `User: ${profile.username} (${user.email})\nItem: ${gift.name}\nPalomas: ${gift.price}\nClaim ID: ${claim.id}`,
          user_id: user.id,
          data: JSON.stringify(claimData)
        }])

      if (notificationError) {
        console.error('Failed to send notification:', notificationError)
      }

      alert(`🎉 Gift claimed successfully!\n\n${gift.name}\nClaim ID: ${claim.id}\n\nCasa staff has been notified to prepare your item for pickup!`)
      
      // Refresh to update balance
      window.location.reload()

    } catch (error) {
      console.error('Claim error:', error)
      alert('Claim failed. Please try again.')
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <button 
            onClick={onBack}
            style={{
              background: 'none',
              border: '2px solid #d2691e',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#d2691e'
            }}
          >
            ←
          </button>
          
          <h1 style={{
            fontSize: '2rem',
            color: '#d2691e',
            margin: 0,
            fontWeight: 'normal',
            fontStyle: 'italic'
          }}>
            Release {tokenType}
          </h1>
          
          <div style={{ width: '50px' }} />
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: message.includes('successful') || message.includes('Released') ? '#d4edda' : 
                           message.includes('failed') ? '#f8d7da' : '#fff3cd',
            color: message.includes('successful') || message.includes('Released') ? '#155724' : 
                   message.includes('failed') ? '#721c24' : '#856404',
            borderRadius: '15px',
            fontSize: '1rem'
          }}>
            {message}
          </div>
        )}

        {/* Simple Release Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="number"
              placeholder="Amount"
              value={releaseData.amount}
              onChange={(e) => setReleaseData(prev => ({ ...prev, amount: e.target.value }))}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                border: '2px solid #ddd',
                borderRadius: '15px',
                textAlign: 'center',
                marginBottom: '1rem'
              }}
            />
            
            <textarea
              placeholder="Reason (optional)"
              value={releaseData.reason}
              onChange={(e) => setReleaseData(prev => ({ ...prev, reason: e.target.value }))}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                border: '2px solid #ddd',
                borderRadius: '15px',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={() => onRelease(tokenType)}
            disabled={isReleasing || !releaseData.amount}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '500',
              backgroundColor: isReleasing || !releaseData.amount ? '#ccc' : '#8b4513',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: isReleasing || !releaseData.amount ? 'not-allowed' : 'pointer',
              fontStyle: 'italic'
            }}
          >
            {isReleasing ? 'Releasing...' : 'Release'}
          </button>
        </div>

        {/* Category Filter */}
        {gifts.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  background: selectedCategory === category ? '#7c3aed' : 'white',
                  color: selectedCategory === category ? 'white' : '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Gifts Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {filteredGifts.map(gift => (
            <GiftCard 
              key={gift.id}
              gift={gift}
              onClaim={claimGift}
              userBalance={profile?.total_palomas_collected || 0}
              claiming={claiming === gift.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Simplified Gift Card Component
const GiftCard = ({ gift, onClaim, userBalance, claiming }) => {
  const canAfford = userBalance >= gift.price
  const isAvailable = gift.active

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '1rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease',
      opacity: isAvailable ? 1 : 0.6,
      border: '2px solid #e2e8f0',
      cursor: canAfford && isAvailable ? 'pointer' : 'default'
    }}
    onClick={() => canAfford && isAvailable && !claiming ? onClaim(gift) : null}
    onMouseOver={(e) => {
      if (isAvailable && canAfford) {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'
      }
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      
      {/* Gift Image or Placeholder */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1rem'
      }}>
        {gift.image_url ? (
          <img
            src={gift.image_url}
            alt={gift.name}
            style={{
              width: '100%',
              height: '100px',
              objectFit: 'cover',
              borderRadius: '10px'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: '#64748b'
          }}>
            🎁
          </div>
        )}
      </div>

      {/* Gift Title */}
      <h4 style={{
        margin: '0 0 0.5rem 0',
        fontSize: '1rem',
        color: '#1e293b',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {gift.name}
      </h4>

      {/* Price */}
      <div style={{
        textAlign: 'center',
        fontSize: '1.125rem',
        fontWeight: 'bold',
        color: canAfford ? '#7c3aed' : '#dc2626',
        marginBottom: '0.5rem'
      }}>
        🪙 {gift.price}
      </div>

      {/* Status */}
      <div style={{
        textAlign: 'center',
        fontSize: '0.8rem',
        color: claiming ? '#f59e0b' : 
               !canAfford ? '#dc2626' : 
               '#10b981',
        fontWeight: '500'
      }}>
        {claiming ? 'Claiming...' : 
         !isAvailable ? 'Unavailable' :
         !canAfford ? `Need ${gift.price - userBalance} more` : 
         'Tap to claim'}
      </div>
    </div>
  )
}

export default ReleaseForm
