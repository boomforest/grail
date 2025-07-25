import React, { useState, useEffect } from 'react'

// Helper functions for tarot system
const getTarotCardName = (level) => {
  const cards = [
    'Ace of Cups', 'Two of Cups', 'Three of Cups', 'Four of Cups', 'Five of Cups',
    'Six of Cups', 'Seven of Cups', 'Eight of Cups', 'Nine of Cups', 'Ten of Cups',
    'Page of Cups', 'Knight of Cups', 'Queen of Cups', 'King of Cups'
  ]
  return cards[Math.min(level - 1, cards.length - 1)] || 'Ace of Cups'
}

function TarotCupsPage({ profile, onBack, supabase, user, onProfileUpdate }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [allProfiles, setAllProfiles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)

  // Check if user should see welcome window
  useEffect(() => {
    // Show welcome window for testing - change this condition back to (profile.cup_count || 0) === 0 in production
    setShowWelcome(true)
  }, [profile])

  // Load all profiles for search
  useEffect(() => {
    const loadProfiles = async () => {
      if (!supabase) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, cup_count, tarot_level, merit_count')
          .order('username')
        
        if (error) throw error
        setAllProfiles(data || [])
      } catch (error) {
        console.error('Error loading profiles:', error)
      }
    }
    
    loadProfiles()
  }, [supabase])

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
        .select('merit_count, tarot_level, cup_count, username')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      // Can only earn merits if you have at least 1 cup
      if ((currentProfile.cup_count || 0) < 1) {
        setMessage('This user needs at least 1 cup to receive merits!')
        return
      }

      const newMeritCount = (currentProfile.merit_count || 0) + 1
      let updateData = {
        merit_count: newMeritCount,
        last_status_update: new Date().toISOString()
      }

      // Check if they can level up: need 3 merits AND at least 1 cup
      const currentTarotLevel = currentProfile.tarot_level || 1
      
      if (newMeritCount >= 3 && (currentProfile.cup_count || 0) >= 1) {
        updateData = {
          ...updateData,
          merit_count: 0, // Reset merits after leveling up
          tarot_level: currentTarotLevel + 1,
          cup_count: (currentProfile.cup_count || 0) - 1 // Consume 1 cup
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (updateError) throw updateError

      // Log the merit award
      await supabase
        .from('merit_logs')
        .insert([{
          user_id: userId,
          awarded_by: user.id,
          reason: reason,
          merit_count_after: newMeritCount >= 3 ? 0 : newMeritCount,
          leveled_up: newMeritCount >= 3 && (currentProfile.cup_count || 0) >= 1,
          new_tarot_level: newMeritCount >= 3 && (currentProfile.cup_count || 0) >= 1 ? currentTarotLevel + 1 : currentTarotLevel
        }])

      // Update parent component if it's the current user
      if (userId === user.id && onProfileUpdate) {
        const updatedProfile = {
          ...profile,
          ...updateData
        }
        onProfileUpdate(updatedProfile)
      }

      // Show success message
      const recipientName = userId === user.id ? 'You' : currentProfile.username
      if (newMeritCount >= 3 && (currentProfile.cup_count || 0) >= 1) {
        setMessage(`Merit awarded to ${recipientName}! Tarot level up to ${getTarotCardName(currentTarotLevel + 1)}! 🎉`)
      } else {
        setMessage(`Merit awarded to ${recipientName}! 🌟`)
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
                <em>Earn cups by using palomas (50 palomas = 1 cup during beta testing) and level up your cups to tarot cards with merits, earned by volunteering or bringing something extra to the project.</em>
              </p>
              
              <p style={{ marginBottom: '1rem' }}>
                <em>A full cup → Ace of Cups → second full cup → Two of Cups... when you reach the King of Cups you can choose your own identifying tarot card and you are officially a member.</em>
              </p>
              
              <p style={{ marginBottom: '0' }}>
                <em>Our most exclusive events will always have 55 slots reserved: 33 for the highest ranking members, 22 for the users with the most cups. This means we want to build a community on giving but with more focus on giving and participation.</em>
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
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#a0785a'
          }}>
            Level {profile?.tarot_level || 1}
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
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
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
              Cups
            </div>
          </div>

          {/* Merit Display - Vertical Orange Circles */}
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
              Merits
            </div>
            
            {/* Merit Circles - 3 circles stacked vertically */}
            {[2, 1, 0].map((index) => (
              <div
                key={index}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #d2691e',
                  backgroundColor: (profile?.merit_count || 0) > index ? '#d2691e' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: (profile?.merit_count || 0) > index ? 'white' : '#d2691e',
                  boxShadow: (profile?.merit_count || 0) > index ? '0 0 20px rgba(210, 105, 30, 0.4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {(profile?.merit_count || 0) > index ? '⭐' : ''}
              </div>
            ))}
            
            {/* Merit overflow indicator */}
            {(profile?.merit_count || 0) >= 3 && (
              <div style={{
                fontSize: '0.8rem',
                color: '#d2691e',
                fontWeight: '600',
                marginTop: '0.5rem'
              }}>
                Ready to level up!
              </div>
            )}
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
            {(profile?.cup_count || 0) < 1 ? 'Need 1 cup to start earning merits' : 
             'Progress to next tarot level'}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#a0785a',
            marginBottom: '1rem'
          }}>
            {(profile?.cup_count || 0) < 1 ? 
              'Collect Palomas to earn cups automatically' :
              `${profile?.merit_count || 0} / 3 merits earned`}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: '#c4a373',
            lineHeight: '1.4'
          }}>
            {(profile?.cup_count || 0) < 1 ? 
              'Once you have a cup, you can start earning merits through positive community contributions.' :
              (profile?.merit_count || 0) >= 3 ? 
                'You have enough merits! Next tarot level will consume 1 cup and reset merits.' :
                `Need ${3 - (profile?.merit_count || 0)} more merits to advance to ${getTarotCardName((profile?.tarot_level || 1) + 1)}.`}
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
                        {profile.cup_count || 0} cups • Level {profile.tarot_level || 1} • {profile.merit_count || 0} merits
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
                {loading ? 'Awarding Merit...' : 
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
