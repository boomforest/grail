import React, { useState } from 'react'

// Tarot Cups Page Component
function TarotCupsPage({ profile, onBack, supabase, user }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Helper functions for tarot system
  const getTarotCardName = (level) => {
    const cards = [
      'Ace of Cups', 'Two of Cups', 'Three of Cups', 'Four of Cups', 'Five of Cups',
      'Six of Cups', 'Seven of Cups', 'Eight of Cups', 'Nine of Cups', 'Ten of Cups',
      'Page of Cups', 'Knight of Cups', 'Queen of Cups', 'King of Cups'
    ]
    return cards[Math.min(level - 1, cards.length - 1)] || 'Ace of Cups'
  }



  // Admin function to award merit (you can expand this for admin controls)
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

      // Check if they can level up: need 3 merits AND enough cups for next level
      const currentTarotLevel = currentProfile.tarot_level || 0
      const requiredCupsForNextLevel = currentTarotLevel + 1
      
      if (newMeritCount >= 3 && (currentProfile.cup_count || 0) >= requiredCupsForNextLevel) {
        updateData = {
          ...updateData,
          merit_count: 0,
          tarot_level: currentTarotLevel + 1
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (updateError) throw updateError

      // Log the merit award (optional - for admin tracking)
      await supabase
        .from('merit_logs')
        .insert([{
          user_id: userId,
          awarded_by: user.id,
          reason: reason,
          merit_count_after: newMeritCount >= 3 && (currentProfile.cup_count || 0) >= requiredCupsForNextLevel ? 0 : newMeritCount,
          leveled_up: newMeritCount >= 3 && (currentProfile.cup_count || 0) >= requiredCupsForNextLevel,
          new_tarot_level: newMeritCount >= 3 && (currentProfile.cup_count || 0) >= requiredCupsForNextLevel ? currentTarotLevel + 1 : currentTarotLevel
        }])

      if (newMeritCount >= 3 && (currentProfile.cup_count || 0) >= requiredCupsForNextLevel) {
        setMessage(`Merit awarded! Tarot level up to ${getTarotCardName(currentTarotLevel + 1)}! 🎉`)
      } else if (newMeritCount >= 3) {
        setMessage(`Merit awarded! Need ${requiredCupsForNextLevel - (currentProfile.cup_count || 0)} more cups to level up tarot card.`)
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

  // Admin function to award cups directly
  const awardCup = async (userId, amount = 1, reason = 'Special recognition') => {
    if (!supabase || !user) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('profiles')
        .update({
          cup_count: (profile?.cup_count || 0) + amount,
          last_status_update: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Log the cup award
      await supabase
        .from('cup_logs')
        .insert([{
          user_id: userId,
          awarded_by: user.id,
          amount: amount,
          reason: reason,
          cup_count_after: (profile?.cup_count || 0) + amount
        }])

      setMessage(`${amount} cup${amount > 1 ? 's' : ''} awarded! 🏆`)
      
    } catch (error) {
      console.error('Error awarding cup:', error)
      setMessage('Error awarding cup: ' + error.message)
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

        {/* Cup Count Section */}
        <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
          <div style={{
            fontSize: '1.2rem',
            color: '#8b5a3c',
            marginBottom: '1rem'
          }}>
            {(profile?.tarot_level || 0) === 0 ? 
              'No Tarot Card Yet' : 
              getTarotCardName(profile?.tarot_level || 0)}
          </div>
        </div>

        {/* Main Content Area - Matches your sketch */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '2rem',
          justifyContent: 'center',
          marginBottom: '3rem'
        }}>
          {/* Tarot Card Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(210, 105, 30, 0.2)',
            boxShadow: '0 4px 20px rgba(139, 90, 60, 0.1)',
            minWidth: '200px'
          }}>
            <div style={{
              fontSize: '1rem',
              color: '#d2691e',
              fontWeight: '600',
              marginBottom: '1.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              TAROT
            </div>
            
            <div style={{
              fontSize: '6rem',
              marginBottom: '1rem',
              color: '#d2691e'
            }}>
              🏆
            </div>
            
            <div style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: '#8b5a3c',
              marginBottom: '0.5rem'
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

          {/* Merit Light - Single circle showing current merits */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '3px solid #d2691e',
                backgroundColor: (profile?.merit_count || 0) > 0 ? '#d2691e' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: '600',
                color: (profile?.merit_count || 0) > 0 ? 'white' : '#d2691e',
                boxShadow: (profile?.merit_count || 0) > 0 ? '0 0 20px rgba(210, 105, 30, 0.4)' : 'none'
              }}
            >
              {profile?.merit_count || 0}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#a0785a',
              textAlign: 'center'
            }}>
              merits
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
            {(profile?.cup_count || 0) < 1 ? 'Need 1 cup to start earning merits' : 
             (profile?.tarot_level || 0) === 0 ? 'Progress to Ace of Cups' : 
             `Progress to ${getTarotCardName((profile?.tarot_level || 0) + 1)}`}
          </div>
          <div style={{
            fontSize: '0.9rem',
            color: '#a0785a',
            marginBottom: '1rem'
          }}>
            {(profile?.cup_count || 0) < 1 ? 
              'Earn your first cup to unlock the merit system' :
              `${profile?.merit_count || 0} / 3 merits earned`}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: '#c4a373',
            lineHeight: '1.4'
          }}>
            {(profile?.cup_count || 0) < 1 ? 
              'Once you have a cup, you can start earning merits through positive community contributions.' :
              (profile?.tarot_level || 0) === 0 ? 
                'Get 3 merits with at least 1 cup to unlock the Ace of Cups!' :
                `Need ${((profile?.tarot_level || 0) + 1) - (profile?.cup_count || 0)} more cups and ${3 - (profile?.merit_count || 0)} more merits to advance to the next tarot level.`}
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

        {/* Admin Controls Section (expandable for admin features) */}
        {/* You can uncomment this section when you want admin controls */}
        {/*
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
              onClick={() => awardMerit(profile?.id)}
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
            <button
              onClick={() => awardCup(profile?.id)}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #d2691e, #cd853f)',
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
              Award Cup
            </button>
          </div>
        </div>
        */}
      </div>
    </div>
  )
}

export default TarotCupsPage

// Database schema additions needed:
/*
-- Add to profiles table:
ALTER TABLE profiles ADD COLUMN cup_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN tarot_level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN merit_count INTEGER DEFAULT 0;

-- Optional: Create merit_logs table for admin tracking:
CREATE TABLE merit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  awarded_by UUID REFERENCES profiles(id),
  reason TEXT,
  merit_count_after INTEGER,
  leveled_up BOOLEAN DEFAULT FALSE,
  new_tarot_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Create cup_logs table for admin tracking:
CREATE TABLE cup_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  awarded_by UUID REFERENCES profiles(id),
  amount INTEGER,
  reason TEXT,
  cup_count_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/
