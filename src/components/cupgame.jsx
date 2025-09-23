import React, { useState, useEffect } from 'react'

// Helper functions for tarot system
const getTarotCardName = (level, username = '') => {
  // Special case for JPR333 - Knight of the Grail
  if (username === 'JPR333' || username === 'jpr333') {
    return 'Knight of the Grail'
  }
  
  const swordCards = [
    'King of Swords', 'Queen of Swords', 'Knight of Swords', 'Page of Swords',
    'Ten of Swords', 'Nine of Swords', 'Eight of Swords', 'Seven of Swords',
    'Six of Swords', 'Five of Swords', 'Four of Swords', 'Three of Swords',
    'Two of Swords', 'Ace of Swords'
  ]
  const cupCards = [
    'Ace of Cups', 'Two of Cups', 'Three of Cups', 'Four of Cups',
    'Five of Cups', 'Six of Cups', 'Seven of Cups', 'Eight of Cups',
    'Nine of Cups', 'Ten of Cups', 'Page of Cups', 'Knight of Cups'
  ]
  
  if (level <= 14) return swordCards[level - 1]
  if (level <= 26) return cupCards[level - 15]
  return 'Knight of Cups'
}

const getCardImage = (level, supabaseInstance = null, username = '') => {
  // Special case for JPR333 - Knight of the Grail
  if (username === 'JPR333' || username === 'jpr333') {
    if (!supabaseInstance) {
      return `https://via.placeholder.com/200x350/8B4513/FFFFFF?text=Knight+of+Grail`
    }
    const { data: { publicUrl } } = supabaseInstance.storage
      .from('tarot-cards')
      .getPublicUrl('KnightG.png')
    return publicUrl
  }
  
  const cardNames = {
    1: 'KingS.png', 2: 'QueenS.png', 3: 'KnightS.png', 4: 'PageS.png',
    5: 'TenS.png', 6: 'NineS.png', 7: 'EightS.png', 8: 'SevenS.png',
    9: 'SixS.png', 10: 'FiveS.png', 11: 'FourS.png', 12: 'ThreeS.png',
    13: 'TwoS.png', 14: 'AceS.png', 15: 'AceC.png', 16: 'TwoC.png',
    17: 'ThreeC.png', 18: 'FourC.png', 19: 'FiveC.png', 20: 'SixC.png',
    21: 'SevenC.png', 22: 'EightC.png', 23: 'NineC.png', 24: 'TenC.png',
    25: 'PageC.png', 26: 'KnightC.png'
  }
  
  if (!supabaseInstance) {
    return `https://via.placeholder.com/200x350/D2691E/FFFFFF?text=Level+${level}`
  }
  
  const cardName = cardNames[level] || 'KingS.png'
  const { data: { publicUrl } } = supabaseInstance.storage
    .from('tarot-cards')
    .getPublicUrl(cardName)
  
  return publicUrl
}

const getCardMeaning = (level, username = '') => {
  // Special case for JPR333 - Knight of the Grail
  if (username === 'JPR333' || username === 'jpr333') {
    return "Knight of the Grail - Guardian of Casa de Copas, keeper of the sacred vessel. One who has transcended both sword and cup to become the living embodiment of service, creativity, and love. The architect of transformation, building bridges between worlds."
  }
  
  if (level <= 14) {
    const meanings = [
      "The pinnacle of extractive success - wealth built on others' suffering, yet haunted by the knowledge of what it cost.",
      "Power wielded through manipulation and extraction, with growing awareness of the hollow victory.",
      "The warrior of a corrupted system, fighting battles that serve only to perpetuate harm.",
      "The student of extraction, learning to take without giving, yet sensing something is wrong.",
      "Ten wounds of realization - the full weight of participating in systems of harm.",
      "Nine sleepless nights, tortured by the knowledge of complicity in suffering.",
      "Eight chains of the system that binds both oppressor and oppressed.",
      "Seven stolen victories, each one leaving a deeper mark on the soul.",
      "Six crossings toward truth, beginning to see the damage done.",
      "Five defeats that teach - losses that crack open the hardened heart.",
      "Four meditations on harm - stillness that allows guilt to surface.",
      "Three heartbreaks of recognition - seeing clearly what you've become.",
      "Two choices before you - continue the harm or choose transformation.",
      "One moment of surrender - laying down the sword of extraction forever."
    ]
    return meanings[level - 1]
  } else {
    const meanings = [
      "First overflow of grace - the moment you choose to give rather than take.",
      "Two hearts connecting - learning that joy multiplies when shared.",
      "Three celebrations of community - finding family in fellow givers.",
      "Four offerings received - abundance flows to those who serve others.",
      "Five sources of renewal - discovering infinite wells of compassion.",
      "Six gifts freely given - the joy of generosity without expectation.",
      "Seven visions of possibility - seeing the world that could be.",
      "Eight depths of understanding - wisdom that comes from serving others.",
      "Nine fulfillments complete - the near-perfect satisfaction of a giving heart.",
      "Ten blessings overflowing - a life so full it cannot help but spill over.",
      "The student of love - humble in service, eager to learn compassion.",
      "The master of giving - one who has reversed the heart completely, finding pride in service to others."
    ]
    return meanings[level - 15]
  }
}

function TarotCupsPage({ profile, onBack, supabase, user, onProfileUpdate }) {
  const [showEraModal, setShowEraModal] = useState(null)
  const [currentTransformationCost, setCurrentTransformationCost] = useState(300)
  const [message, setMessage] = useState('')

  const isMaxLevel = (profile?.tarot_level || 1) >= 26

  // Check for automatic transformation
  useEffect(() => {
    const checkAutoTransformation = async () => {
      if (!profile || !supabase || isMaxLevel) return
      
      const currentLevel = profile.tarot_level || 1
      const lovBalance = profile.lov_balance || 0
      
      // Skip auto-transformation for Knight of the Grail (JPR333)
      if (profile.username === 'JPR333' || profile.username === 'jpr333') return
      
      if (lovBalance >= currentTransformationCost && currentTransformationCost > 0) {
        try {
          // Deduct the LOV cost and advance to next level
          const newLovBalance = lovBalance - currentTransformationCost
          const newLevel = currentLevel + 1
          
          const { error } = await supabase
            .from('profiles')
            .update({ 
              tarot_level: newLevel,
              lov_balance: newLovBalance
            })
            .eq('id', profile.id)
          
          if (!error) {
            // Update local profile
            const updatedProfile = {
              ...profile,
              tarot_level: newLevel,
              lov_balance: newLovBalance
            }
            
            if (onProfileUpdate) {
              onProfileUpdate(updatedProfile)
            }
            
            setMessage(`Transformed to ${getTarotCardName(newLevel, profile.username)}!`)
            setTimeout(() => setMessage(''), 3000)
          }
        } catch (error) {
          console.error('Auto-transformation error:', error)
        }
      }
    }
    
    checkAutoTransformation()
  }, [profile?.lov_balance, currentTransformationCost, profile?.tarot_level])

  // Load current transformation cost
  useEffect(() => {
    const loadTransformationCost = async () => {
      if (!profile) return
      
      const currentLevel = profile.tarot_level || 1
      const nextLevel = currentLevel + 1
      if (nextLevel > 26) {
        setCurrentTransformationCost(0)
        return
      }

      // New cost structure: 3,333 tokens total to Page of Cups (level 25)
      // Starts expensive, gets cheaper as you progress
      const getBaseCost = (level) => {
        if (level <= 5) return 300  // Levels 1-5: 300 each = 1,500
        if (level <= 10) return 150  // Levels 6-10: 150 each = 750
        if (level <= 14) return 100  // Levels 11-14: 100 each = 400
        if (level === 15) return 200  // Ace to Ace crossing: 200
        if (level <= 20) return 75   // Levels 16-20: 75 each = 375
        if (level <= 24) return 27   // Levels 21-24: 27 each = 108
        if (level === 25) return 0   // Already at Page
        if (level === 26) return 1000000  // Knight transformation remains special
        return 300  // Fallback - default to early level cost
      }

      const baseCost = getBaseCost(nextLevel)
      
      // Always use the base cost from our defined structure
      // The database table might have old/incorrect values
      setCurrentTransformationCost(baseCost)
      
      // Skip database query for now - it seems to have incorrect data
      return
      
      /* Disabled database query - using hardcoded values instead
      // If no supabase connection (like in dev mode), use fallback costs
      if (!supabase) {
        setCurrentTransformationCost(baseCost)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('tarot_transformations')
          .select('current_cost')
          .eq('card_level', nextLevel)
          .single()
        
        if (error) {
          setCurrentTransformationCost(baseCost)
        } else {
          // Use dynamic cost if available, otherwise use base cost
          setCurrentTransformationCost(data.current_cost || baseCost)
        }
      } catch (error) {
        console.error('Error loading transformation cost:', error)
        setCurrentTransformationCost(baseCost)
      }
      */
    }
    
    loadTransformationCost()
  }, [supabase, profile?.tarot_level])


  const calculateMeritPercentage = () => {
    if (!profile || currentTransformationCost === 0) return 0
    const lovNeeded = currentTransformationCost
    const lovBalance = profile.lov_balance || 0
    const percentage = Math.min((lovBalance / lovNeeded) * 100, 100)
    return Math.round(percentage * 10) / 10
  }


  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fef7ed, #fed7aa)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '1rem',
    color: '#92400e',
    position: 'relative'
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
  }

  const backButtonStyle = {
    background: '#fed7aa',
    border: '1px solid #fb923c',
    borderRadius: '1rem',
    padding: '0.75rem 1.5rem',
    color: '#ea580c',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }

  const mainContentStyle = {
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center'
  }

  const cardContainerStyle = {
    display: 'flex',
    flexDirection: window.innerWidth > 768 ? 'row' : 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem'
  }

  const cardImageStyle = {
    width: window.innerWidth > 768 ? '160px' : '120px',
    height: window.innerWidth > 768 ? '240px' : '180px',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 15px rgba(139, 90, 60, 0.2)',
    border: '2px solid #fb923c',
    transition: 'transform 0.3s ease',
    imageRendering: 'pixelated'
  }

  const cardTitleStyle = {
    fontSize: window.innerWidth > 768 ? '1.5rem' : '1.1rem',
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: '0.5rem'
  }

  const cardLevelStyle = {
    fontSize: window.innerWidth > 768 ? '1rem' : '0.9rem',
    color: '#a16207',
    marginBottom: '1rem'
  }

  const costBoxStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '0.75rem',
    padding: '1rem',
    border: '2px solid #fb923c',
    boxShadow: '0 4px 15px rgba(139, 90, 60, 0.1)',
    minWidth: '140px'
  }

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  }

  const modalContentStyle = {
    borderRadius: '1.5rem',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(139, 90, 60, 0.3)',
    border: '2px solid',
    position: 'relative'
  }

  return (
    <div style={containerStyle}>
      {/* Era Modal */}
      {showEraModal && (
        <div style={modalOverlayStyle}>
          <div style={{
            ...modalContentStyle,
            background: showEraModal === 'swords' 
              ? 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' 
              : 'linear-gradient(135deg, #f3e8ff, #e0e7ff)',
            borderColor: showEraModal === 'swords' ? '#6b7280' : '#8b5cf6'
          }}>
            <button
              onClick={() => setShowEraModal(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                fontSize: '1.5rem',
                opacity: 0.6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '1rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '1rem',
                background: showEraModal === 'swords' ? '#374151' : '#8b5cf6',
                color: 'white'
              }}>
                {showEraModal === 'swords' ? '⚔️ Era of Swords' : '🏆 Era of Cups'}
              </div>
            </div>

            {showEraModal === 'swords' ? (
              <div style={{ color: '#374151' }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  "When Arthur pulled the sword from the stone..."
                </div>
                
                <div style={{
                  color: '#4b5563',
                  fontStyle: 'italic',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem'
                }}>
                  A dark era began where man used intellect to defend attacks and gain as much as possible. For centuries, no remedy existed for this endless cycle of extraction and pain.
                </div>

                <div style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: '1px solid #d1d5db'
                }}>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#4b5563',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    margin: 0
                  }}>
                    <strong>The age of taking.</strong> Sword-holders defend what they've seized, trapped in endless cycles of fear and accumulation.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ color: '#7c3aed' }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  "Learn the power of unclenching the sword and holding the cup."
                </div>
                
                <div style={{
                  color: '#8b5cf6',
                  fontStyle: 'italic',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem'
                }}>
                  The game of cups teaches the joy of giving for the sake of giving. Break free from the endless cycle. Entry grows more difficult as early participants become exponentially rare.
                </div>

                <div style={{
                  padding: '1rem',
                  background: '#faf5ff',
                  borderRadius: '0.75rem',
                  border: '1px solid #c4b5fd'
                }}>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#7c3aed',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    margin: 0
                  }}>
                    <strong>The cup holders shape tomorrow.</strong> Position yourself while the path remains open.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle}>
          ← Back
        </button>
      </div>

      <div style={mainContentStyle}>
        {/* Main Display */}
        <div style={cardContainerStyle}>
          {/* Tarot Card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <img
                src={getCardImage(profile?.tarot_level || 1, supabase, profile?.username)}
                alt={getTarotCardName(profile?.tarot_level || 1, profile?.username)}
                style={cardImageStyle}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              />
              
              {/* Transformation number overlay */}
              {profile?.transformation_numbers && profile.transformation_numbers[profile.tarot_level] && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  boxShadow: '0 2px 10px rgba(234, 88, 12, 0.3)'
                }}>
                  #{profile.transformation_numbers[profile.tarot_level]}
                </div>
              )}
            </div>
            
            <h1 style={cardTitleStyle}>
              {getTarotCardName(profile?.tarot_level || 1, profile?.username)}
            </h1>
            <div style={cardLevelStyle}>
              {(profile?.username === 'JPR333' || profile?.username === 'jpr333') 
                ? 'Guardian of Casa de Copas' 
                : `Level ${profile?.tarot_level || 1} ${isMaxLevel ? '• COMPLETE' : ''}`}
            </div>
          </div>

          {/* Next Transformation Cost */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              color: '#a16207',
              fontWeight: '500',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              Next Transformation
            </div>
            
            {(profile?.username === 'JPR333' || profile?.username === 'jpr333') ? (
              <div style={{
                background: 'linear-gradient(135deg, #8b4513, #d2691e)',
                color: 'white',
                borderRadius: '0.75rem',
                padding: '1rem',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Eternal Guardian</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Knight of the Grail</div>
              </div>
            ) : isMaxLevel ? (
              <div style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: 'white',
                borderRadius: '0.75rem',
                padding: '1rem',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>👑</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Journey Complete!</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Knight of Cups Achieved</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={costBoxStyle}>
                  <div style={{ fontSize: '0.7rem', color: '#a16207', marginBottom: '0.25rem' }}>Cost to reach</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.25rem' }}>
                    {getTarotCardName((profile?.tarot_level || 1) + 1)}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ea580c', marginBottom: '0.25rem' }}>
                    {Math.max(0, currentTransformationCost - (profile?.lov_balance || 0)).toLocaleString()} ❤️
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#a16207' }}>
                    {(profile?.lov_balance || 0) >= currentTransformationCost ? 'Ready!' : 'Love needed'}
                  </div>
                </div>
                
              </div>
            )}
          </div>
        </div>


        {/* Era Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowEraModal('swords')}
            style={{
              background: 'linear-gradient(135deg, #6b7280, #374151)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)',
              fontSize: '0.85rem',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ⚔️ Era of Swords
          </button>
          
          <button
            onClick={() => setShowEraModal('cups')}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              fontSize: '0.85rem',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            🏆 Era of Cups
          </button>
        </div>

        {/* Card Meaning */}
        <details style={{
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          border: '1px solid #fb923c',
          cursor: 'pointer',
          maxWidth: '100%',
          marginBottom: '1rem'
        }}>
          <summary style={{
            fontWeight: '600',
            color: '#ea580c',
            marginBottom: '0.5rem',
            fontSize: '0.9rem'
          }}>
            Card Meaning
          </summary>
          <p style={{
            fontSize: '0.8rem',
            color: '#92400e',
            fontStyle: 'italic',
            lineHeight: '1.5',
            margin: 0
          }}>
            {getCardMeaning(profile?.tarot_level || 1, profile?.username)}
          </p>
        </details>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '0.75rem',
            border: '2px solid',
            borderColor: message.includes('Error') ? '#f87171' : '#6ee7b7',
            background: message.includes('Error') ? '#fef2f2' : '#d1fae5',
            color: message.includes('Error') ? '#dc2626' : '#047857'
          }}>
            {message}
          </div>
        )}

      </div>
    </div>
  )
}

export default TarotCupsPage