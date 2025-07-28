import React, { useState, useEffect } from 'react'

// Helper functions for tarot system
const getTarotCardName = (level) => {
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
  
  if (level <= 14) return swordCards[level - 1]      // Levels 1-14
  if (level <= 26) return cupCards[level - 15]       // Levels 15-26
  return 'Knight of Cups' // Max level
}

function TarotCupsPage({ profile, onBack, supabase, user, onProfileUpdate }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [allProfiles, setAllProfiles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [currentTransformationCost, setCurrentTransformationCost] = useState(50)

  // Check if user should see welcome window
  useEffect(() => {
    // Show welcome window for new users (tarot_level 1 = King of Swords start)
    setShowWelcome((profile?.tarot_level || 1) === 1 && (profile?.merit_count || 0) === 0)
  }, [profile])

  // Load current transformation cost for user's next level
  useEffect(() => {
    const loadTransformationCost = async () => {
      if (!supabase || !profile) return
      
      try {
        const nextLevel = (profile.tarot_level || 1) + 1
        if (nextLevel > 26) {
          setCurrentTransformationCost(0) // Max level reached
          return
        }

        const { data, error } = await supabase
          .from('tarot_transformations')
          .select('current_cost')
          .eq('card_level', nextLevel)
          .single()
        
        if (error) {
          // If no record exists, create it with base cost
          const { error: insertError } = await supabase
            .from('tarot_transformations')
            .insert([{ 
              card_level: nextLevel, 
              transformation_count: 0, 
              current_cost: 50 
            }])
          
          if (!insertError) {
            setCurrentTransformationCost(50)
          }
        } else {
          setCurrentTransformationCost(data.current_cost)
        }
      } catch (error) {
        console.error('Error loading transformation cost:', error)
        setCurrentTransformationCost(50) // Fallback
      }
    }
    
    loadTransformationCost()
  }, [supabase, profile?.tarot_level])

  // Load all profiles for search
  useEffect(() => {
    const loadProfiles = async () => {
      if (!supabase) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, cup_count, tarot_level, merit_count, palomas_purchased')
          .order('username')
        
        if (error) throw error
        setAllProfiles(data || [])
      } catch (error) {
        console.error('Error loading profiles:', error)
      }
    }
    
    loadProfiles()
  }, [supabase])

  // Calculate merit percentage based on palomas purchased and current transformation cost
  const calculateMeritPercentage = () => {
    if (!profile || currentTransformationCost === 0) return 0
    
    const palomasNeeded = currentTransformationCost
    const palomasPurchased = profile.palomas_purchased || 0
    const percentage = Math.min((palomasPurchased / palomasNeeded) * 100, 100)
    
    return Math.round(percentage * 10) / 10 // Round to 1 decimal place
  }

  // Calculate how many merit circles should be filled
  const getMeritCircleStates = () => {
    const totalPercentage = calculateMeritPercentage()
    const meritCount = profile?.merit_count || 0
    
    // Each merit circle represents 33.33% progress
    const circles = []
    for (let i = 0; i < 3; i++) {
      const circleStartPercent = i * 33.33
      const circleEndPercent = (i + 1) * 33.33
      
      let circlePercent = 0
      if (totalPercentage > circleStartPercent) {
        circlePercent = Math.min(totalPercentage - circleStartPercent, 33.33)
      }
      
      circles.push({
        filled: circlePercent >= 33.33,
        percentage: Math.round((circlePercent / 33.33) * 100)
      })
    }
    
    return circles
  }

  // Search users as they type
  const handleSearchChange = (value) => {
    setSearchTerm(value)
    
    if (value.length > 0) {
      const filtered = allProfiles.filter(profile => 
        profile.username.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5) // Show max 5 results
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }

  const selectUser = (profile) => {
    setSelectedUser(profile)
    setSearchTerm(profile.username)
    setSearchResults([])
  }

  // Admin function to award merit
  const awardMerit = async (userId, reason = 'Good community contribution') => {
    if (!supabase || !user) return

    try {
      setLoading(true)
      
      // Get current profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('merit_count, tarot_level, cup_count, username, palomas_purchased, transformation_numbers')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      // Check if ready to level up (100% progress from palomas purchased)
      const nextLevel = (currentProfile.tarot_level || 1) + 1
      if (nextLevel > 26) {
        setMessage('This user has reached maximum level (Knight of Cups)!')
        return
      }

      // Get transformation cost for next level
      const { data: transformData, error: transformError } = await supabase
        .from('tarot_transformations')
        .select('current_cost, transformation_count')
        .eq('card_level', nextLevel)
        .single()

      if (transformError) {
        // Create new transformation record if doesn't exist
        const { data: newTransform, error: insertError } = await supabase
          .from('tarot_transformations')
          .insert([{ 
            card_level: nextLevel, 
            transformation_count: 0, 
            current_cost: 50 
          }])
          .select()
          .single()
        
        if (insertError) throw insertError
        transformData = newTransform
      }

      const requiredPalomas = transformData.current_cost
      const currentPalomas = currentProfile.palomas_purchased || 0
      const progressPercentage = (currentPalomas / requiredPalomas) * 100

      // Check if user can level up (has 100% progress)
      if (progressPercentage >= 100) {
        // Level up the user
        const newTransformationNumbers = {
          ...(currentProfile.transformation_numbers || {}),
          [nextLevel]: (transformData.transformation_count || 0) + 1
        }

        // Update user's level and reset palomas_purchased
        const { error: updateUserError } = await supabase
          .from('profiles')
          .update({
            tarot_level: nextLevel,
            palomas_purchased: currentPalomas - requiredPalomas, // Subtract used palomas
            transformation_numbers: newTransformationNumbers,
            last_status_update: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateUserError) throw updateUserError

        // Update transformation count and cost for next person
        const { error: updateTransformError } = await supabase
          .from('tarot_transformations')
          .update({ 
            transformation_count: (transformData.transformation_count || 0) + 1,
            current_cost: requiredPalomas + 1 // Increase cost for next person
          })
          .eq('card_level', nextLevel)

        if (updateTransformError) throw updateTransformError

        // Log the level up
        await supabase
          .from('merit_logs')
          .insert([{
            user_id: userId,
            awarded_by: user.id,
            reason: `Level up to ${getTarotCardName(nextLevel)}`,
            merit_count_after: 0,
            leveled_up: true,
            new_tarot_level: nextLevel
          }])

        // Update parent component if it's the current user
        if (userId === user.id && onProfileUpdate) {
          const updatedProfile = {
            ...profile,
            tarot_level: nextLevel,
            palomas_purchased: currentPalomas - requiredPalomas,
            transformation_numbers: newTransformationNumbers
          }
          onProfileUpdate(updatedProfile)
        }

        const recipientName = userId === user.id ? 'You' : currentProfile.username
        const transformationNumber = (transformData.transformation_count || 0) + 1
        setMessage(`🎉 ${recipientName} leveled up to ${getTarotCardName(nextLevel)} #${transformationNumber}!`)
      } else {
        // Just award merit without leveling up
        const newMeritCount = (currentProfile.merit_count || 0) + 1

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            merit_count: newMeritCount,
            last_status_update: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) throw updateError

        // Log the merit award
        await supabase
          .from('merit_logs')
          .insert([{
            user_id: userId,
            awarded_by: user.id,
            reason: reason,
            merit_count_after: newMeritCount,
            leveled_up: false,
            new_tarot_level: currentProfile.tarot_level || 1
          }])

        const recipientName = userId === user.id ? 'You' : currentProfile.username
        const progressNeeded = Math.max(0, 100 - progressPercentage)
        setMessage(`Merit awarded to ${recipientName}! 🌟 (${progressNeeded.toFixed(1)}% more progress needed to level up)`)
      }

      // Clear search if awarding to someone else
      if (userId !== user.id) {
        setSearchTerm('')
        setSelectedUser(null)
        setSearchResults([])
      }
      
    } catch (error) {
      console.error('Error awarding merit:', error)
      setMessage('Error awarding merit: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = profile?.username === 'JPR333' || user?.email === 'jproney@gmail.com'
  const meritCircles = getMeritCircleStates()
  const overallProgress = calculateMeritPercentage()
  const isMaxLevel = (profile?.tarot_level || 1) >= 26

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f1e8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem 1rem',
      color: '#8b5a3c',
      position: 'relative'
    }}>
      {/* Welcome Window for New Users */}
      {showWelcome && (
        <div style={{
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
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: '#faf8f3',
            borderRadius: '24px',
            padding: '3rem 2.5rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(139, 90, 60, 0.3)',
            border: '2px solid rgba(210, 105, 30, 0.2)',
            position: 'relative',
            textAlign: 'center'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowWelcome(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#8b5a3c',
                opacity: 0.6,
                padding: '0.5rem'
              }}
            >
              ×
            </button>

            <div style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#d2691e',
              marginBottom: '2rem',
              fontStyle: 'italic'
            }}>
              Welcome to the Game of Cups
            </div>

            {/* Explanation text */}
            <div style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#8b5a3c',
              fontStyle: 'italic',
              marginBottom: '2.5rem',
              textAlign: 'left'
            }}>
              <p style={{ marginBottom: '1rem' }}>
                <em>The game of belonging to Casa de Copas...</em>
              </p>
              
              <p style={{ marginBottom: '1rem' }}>
                <em>Purchase Palomas to progress through your Tarot journey. Earn merits through community contributions and volunteering to unlock your next card transformation.</em>
              </p>
              
              <p style={{ marginBottom: '1rem' }}>
                <em>Your journey: King of Swords → ... → Ace of Swords → Ace of Cups → ... → Knight of Cups (the ultimate achievement).</em>
              </p>
              
              <p style={{ marginBottom: '0' }}>
                <em>The earlier you begin your journey, the more meaningful your contributions become to the House.</em>
              </p>
            </div>

            {/* Got it button */}
            <button
              onClick={() => setShowWelcome(false)}
              style={{
                background: 'linear-gradient(135deg, #d2691e, #cd853f)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '1rem 2rem',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500',
                boxShadow: '0 4px 20px rgba(210, 105, 30, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 25px rgba(210, 105, 30, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 20px rgba(210, 105, 30, 0.3)'
              }}
            >
              Begin Your Journey
            </button>
          </div>
        </div>
      )}

      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            background: 'rgba(210, 105, 30, 0.1)',
            border: '1px solid rgba(210, 105, 30, 0.3)',
            borderRadius: '20px',
            padding: '0.8rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            color: '#d2691e',
            fontWeight: '500'
          }}
        >
          ← Back
        </button>

        {/* Current Tarot Card Display */}
        <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
          <div style={{
            fontSize: '1.2rem',
            color: '#8b5a3c',
            marginBottom: '1rem'
          }}>
            {getTarotCardName(profile?.tarot_level || 1)}
            {profile?.transformation_numbers && profile.transformation_numbers[profile.tarot_level] && (
              <span style={{ 
                fontSize: '0.9rem', 
                color: '#d2691e',
                marginLeft: '0.5rem'
              }}>
                #{profile.transformation_numbers[profile.tarot_level]}
              </span>
            )}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#a0785a'
          }}>
            Level {profile?.tarot_level || 1} {isMaxLevel && '• MAX LEVEL ACHIEVED'}
          </div>
        </div>

        {/* Main Content - Cup and Merit Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Cup Display */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(210, 105, 30, 0.2)',
            boxShadow: '0 4px 20px rgba(139, 90, 60, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {(profile?.tarot_level || 1) >= 15 ? '🏆' : '🏆'}
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: '#d2691e',
              marginBottom: '0.5rem'
            }}>
              {profile?.cup_count || 0}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#a0785a'
            }}>
              {(profile?.tarot_level || 1) >= 15 ? 'Grails' : 'Cups'}
            </div>
          </div>

          {/* Merit Display - Vertical Circles with Percentages */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              fontSize: '0.9rem',
              color: '#a0785a',
              marginBottom: '0.5rem'
            }}>
              Transformation Progress
            </div>
            
            {/* Merit Circles - 3 circles stacked vertically (top to bottom: 2, 1, 0) */}
            {[2, 1, 0].map((index) => {
              const circle = meritCircles[index]
              return (
                <div
                  key={index}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '3px solid #d2691e',
                    backgroundColor: circle.filled ? '#d2691e' : 'rgba(210, 105, 30, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: circle.filled ? 'white' : '#d2691e',
                    boxShadow: circle.filled ? '0 0 20px rgba(210, 105, 30, 0.4)' : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  {circle.filled ? '⭐' : `${circle.percentage}%`}
                </div>
              )
            })}
            
            {/* Overall progress display */}
            <div style={{
              fontSize: '0.8rem',
              color: '#d2691e',
              fontWeight: '600',
              marginTop: '0.5rem'
            }}>
              {isMaxLevel ? 'Journey Complete!' : 
               overallProgress >= 100 ? 'Ready to Transform!' : `${overallProgress.toFixed(1)}% Complete`}
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(210, 105, 30, 0.2)',
          marginBottom: '2rem'
        }}>
          <div style={{
            fontSize: '1rem',
            fontWeight: '500',
            color: '#8b5a3c',
            marginBottom: '0.5rem'
          }}>
            {isMaxLevel ? 'Maximum Level Achieved' : 
             overallProgress >= 100 ? 'Ready for Next Transformation!' :
             'Progress to Next Transformation'}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#a0785a',
            marginBottom: '1rem'
          }}>
            {isMaxLevel ? 
              'You have reached Knight of Cups - the highest achievement in Casa de Copas' :
              overallProgress >= 100 ?
                `You can transform to ${getTarotCardName((profile?.tarot_level || 1) + 1)}` :
                `${overallProgress.toFixed(1)}% progress from Paloma purchases`}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: '#c4a373',
            lineHeight: '1.4'
          }}>
            {isMaxLevel ? 
              'Welcome to the inner circle of Casa de Copas. Your journey through the Tarot is complete.' :
              'Purchase Palomas to advance your transformation progress. Community contributions and volunteering earn you recognition when you reach 100%.'}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: message.includes('Error') ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)',
            color: message.includes('Error') ? '#dc3545' : '#28a745',
            borderRadius: '16px',
            border: `1px solid ${message.includes('Error') ? 'rgba(220, 53, 69, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`
          }}>
            {message}
          </div>
        )}

        {/* Admin Controls Section */}
        {isAdmin && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid rgba(210, 105, 30, 0.2)',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: '#8b5a3c',
              marginBottom: '1rem'
            }}>
              Admin Controls
            </div>
            
            {/* Award Merit to Self */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <button
                onClick={() => awardMerit(user?.id)}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.8rem 1.5rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  opacity: loading ? 0.5 : 1
                }}
              >
                Award Merit to Self
              </button>
            </div>

            {/* Search User to Award Merit */}
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#8b5a3c'
              }}>
                Award Merit to User
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search username..."
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(210, 105, 30, 0.3)',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  color: '#8b5a3c',
                  marginBottom: '1rem'
                }}
              />
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid rgba(210, 105, 30, 0.3)',
                  borderRadius: '12px',
                  marginTop: '-1rem',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 20px rgba(139, 90, 60, 0.1)',
                  zIndex: 1000
                }}>
                  {searchResults.map((profile, index) => (
                    <div
                      key={profile.id}
                      onClick={() => selectUser(profile)}
                      style={{
                        padding: '0.8rem',
                        cursor: 'pointer',
                        borderBottom: index < searchResults.length - 1 ? '1px solid rgba(210, 105, 30, 0.1)' : 'none',
                        fontSize: '0.9rem',
                        color: '#8b5a3c'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(210, 105, 30, 0.1)'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: '500' }}>{profile.username}</div>
                      <div style={{ fontSize: '0.8rem', color: '#a0785a' }}>
                        {profile.cup_count || 0} cups • {getTarotCardName(profile.tarot_level || 1)} • {profile.merit_count || 0} merits
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Award Merit Button */}
              <button
                onClick={() => selectedUser && awardMerit(selectedUser.id)}
                disabled={loading || !selectedUser}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  backgroundColor: loading || !selectedUser ? '#cccccc' : '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {loading ? 'Processing...' : 
                 selectedUser ? `Award Merit to ${selectedUser.username}` : 
                 'Select a user to award merit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TarotCupsPage
