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
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>

        <h1 style={{
          fontSize: '3rem',
          color: '#d2691e',
          marginBottom: '2rem',
          fontWeight: 'normal'
        }}>
          Release {tokenType}
        </h1>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: message.includes('successful') || message.includes('Released') ? '#d4edda' : '#f8d7da',
            color: message.includes('successful') || message.includes('Released') ? '#155724' : '#721c24',
            borderRadius: '20px'
          }}>
            {message}
          </div>
        )}

        {/* Release Form */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="number"
            value={releaseData.amount}
            onChange={(e) => setReleaseData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="Amount"
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.2rem',
              border: '2px solid #d2691e',
              borderRadius: '25px',
              textAlign: 'center',
              marginBottom: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          
          <textarea
            value={releaseData.reason}
            onChange={(e) => setReleaseData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Reason (optional)"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.2rem',
              border: '2px solid #d2691e',
              borderRadius: '25px',
              textAlign: 'center',
              minHeight: '60px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <button
          onClick={() => onRelease(tokenType)}
          disabled={isReleasing || !releaseData.amount}
          style={{
            background: isReleasing || !releaseData.amount ? '#ccc' : 'linear-gradient(45deg, #8b4513, #a0522d)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            fontWeight: '500',
            cursor: isReleasing || !releaseData.amount ? 'not-allowed' : 'pointer',
            boxShadow: isReleasing || !releaseData.amount ? 'none' : '0 4px 15px rgba(139, 69, 19, 0.3)',
            marginBottom: '3rem'
          }}
        >
          {isReleasing ? 'Releasing...' : 'Release'}
        </button>

        {/* Gift Store Section */}
        {gifts.length > 0 && (
          <>
            <div style={{
              borderTop: '2px solid #d2691e',
              paddingTop: '2rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '2rem',
                color: '#8b4513',
                marginBottom: '1.5rem',
                fontWeight: 'normal'
              }}>
                🎁 Gift Store
              </h2>

              {/* Category Filter */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      background: selectedCategory === category ? 
                        'linear-gradient(45deg, #d2691e, #cd853f)' : 
                        'rgba(255, 255, 255, 0.9)',
                      color: selectedCategory === category ? 'white' : '#8b4513',
                      border: selectedCategory === category ? 'none' : '2px solid #d2691e',
                      borderRadius: '20px',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Gifts Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                maxWidth: '600px',
                margin: '0 auto'
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
          </>
        )}
      </div>
    </div>
  )
}

// Clean Gift Card Component
const GiftCard = ({ gift, onClaim, userBalance, claiming }) => {
  const canAfford = userBalance >= gift.price
  const isAvailable = gift.active

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '25px',
      padding: '1rem',
      transition: 'all 0.3s ease',
      opacity: isAvailable ? 1 : 0.6,
      border: '2px solid #d2691e',
      cursor: canAfford && isAvailable ? 'pointer' : 'default',
      boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)'
    }}
    onClick={() => canAfford && isAvailable && !claiming ? onClaim(gift) : null}
    onMouseOver={(e) => {
      if (isAvailable && canAfford) {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(210, 105, 30, 0.4)'
      }
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(210, 105, 30, 0.3)'
    }}>
      
      {/* Gift Image or Placeholder */}
      <div style={{
        textAlign: 'center',
        marginBottom: '0.75rem'
      }}>
        {gift.image_url ? (
          <img
            src={gift.image_url}
            alt={gift.name}
            style={{
              width: '100%',
              height: '80px',
              objectFit: 'cover',
              borderRadius: '15px'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '80px',
            background: 'rgba(139, 69, 19, 0.1)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            color: '#8b4513'
          }}>
            🎁
          </div>
        )}
      </div>

      {/* Gift Title */}
      <h4 style={{
        margin: '0 0 0.5rem 0',
        fontSize: '0.9rem',
        color: '#8b4513',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {gift.name}
      </h4>

      {/* Price */}
      <div style={{
        textAlign: 'center',
        fontSize: '1rem',
        fontWeight: 'bold',
        color: canAfford ? '#d2691e' : '#dc2626',
        marginBottom: '0.5rem'
      }}>
        🪙 {gift.price}
      </div>

      {/* Status */}
      <div style={{
        textAlign: 'center',
        fontSize: '0.7rem',
        color: claiming ? '#f59e0b' : 
               !canAfford ? '#dc2626' : 
               '#8b4513',
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
