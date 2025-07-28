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

        {/* Current Balance */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#8b4513' }}>Your Balance</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#d2691e' }}>
            🪙 {profile?.total_palomas_collected || 0} Palomas
          </p>
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

        {/* Release to Void Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#8b4513',
            margin: '0 0 1rem 0',
            fontStyle: 'italic'
          }}>
            Release to Void
          </h2>
          
          <p style={{
            fontSize: '0.9rem',
            color: '#666',
            marginBottom: '1.5rem',
            fontStyle: 'italic'
          }}>
            Send Palomas to the void to show your commitment to the community
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="number"
              placeholder="Amount to release"
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
              placeholder="Reason for release (optional)"
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
            {isReleasing ? 'Releasing...' : 'Release to Void'}
          </button>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '2rem 0',
          color: '#8b4513'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#d2691e' }}></div>
          <span style={{ 
            margin: '0 1rem', 
            fontSize: '1.1rem', 
            fontStyle: 'italic',
            fontWeight: '500'
          }}>
            Or claim a gift instead
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#d2691e' }}></div>
        </div>

        {/* Gift Store Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#7c3aed',
            margin: '0 0 1rem 0',
            fontStyle: 'italic'
          }}>
            🎁 Casa Gift Store
          </h2>

          <p style={{
            fontSize: '0.9rem',
            color: '#666',
            marginBottom: '1.5rem',
            fontStyle: 'italic'
          }}>
            Claim gifts to support Casa and get awesome stuff!
          </p>

          {/* Category Filter */}
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

          {/* Gifts Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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

          {filteredGifts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ fontSize: '1rem', color: '#64748b' }}>
                No gifts available yet. Ask an admin to add some items! 🎁
              </p>
            </div>
          )}

          {/* Info Footer */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem' }}>How it works:</h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1.5rem', 
              color: '#64748b', 
              lineHeight: 1.6,
              fontSize: '0.9rem',
              textAlign: 'left'
            }}>
              <li>Browse gifts and find something you like</li>
              <li>Claim it with your Palomas - they'll be deducted instantly</li>
              <li>Casa staff gets notified to prepare your item</li>
              <li>Pick it up next time you're at Casa! 🏠</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gift Card Component
const GiftCard = ({ gift, onClaim, userBalance, claiming }) => {
  const canAfford = userBalance >= gift.price
  const isAvailable = gift.active

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      opacity: isAvailable ? 1 : 0.6,
      border: '1px solid #e2e8f0'
    }}
    onMouseOver={(e) => {
      if (isAvailable) {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
      }
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
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
              height: '120px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '0.5rem'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '120px',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem',
            fontSize: '2rem',
            color: '#64748b'
          }}>
            📦
          </div>
        )}
        
        <div style={{
          display: 'inline-block',
          background: gift.category === 'Coffee' ? '#fef3c7' :
                     gift.category === 'Food' ? '#fef2f2' :
                     gift.category === 'Merch' ? '#f0f9ff' :
                     gift.category === 'Classes' ? '#f0fdf4' :
                     gift.category === 'Studio' ? '#faf5ff' : '#f8fafc',
          color: gift.category === 'Coffee' ? '#92400e' :
                 gift.category === 'Food' ? '#991b1b' :
                 gift.category === 'Merch' ? '#1e40af' :
                 gift.category === 'Classes' ? '#166534' :
                 gift.category === 'Studio' ? '#7c2d12' : '#64748b',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {gift.category}
        </div>
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

      {/* Gift Description */}
      <p style={{
        margin: '0 0 1rem 0',
        fontSize: '0.875rem',
        color: '#64748b',
        lineHeight: 1.4,
        textAlign: 'center'
      }}>
        {gift.description}
      </p>

      {/* Price and Claim Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column'
        }}>
          <span style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#7c3aed'
          }}>
            🪙 {gift.price}
          </span>
          {!canAfford && (
            <span style={{
              fontSize: '0.75rem',
              color: '#dc2626',
              marginTop: '0.125rem'
            }}>
              Need {gift.price - userBalance} more
            </span>
          )}
        </div>

        <button
          onClick={() => onClaim(gift)}
          disabled={!canAfford || !isAvailable || claiming}
          style={{
            background: canAfford && isAvailable && !claiming
              ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
              : '#e2e8f0',
            color: canAfford && isAvailable && !claiming ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            cursor: canAfford && isAvailable && !claiming ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          {claiming ? 'Claiming...' : 
           !isAvailable ? 'Unavailable' :
           !canAfford ? 'Need More 🪙' : 
           'Claim Gift'}
        </button>
      </div>
    </div>
  )
}

export default ReleaseForm
