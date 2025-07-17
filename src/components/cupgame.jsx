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

  // Admin function to award merit
  const awardMerit = async (userId, reason = 'Good community contribution') => {
    if (!supabase || !user) return

    try {
      setLoading(true)
      
      // Get current profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('merit_count, tarot_level, cup_count')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      // Can only earn merits if you have at least 1 cup
      if ((currentProfile.cup_count || 0) < 1) {
        setMessage('Need at least 1 cup to start earning merits!')
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

      // Update parent component with new profile
      if (onProfileUpdate) {
        const updatedProfile = {
          ...currentProfile,
          ...updateData
        }
        onProfileUpdate(updatedProfile)
      }

      if (newMeritCount >= 3 && (currentProfile.cup_count || 0) >= 1) {
        setMessage(`Merit awarded! Tarot level up to ${getTarotCardName(currentTarotLevel + 1)}! 🎉`)
      } else {
        setMessage('Merit awarded! 🌟')
      }
      
    } catch (error) {
      console.error('Error awarding merit:', error)
      setMessage('Error awarding merit: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f1e8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem 1rem',
      color: '#8b5a3c'
    }}>
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
            {(profile?.tarot_level || 1) === 1 ? 
              getTarotCardName(profile?.tarot_level || 1) : 
              getTarotCardName(profile?.tarot_level || 1)}
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
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
              Award Merit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TarotCupsPage
