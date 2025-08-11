import React, { useState } from 'react'

function SendMeritsForm({ onBack, message, supabase, user, allProfiles }) {
  const [meritData, setMeritData] = useState({
    recipient: '',
    amount: '1',
    reason: ''
  })
  const [isAwarding, setIsAwarding] = useState(false)
  const [localMessage, setLocalMessage] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Search users as they type
  const handleRecipientChange = (value) => {
    setMeritData({ ...meritData, recipient: value })
    
    if (value.length > 0) {
      const filtered = allProfiles.filter(profile => 
        profile.username.toLowerCase().includes(value.toLowerCase()) ||
        profile.email?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5) // Show max 5 results
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }

  const selectUser = (username) => {
    setMeritData({ ...meritData, recipient: username })
    setSearchResults([])
  }

  const handleSendMerits = async () => {
    if (!supabase || !user) {
      setLocalMessage('Please wait for connection...')
      return
    }

    const recipient = meritData.recipient.trim().toUpperCase()
    const amount = parseInt(meritData.amount)
    const reason = meritData.reason.trim() || 'Admin merit award'

    if (!recipient || !amount || amount < 1) {
      setLocalMessage('Please fill in recipient and amount (minimum 1)')
      return
    }

    try {
      setIsAwarding(true)
      setLocalMessage('Awarding merits...')

      // Find recipient
      const { data: recipientProfile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', recipient)
        .single()

      if (findError || !recipientProfile) {
        setLocalMessage('Recipient not found')
        return
      }

      // Check if recipient has at least 1 cup
      if ((recipientProfile.cup_count || 0) < 1) {
        setLocalMessage('Recipient needs at least 1 cup to receive merits!')
        return
      }

      // Award merits one by one to handle level-ups properly
      let successCount = 0
      let levelUps = 0

      for (let i = 0; i < amount; i++) {
        // Get current state for each merit
        const { data: currentProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('merit_count, tarot_level, cup_count')
          .eq('id', recipientProfile.id)
          .single()

        if (fetchError) {
          console.error('Error fetching current profile:', fetchError)
          break
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
          levelUps++
        }

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', recipientProfile.id)

        if (updateError) {
          console.error('Error updating profile:', updateError)
          break
        }

        // Log the merit award
        await supabase
          .from('merit_logs')
          .insert([{
            user_id: recipientProfile.id,
            awarded_by: user.id,
            reason: reason,
            merit_count_after: newMeritCount >= 3 ? 0 : newMeritCount,
            leveled_up: newMeritCount >= 3 && (currentProfile.cup_count || 0) >= 1,
            new_tarot_level: newMeritCount >= 3 && (currentProfile.cup_count || 0) >= 1 ? currentTarotLevel + 1 : currentTarotLevel
          }])

        successCount++
      }

      // Success message
      let successMessage = `Awarded ${successCount} merit${successCount > 1 ? 's' : ''} to ${recipient}!`
      if (levelUps > 0) {
        successMessage += ` 🎉 ${levelUps} tarot level${levelUps > 1 ? 's' : ''} gained!`
      }
      
      setLocalMessage(successMessage)
      setMeritData({ recipient: '', amount: '1', reason: '' })
      
    } catch (err) {
      setLocalMessage('Merit award failed: ' + err.message)
    } finally {
      setIsAwarding(false)
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

        {/* Header */}
        <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
          <h2 style={{
            fontSize: '2rem',
            color: '#d2691e',
            margin: '0 0 0.5rem 0',
            fontWeight: '600'
          }}>
            Send Merits
          </h2>
          <div style={{
            fontSize: '1rem',
            color: '#a0785a'
          }}>
            Award merits to community members
          </div>
        </div>

        {/* Form */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(210, 105, 30, 0.2)',
          boxShadow: '0 4px 20px rgba(139, 90, 60, 0.1)',
          marginBottom: '2rem'
        }}>
          {/* Recipient Search */}
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#8b5a3c'
            }}>
              Recipient Username
            </label>
            <input
              type="text"
              value={meritData.recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder="Search username..."
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '12px',
                border: '1px solid rgba(210, 105, 30, 0.3)',
                fontSize: '1rem',
                backgroundColor: 'white',
                color: '#8b5a3c'
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
                marginTop: '0.5rem',
                boxShadow: '0 4px 20px rgba(139, 90, 60, 0.1)',
                zIndex: 1000
              }}>
                {searchResults.map((profile, index) => (
                  <div
                    key={profile.id}
                    onClick={() => selectUser(profile.username)}
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
                      {profile.cup_count || 0} cups • Level {profile.tarot_level || 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#8b5a3c'
            }}>
              Number of Merits
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={meritData.amount}
              onChange={(e) => setMeritData({ ...meritData, amount: e.target.value })}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '12px',
                border: '1px solid rgba(210, 105, 30, 0.3)',
                fontSize: '1rem',
                backgroundColor: 'white',
                color: '#8b5a3c'
              }}
            />
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#8b5a3c'
            }}>
              Reason (Optional)
            </label>
            <textarea
              value={meritData.reason}
              onChange={(e) => setMeritData({ ...meritData, reason: e.target.value })}
              placeholder="Reason for merit award..."
              rows="3"
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '12px',
                border: '1px solid rgba(210, 105, 30, 0.3)',
                fontSize: '1rem',
                backgroundColor: 'white',
                color: '#8b5a3c',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMerits}
            disabled={isAwarding}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: isAwarding ? '#cccccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isAwarding ? 'not-allowed' : 'pointer',
              boxShadow: isAwarding ? 'none' : '0 4px 15px rgba(40, 167, 69, 0.3)'
            }}
          >
            {isAwarding ? 'Awarding Merits...' : 'Award Merits'}
          </button>
        </div>

        {/* Message Display */}
        {(localMessage || message) && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: (localMessage || message).includes('failed') || (localMessage || message).includes('Error') ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)',
            color: (localMessage || message).includes('failed') || (localMessage || message).includes('Error') ? '#dc3545' : '#28a745',
            borderRadius: '16px',
            border: `1px solid ${(localMessage || message).includes('failed') || (localMessage || message).includes('Error') ? 'rgba(220, 53, 69, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`
          }}>
            {localMessage || message}
          </div>
        )}

        {/* Info Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(210, 105, 30, 0.2)',
          fontSize: '0.9rem',
          color: '#8b5a3c',
          lineHeight: '1.5'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Merit System:</div>
          • Recipients need at least 1 cup to receive merits<br/>
          • 3 merits + 1 cup = tarot level advancement<br/>
          • Leveling up consumes 1 cup and resets merits<br/>
          • Multiple merits may trigger multiple level-ups
        </div>
      </div>
    </div>
  )
}

export default SendMeritsForm
