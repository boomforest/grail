// ===== 1. CASA GIFT STORE COMPONENT =====

import React, { useState, useEffect } from 'react'

const CasaGiftStore = ({ user, profile, supabase, onBack }) => {
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Sample gift data - replace with your actual items
  const sampleGifts = [
    {
      id: 'coffee-americano',
      name: 'Americano Coffee',
      description: 'Fresh brewed americano, ready when you arrive',
      category: 'Coffee',
      palomas: 8,
      emoji: '☕',
      available: true
    },
    {
      id: 'coffee-latte',
      name: 'Casa Latte',
      description: 'Our signature latte with local beans',
      category: 'Coffee',
      palomas: 12,
      emoji: '🥛',
      available: true
    },
    {
      id: 'tshirt-casa',
      name: 'Casa de Copas T-Shirt',
      description: 'Limited edition Casa tee, various sizes',
      category: 'Merch',
      palomas: 45,
      emoji: '👕',
      available: true
    },
    {
      id: 'class-pottery',
      name: 'Pottery Workshop',
      description: '2-hour pottery class with local artist',
      category: 'Classes',
      palomas: 80,
      emoji: '🏺',
      available: true
    },
    {
      id: 'studio-time',
      name: 'Studio Time (1 hour)',
      description: 'Private studio access for your creative work',
      category: 'Studio',
      palomas: 25,
      emoji: '🎨',
      available: true
    },
    {
      id: 'pastry-croissant',
      name: 'Fresh Croissant',
      description: 'Buttery croissant baked fresh daily',
      category: 'Food',
      palomas: 6,
      emoji: '🥐',
      available: true
    },
    {
      id: 'class-guitar',
      name: 'Guitar Lesson',
      description: '45-minute one-on-one guitar session',
      category: 'Classes',
      palomas: 60,
      emoji: '🎸',
      available: true
    },
    {
      id: 'notebook-casa',
      name: 'Casa Notebook',
      description: 'Hand-bound notebook with Casa logo',
      category: 'Merch',
      palomas: 20,
      emoji: '📖',
      available: true
    }
  ]

  useEffect(() => {
    // For now, use sample data. Later you can load from database
    setGifts(sampleGifts)
    setLoading(false)
  }, [])

  const categories = ['All', 'Coffee', 'Food', 'Merch', 'Classes', 'Studio']
  
  const filteredGifts = selectedCategory === 'All' 
    ? gifts 
    : gifts.filter(gift => gift.category === selectedCategory)

  const claimGift = async (gift) => {
    if (!profile || profile.total_palomas_collected < gift.palomas) {
      alert(`Insufficient Palomas! You need ${gift.palomas} but only have ${profile.total_palomas_collected || 0}`)
      return
    }

    const confirmClaim = window.confirm(
      `Claim ${gift.name} for ${gift.palomas} Palomas?\n\nThis will send a receipt to Casa staff to prepare your item for pickup.`
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
        palomas_burned: gift.palomas,
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
          total_palomas_collected: profile.total_palomas_collected - gift.palomas,
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
          message: `User: ${profile.username} (${user.email})\nItem: ${gift.name}\nPalomas: ${gift.palomas}\nClaim ID: ${claim.id}`,
          user_id: user.id,
          data: JSON.stringify(claimData)
        }])

      if (notificationError) {
        console.error('Failed to send notification:', notificationError)
      }

      alert(`🎉 Gift claimed successfully!\n\n${gift.emoji} ${gift.name}\nClaim ID: ${claim.id}\n\nCasa staff has been notified to prepare your item for pickup!`)
      
      // Refresh to update balance
      window.location.reload()

    } catch (error) {
      console.error('Claim error:', error)
      alert('Claim failed. Please try again.')
    } finally {
      setClaiming(null)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <h2>Loading Casa Store...</h2>
        <p>🎁</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back
        </button>
        
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px',
          color: '#1e293b'
        }}>
          🎁 Casa Gift Store
        </h1>
        
        <div style={{ width: '80px' }} /> {/* Spacer */}
      </div>

      {/* User Balance */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Your Paloma Balance</h3>
        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
          🪙 {profile?.total_palomas_collected || 0} Palomas
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          Claim gifts to support Casa and get awesome stuff!
        </p>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '8px'
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
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
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
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '18px', color: '#64748b' }}>
            No gifts available in this category right now. Check back soon! 🎁
          </p>
        </div>
      )}

      {/* Info Footer */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>How it works:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', lineHeight: 1.6 }}>
          <li>Browse gifts and find something you like</li>
          <li>Claim it with your Palomas - they'll be deducted instantly</li>
          <li>Casa staff gets notified to prepare your item</li>
          <li>Pick it up next time you're at Casa! 🏠</li>
        </ul>
      </div>
    </div>
  )
}

// Gift Card Component
const GiftCard = ({ gift, onClaim, userBalance, claiming }) => {
  const canAfford = userBalance >= gift.palomas
  const isAvailable = gift.available

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      opacity: isAvailable ? 1 : 0.6
    }}
    onMouseOver={(e) => {
      if (isAvailable) {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)'
      }
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      
      {/* Gift Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '8px'
        }}>
          {gift.emoji}
        </div>
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
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {gift.category}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Gift Title */}
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          color: '#1e293b',
          fontWeight: '600'
        }}>
          {gift.name}
        </h3>

        {/* Gift Description */}
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: '#64748b',
          lineHeight: 1.5
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
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#7c3aed'
            }}>
              🪙 {gift.palomas}
            </span>
            {!canAfford && (
              <span style={{
                fontSize: '12px',
                color: '#dc2626',
                marginTop: '2px'
              }}>
                Need {gift.palomas - userBalance} more
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
              padding: '10px 16px',
              cursor: canAfford && isAvailable && !claiming ? 'pointer' : 'not-allowed',
              fontSize: '14px',
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
    </div>
  )
}

// ===== 2. DATABASE TABLES (SQL) =====
/*
Run this in your Supabase SQL editor:

-- Gift claims table
CREATE TABLE IF NOT EXISTS casa_gift_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_email TEXT NOT NULL,
  gift_id TEXT NOT NULL,
  gift_name TEXT NOT NULL,
  gift_category TEXT NOT NULL,
  palomas_burned INTEGER NOT NULL,
  status TEXT DEFAULT 'claimed' CHECK (status IN ('claimed', 'prepared', 'fulfilled', 'cancelled')),
  claim_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Admin notifications table  
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE casa_gift_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view own claims" ON casa_gift_claims
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all claims
CREATE POLICY "Service role can manage claims" ON casa_gift_claims
  FOR ALL USING (auth.role() = 'service_role');

-- Only admins can view notifications
CREATE POLICY "Admins can view notifications" ON admin_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.username = 'JPR333'
    )
  );

-- Service role can manage notifications
CREATE POLICY "Service role can manage notifications" ON admin_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_gift_claims_user_id ON casa_gift_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_claims_status ON casa_gift_claims(status);
CREATE INDEX IF NOT EXISTS idx_gift_claims_claim_time ON casa_gift_claims(claim_time DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
*/

// ===== 3. ADMIN GIFT CLAIMS VIEW =====

const AdminGiftClaims = ({ supabase, onBack }) => {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClaims()
  }, [])

  const loadClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('casa_gift_claims')
        .select('*')
        .order('claim_time', { ascending: false })
        .limit(50)

      if (error) throw error
      setClaims(data || [])
    } catch (error) {
      console.error('Error loading claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateClaimStatus = async (claimId, newStatus) => {
    try {
      const { error } = await supabase
        .from('casa_gift_claims')
        .update({ status: newStatus })
        .eq('id', claimId)

      if (error) throw error
      
      // Refresh claims
      await loadClaims()
    } catch (error) {
      console.error('Error updating claim:', error)
    }
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading claims...</div>

  return (
    <div style={{ padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>🎁 Gift Claims</h2>
        <button onClick={loadClaims} style={{ padding: '8px 16px', borderRadius: '8px', background: '#7c3aed', color: 'white', border: 'none' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {claims.map(claim => (
          <div key={claim.id} style={{
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>{claim.gift_name}</strong> - {claim.username}
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                🪙 {claim.palomas_burned} Palomas • {new Date(claim.claim_time).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                ID: {claim.id.slice(0, 8)}...
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                background: claim.status === 'claimed' ? '#fef3c7' :
                           claim.status === 'prepared' ? '#dbeafe' :
                           claim.status === 'fulfilled' ? '#dcfce7' : '#fee2e2',
                color: claim.status === 'claimed' ? '#92400e' :
                       claim.status === 'prepared' ? '#1e40af' :
                       claim.status === 'fulfilled' ? '#166534' : '#991b1b'
              }}>
                {claim.status}
              </span>
              {claim.status === 'claimed' && (
                <button
                  onClick={() => updateClaimStatus(claim.id, 'prepared')}
                  style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', background: '#dbeafe', border: 'none' }}
                >
                  Mark Prepared
                </button>
              )}
              {claim.status === 'prepared' && (
                <button
                  onClick={() => updateClaimStatus(claim.id, 'fulfilled')}
                  style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', background: '#dcfce7', border: 'none' }}
                >
                  Mark Fulfilled
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {claims.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No gift claims yet!
        </div>
      )}
    </div>
  )
}

// ===== 4. ADD TO YOUR MAIN APP =====
/*
1. Import the components:
   import CasaGiftStore from './components/CasaGiftStore'
   import AdminGiftClaims from './components/AdminGiftClaims'

2. Add state:
   const [showGiftStore, setShowGiftStore] = useState(false)
   const [showGiftClaims, setShowGiftClaims] = useState(false)

3. Add to Dashboard props:
   onShowGiftStore={() => setShowGiftStore(true)}
   onShowGiftClaims={() => setShowGiftClaims(true)} // for admin only

4. Add conditional renders:
   if (user && showGiftStore) {
     return <CasaGiftStore user={user} profile={profile} supabase={supabase} onBack={() => setShowGiftStore(false)} />
   }
   
   if (user && showGiftClaims && isAdmin) {
     return <AdminGiftClaims supabase={supabase} onBack={() => setShowGiftClaims(false)} />
   }
*/

export { CasaGiftStore, AdminGiftClaims }
