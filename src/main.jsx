const formatTimeAgo = (dateString) => {
    const now = new Date()
    const then = new Date(dateString)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
}

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import WalletInput from './WalletInput';

function App() {
  const [supabase, setSupabase] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState('login')
  const [showSendForm, setShowSendForm] = useState(null)
  const [showReleaseForm, setShowReleaseForm] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showManifesto, setShowManifesto] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    name: ''
  })
  const [transferData, setTransferData] = useState({
    recipient: '',
    amount: ''
  })
  const [releaseData, setReleaseData] = useState({
    amount: '',
    reason: ''
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const initSupabase = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        )
        setSupabase(client)
        setMessage('')

        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await ensureProfileExists(session.user, client)
          await loadAllProfiles(client)
          await loadNotifications(client)
          
          // Set up real-time subscription for notifications (only if table exists)
          try {
            const notificationSubscription = client
              .channel('release_notifications')
              .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'release_notifications' },
                (payload) => {
                  console.log('New notification received:', payload)
                  loadNotifications(client)
                }
              )
              .subscribe()

            // Store subscription for cleanup
            client.notificationSubscription = notificationSubscription
          } catch (subscriptionError) {
            console.warn('Could not set up real-time notifications:', subscriptionError)
          }
        }
      } catch (error) {
        setMessage('Connection failed')
        console.error('Supabase error:', error)
      }
    }
    initSupabase()
    
    // Cleanup subscription on unmount
    return () => {
      if (supabase?.notificationSubscription) {
        supabase.notificationSubscription.unsubscribe()
      }
    }
  }, [])

  const ensureProfileExists = async (authUser, client = supabase) => {
    try {
      const { data: existingProfile } = await client
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (existingProfile) {
        setProfile(existingProfile)
        return existingProfile
      }

      const username = authUser.user_metadata?.username || 'USER' + Math.random().toString(36).substr(2, 3).toUpperCase()
      const isAdmin = username === 'JPR333' || authUser.email === 'jproney@gmail.com'
      
      const newProfile = {
        id: authUser.id,
        username: authUser.email === 'jproney@gmail.com' ? 'JPR333' : username,
        email: authUser.email,
        name: authUser.user_metadata?.name || '',
        dov_balance: isAdmin ? 1000000 : 0,
        djr_balance: isAdmin ? 1000000 : 0
      }

      const { data: createdProfile, error: createError } = await client
        .from('profiles')
        .insert([newProfile])
        .select()
        .single()

      if (createError) {
        setMessage('Profile creation failed: ' + createError.message)
        return null
      }

      setProfile(createdProfile)
      setMessage('Profile created successfully!')
      return createdProfile
    } catch (error) {
      setMessage('Error creating profile: ' + error.message)
      return null
    }
  }

  // Load notifications for admin view - simplified approach
  const loadNotifications = async (client = supabase) => {
    if (!client) {
      console.log('No supabase client available')
      return
    }

    try {
      console.log('Attempting to load notifications...')
      
      // Simple query without any joins
      const response = await client
        .from('release_notifications')
        .select('id, user_id, username, token_type, amount, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      
      console.log(`Supabase response: ${response.error ? 'ERROR' : 'SUCCESS'} - Found ${response.data?.length || 0} notifications`)
      
      if (response.error) {
        console.error('Supabase error:', response.error)
        setNotifications([])
        return
      }
      
      console.log(`Successfully loaded ${response.data.length} notifications`)
      setNotifications(response.data || [])
      
    } catch (error) {
      console.error('Catch block error:', error)
      setNotifications([])
    }
  }

  // Create notification when releasing tokens
  const createReleaseNotification = async (amount, reason, tokenType) => {
    if (!supabase || !profile) {
      console.log('Cannot create notification - missing supabase or profile')
      return
    }

    try {
      const notificationData = {
        user_id: user.id,
        username: profile.username,
        token_type: tokenType,
        amount: parseFloat(amount),
        reason: reason || 'Token release'
      }
      
      console.log(`Creating notification: ${profile.username} released ${amount} ${tokenType}`)
      
      const response = await supabase
        .from('release_notifications')
        .insert([notificationData])
        .select()

      if (response.error) {
        console.error(`ERROR creating notification: ${response.error.message}`)
      } else {
        console.log(`SUCCESS: Notification created!`)
      }
    } catch (error) {
      console.error(`CATCH ERROR: ${error.message}`)
    }
  }

  // NEW FUNCTION: Handle wallet address save
  const handleWalletSave = async (walletAddress) => {
    if (!supabase || !user) {
      console.log('No supabase client or user available')
      return
    }

    try {
      // Update the profile with the wallet address
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress || null })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving wallet address:', error)
        setMessage('Failed to save wallet address: ' + error.message)
        return
      }

      // Refresh the profile to show the updated wallet address
      await ensureProfileExists(user)
      
      if (walletAddress) {
        setMessage('Wallet address saved! 🎉')
      } else {
        setMessage('Wallet address removed')
      }
    } catch (error) {
      console.error('Error handling wallet save:', error)
      setMessage('Error saving wallet: ' + error.message)
    }
  }

  const loadAllProfiles = async (client = supabase) => {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAllProfiles(data || [])
    } catch (error) {
      console.error('Error loading profiles:', error)
    }
  }

  const handleRegister = async () => {
    if (!supabase) {
      setMessage('Please wait for connection...')
      return
    }

    if (!formData.email || !formData.password || !formData.username) {
      setMessage('Please fill in all required fields')
      return
    }

    if (!/^[A-Z]{3}[0-9]{3}$/.test(formData.username)) {
      setMessage('Username must be 3 letters + 3 numbers (e.g., ABC123)')
      return
    }

    try {
      setLoading(true)
      setMessage('Creating account...')

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            name: formData.name
          }
        }
      })

      if (authError) {
        setMessage('Registration failed: ' + authError.message)
        return
      }

      if (!authData.user) {
        setMessage('Registration failed: No user returned')
        return
      }

      setMessage('Account created, setting up profile...')
      const profile = await ensureProfileExists(authData.user)
      
      if (profile) {
        setUser(authData.user)
        await loadAllProfiles()
        await loadNotifications()
        setMessage('Registration successful!')
        setFormData({ email: '', password: '', username: '', name: '' })
      } else {
        setMessage('Account created but profile setup failed. Please try logging in.')
      }
    } catch (err) {
      setMessage('Registration error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!supabase) {
      setMessage('Please wait for connection...')
      return
    }

    if (!formData.email || !formData.password) {
      setMessage('Please fill in email and password')
      return
    }

    try {
      setLoading(true)
      setMessage('Logging in...')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        setMessage('Login failed: ' + error.message)
        return
      }

      setMessage('Login successful, checking profile...')
      setUser(data.user)
      await ensureProfileExists(data.user)
      await loadAllProfiles()
      await loadNotifications()
      setFormData({ email: '', password: '', username: '', name: '' })
    } catch (err) {
      setMessage('Login error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    // Cleanup real-time subscription
    if (supabase?.notificationSubscription) {
      supabase.notificationSubscription.unsubscribe()
    }
    
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
    setAllProfiles([])
    setNotifications([])
    setShowSettings(false)
    setShowSendForm(null)
    setShowReleaseForm(null)
    setShowNotifications(false)
    setShowManifesto(false)
    setMessage('')
    setFormData({ email: '', password: '', username: '', name: '' })
    setTransferData({ recipient: '', amount: '' })
    setReleaseData({ amount: '', reason: '' })
  }

  const handleAdminTransfer = async (tokenType) => {
    if (!supabase || !profile) {
      setMessage('Please wait for connection...')
      return
    }

    const recipient = transferData.recipient.trim().toUpperCase()
    const amount = parseFloat(transferData.amount)

    if (!recipient || !amount) {
      setMessage('Please fill in recipient and amount')
      return
    }

    try {
      setIsTransferring(true)

      // Search for recipient in database directly
      const { data: recipientProfile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', recipient)
        .single()

      if (findError || !recipientProfile) {
        setMessage('Recipient not found')
        return
      }

      if (recipientProfile.id === user.id) {
        setMessage('Cannot send to yourself')
        return
      }

      const currentBalance = tokenType === 'DOV' ? profile.dov_balance : profile.djr_balance
      if (currentBalance < amount) {
        setMessage('Insufficient tokens')
        return
      }

      if (tokenType === 'DOV') {
        await supabase
          .from('profiles')
          .update({ dov_balance: profile.dov_balance - amount })
          .eq('id', user.id)

        await supabase
          .from('profiles')
          .update({ dov_balance: recipientProfile.dov_balance + amount })
          .eq('id', recipientProfile.id)
      } else {
        await supabase
          .from('profiles')
          .update({ djr_balance: profile.djr_balance - amount })
          .eq('id', user.id)

        await supabase
          .from('profiles')
          .update({ djr_balance: recipientProfile.djr_balance + amount })
          .eq('id', recipientProfile.id)
      }

      setMessage('Sent ' + amount + ' ' + tokenType + ' to ' + recipient + '!')
      setTransferData({ recipient: '', amount: '' })
      setShowSendForm(null)
      
      await ensureProfileExists(user)
      await loadAllProfiles()
    } catch (err) {
      setMessage('Transfer failed: ' + err.message)
    } finally {
      setIsTransferring(false)
    }
  }

  const handleRelease = async (tokenType) => {
    if (!supabase || !profile) {
      setMessage('Please wait for connection...')
      return
    }

    const amount = parseFloat(releaseData.amount)
    const reason = releaseData.reason.trim() || 'Token release'

    if (!amount) {
      setMessage('Please enter amount')
      return
    }

    const currentBalance = tokenType === 'DOV' ? profile.dov_balance : profile.djr_balance
    if (currentBalance < amount) {
      setMessage('Insufficient tokens')
      return
    }

    try {
      setIsReleasing(true)

      if (tokenType === 'DOV') {
        await supabase
          .from('profiles')
          .update({ dov_balance: profile.dov_balance - amount })
          .eq('id', user.id)
      } else {
        await supabase
          .from('profiles')
          .update({ djr_balance: profile.djr_balance - amount })
          .eq('id', user.id)
      }

      // Create notification for all releases (both DOV/Palomas and DJR/Palomitas)
      console.log(`About to create notification for ${tokenType} release`)
      await createReleaseNotification(amount, reason, tokenType)
      console.log('Finished creating notification')

      setMessage('Released ' + amount + ' ' + tokenType + '!')
      setReleaseData({ amount: '', reason: '' })
      setShowReleaseForm(null)
      
      await ensureProfileExists(user)
      await loadAllProfiles()
      await loadNotifications() // Refresh notifications
    } catch (err) {
      setMessage('Release failed: ' + err.message)
    } finally {
      setIsReleasing(false)
    }
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0)
  }

  const formatWalletAddress = (address) => {
    if (!address) return 'No wallet connected'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const isAdmin = profile?.username === 'JPR333' || user?.email === 'jproney@gmail.com'

  // Manifesto Popup Component
  const ManifestoPopup = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#f5f5dc',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative',
        color: '#8b4513',
        lineHeight: '1.6'
      }}>
        <button
          onClick={() => setShowManifesto(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#8b4513'
          }}
        >
          ✕
        </button>
        
        <h1 style={{
          fontSize: '2rem',
          color: '#d2691e',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          THE ERA OF CUPS — MANIFESTO
        </h1>
        
        <div style={{ fontSize: '0.95rem', textAlign: 'left' }}>
          <p><em>For those who remember, and those ready to return.</em></p>
          
          <p>We declare the dawn of the Era of CUPS — a time foretold in the marrow of the earth and the hum of every throat. We are the Children of Sound, the Keepers of Frequency, the Builders of Beauty. We gather now—not to seize power, but to dissolve it. Not to lead, but to lift.</p>
          
          <p style={{ textAlign: 'center', fontWeight: 'bold', margin: '1.5rem 0' }}>
            CUPS is not a kingdom.<br/>
            It is a vessel.<br/>
            It holds what overflows.<br/>
            It breaks when clutched.
          </p>
          
          <p><strong>We believe:</strong></p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>I. SOUND IS THE FIRST MEDICINE</h3>
          <p>Before language, there was tone. Before borders, there was song. We return to sound—not as entertainment, but as the sacred river that cuts through the noise. Every voice is an instrument. Every silence is a hymn. We tune ourselves daily, and when the world slips out of tune, we will sing it back.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>II. LOVE IS NON-BINDING, YET BINDING STILL</h3>
          <p>We are not here to chain the heart, but to unleash it. Love, in all its forms, is the only wealth we seek. We judge not by the shape of your bonds, but by the purity of your offering. Does your love grow what it touches? Does it heal, rather than harm? Good—pour it here.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>III. BEAUTY IS THE FINAL REBELLION</h3>
          <p>In the face of a dying system obsessed with efficiency, beauty becomes our shield and sword. We craft by hand, build slow, and honor what lasts. We stitch color into gray spaces, we plant gardens in the cracks. To live beautifully is our resistance. To create beauty is our prayer.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>IV. THE BODY IS THE ALTAR</h3>
          <p>We return to our bodies—not as burdens, but as vessels of joy, pleasure, pain, and wisdom. We eat well, we move with intention, we sweat alongside our kin. This flesh is sacred. It remembers what the mind forgets.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>V. REDEMPTION IS NON-NEGOTIABLE</h3>
          <p>We will be known as the house that opens its doors when others close them. No one is too far gone. No story is too dark. If you can carry your shame to the threshold, we will help you burn it. Here, scars are not hidden—they are sung.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>VI. THE EARTH IS OUR ORIGINAL CRAFTSWOMAN</h3>
          <p>We walk lightly. We build with what she gives us. We do not conquer, we converse. Every stone, every tree, every drop of water is a witness to our covenant. We are not above the earth. We are of it.</p>
          
          <h3 style={{ color: '#d2691e', marginTop: '1.5rem' }}>VII. WE ARE THE COUNCIL OF CREATORS</h3>
          <p>There are no kings here. No masters, no servants. Only creators—meeting in circle, speaking in truth, acting in love. We do not scale. We do not sell what cannot be sold. Our wealth is measured in frequency, in the hearts we lift, in the beauty we leave behind.</p>
          
          <p style={{ textAlign: 'center', fontWeight: 'bold', margin: '2rem 0 1rem 0' }}>
            This is the Era of CUPS.<br/>
            We drink deeply.<br/>
            We pour freely.<br/>
            We break only to be remade.
          </p>
          
          <p style={{ textAlign: 'center', fontStyle: 'italic' }}>
            Come now. The table is set.<br/>
            The first song waits.
          </p>
          
          <p style={{ textAlign: 'right', marginTop: '2rem', fontStyle: 'italic' }}>
            <em>Signed,<br/>
            The Founders of the Era of CUPS</em>
          </p>
        </div>
      </div>
    </div>
  )

  // Floating GRAIL button
  const FloatingGrailButton = () => (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(210, 105, 30, 0.9)',
      borderRadius: '25px',
      padding: '0.5rem 1rem',
      color: 'white',
      fontSize: '0.9rem',
      fontWeight: '500',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
    }}>
      <button
        onClick={() => setShowManifesto(true)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0'
        }}
      >
        🏆
      </button>
      <span>grail // antisocial media</span>
    </div>
  )

  // Notifications view for admin
  if (user && showNotifications && isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem 1rem'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <button
            onClick={() => setShowNotifications(false)}
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
            fontSize: '2.5rem',
            color: '#d2691e',
            marginBottom: '2rem',
            fontWeight: 'normal',
            textAlign: 'center'
          }}>
            🕊️ Release Feed
          </h1>

          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <button
              onClick={() => loadNotifications()}
              style={{
                background: 'rgba(210, 105, 30, 0.1)',
                border: '1px solid #d2691e',
                borderRadius: '15px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                color: '#d2691e'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          <div style={{
            maxHeight: '70vh',
            overflowY: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '1rem'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#8b4513',
                padding: '2rem',
                fontSize: '1.1rem'
              }}>
                No token releases yet...
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: '#fff',
                  borderRadius: '15px',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#d2691e',
                      fontSize: '1.1rem'
                    }}>
                      🕊️ {notification.username}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#8b4513',
                      opacity: 0.7
                    }}>
                      {formatTimeAgo(notification.created_at)}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '1rem',
                    color: '#333',
                    marginBottom: '0.5rem'
                  }}>
                    Released <strong>{formatNumber(notification.amount)} {notification.token_type === 'DOV' ? 'Palomas' : 'Palomitas'}</strong>
                  </div>
                  
                  {notification.reason && notification.reason !== 'Token release' && (
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#666',
                      fontStyle: 'italic',
                      backgroundColor: '#f8f9fa',
                      padding: '0.5rem',
                      borderRadius: '8px'
                    }}>
                      "{notification.reason}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <FloatingGrailButton />
        {showManifesto && <ManifestoPopup />}
      </div>
    )
  }

  if (user && showSendForm) {
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
            onClick={() => setShowSendForm(null)}
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
            Send {showSendForm}
          </h1>

          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '2rem',
              backgroundColor: message.includes('Sent') ? '#d4edda' : '#f8d7da',
              color: message.includes('Sent') ? '#155724' : '#721c24',
              borderRadius: '20px'
            }}>
              {message}
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              value={transferData.recipient}
              onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value.toUpperCase() })}
              placeholder="Recipient Username (ABC123)"
              maxLength={6}
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

            <input
              type="number"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
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
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={() => handleAdminTransfer(showSendForm)}
            disabled={isTransferring}
            style={{
              background: 'linear-gradient(45deg, #d2691e, #cd853f)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '1rem 3rem',
              fontSize: '1.2rem',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: isTransferring ? 0.5 : 1,
              boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)'
            }}
          >
            {isTransferring ? 'Sending...' : 'Send'}
          </button>
        </div>
        <FloatingGrailButton />
        {showManifesto && <ManifestoPopup />}
      </div>
    )
  }

  if (user && showReleaseForm) {
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
            onClick={() => setShowReleaseForm(null)}
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
            color: '#8b4513',
            marginBottom: '2rem',
            fontWeight: 'normal'
          }}>
            Release {showReleaseForm}
          </h1>

          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '2rem',
              backgroundColor: message.includes('Released') ? '#d4edda' : '#f8d7da',
              color: message.includes('Released') ? '#155724' : '#721c24',
              borderRadius: '20px'
            }}>
              {message}
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <input
              type="number"
              value={releaseData.amount}
              onChange={(e) => setReleaseData({ ...releaseData, amount: e.target.value })}
              placeholder="Amount to Release"
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.2rem',
                border: '2px solid #8b4513',
                borderRadius: '25px',
                textAlign: 'center',
                marginBottom: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <input
              type="text"
              value={releaseData.reason}
              onChange={(e) => setReleaseData({ ...releaseData, reason: e.target.value })}
              placeholder="Reason (optional)"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.2rem',
                border: '2px solid #8b4513',
                borderRadius: '25px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={() => handleRelease(showReleaseForm)}
            disabled={isReleasing}
            style={{
              background: 'linear-gradient(45deg, #8b4513, #a0522d)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '1rem 3rem',
              fontSize: '1.2rem',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: isReleasing ? 0.5 : 1,
              boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)'
            }}
          >
            {isReleasing ? 'Releasing...' : 'Release'}
          </button>
        </div>
        <FloatingGrailButton />
        {showManifesto && <ManifestoPopup />}
      </div>
    )
  }

  if (user) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '1rem',
        position: 'relative',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            padding: '0 0.5rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ⚙️
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowNotifications(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  🔔
                </button>
              )}
            </div>

            <a 
              href="https://hanglight.mx" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                fontSize: '1.5rem',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🟢
            </a>

            {showSettings && (
              <div style={{
                position: 'absolute',
                top: '3rem',
                left: '0.5rem',
                right: '0.5rem',
                background: 'white',
                borderRadius: '15px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                padding: '1rem',
                zIndex: 1000
              }}>
                {/* Wallet Input Component */}
                <WalletInput 
                  onWalletSave={handleWalletSave}
                  currentWallet={profile?.wallet_address}
                />
                
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

          {message && (
            <div style={{
              padding: '1rem',
              marginBottom: '2rem',
              backgroundColor: message.includes('successful') || message.includes('Sent') || message.includes('Released') || message.includes('connected') ? '#d4edda' : 
                             message.includes('failed') ? '#f8d7da' : '#fff3cd',
              color: message.includes('successful') || message.includes('Sent') || message.includes('Released') || message.includes('connected') ? '#155724' : 
                     message.includes('failed') ? '#721c24' : '#856404',
              borderRadius: '15px',
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}

          <div style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🕊️</div>
            <h2 style={{
              fontSize: '2.8rem',
              color: '#d2691e',
              margin: '0 0 0.5rem 0',
              fontWeight: 'normal'
            }}>
              Palomas
            </h2>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              padding: '0.75rem 1.5rem',
              display: 'inline-block',
              fontSize: '1.4rem',
              fontWeight: '500',
              color: '#8b4513',
              marginBottom: '1.5rem'
            }}>
              {formatNumber(profile?.dov_balance)}
            </div>
            <br />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
              {isAdmin ? (
                <button
                  onClick={() => setShowSendForm('DOV')}
                  style={{
                    background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '0.8rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                    width: '200px'
                  }}
                >
                  Send
                </button>
              ) : (
                <button
                  onClick={() => setShowReleaseForm('DOV')}
                  style={{
                    background: 'linear-gradient(45deg, #8b4513, #a0522d)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '0.8rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                    width: '200px'
                  }}
                >
                  Release
                </button>
              )}
              
              <button
                onClick={() => {
                  if (!user) {
                    setMessage('Please log in to collect tokens')
                    return
                  }
                  // Pass user ID to PayPal so webhook knows who paid
                  const paypalUrl = `https://www.paypal.com/ncp/payment/LEWS26K7J8FAC?custom_id=${user.id}`
                  window.open(paypalUrl, '_blank')
                  setMessage('Complete your PayPal payment. Tokens will be credited automatically!')
                }}
                style={{
                  background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.8rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                  width: '200px'
                }}
              >
                Collect
              </button>
            </div>
          </div>

          <div>
            <h2 style={{
              fontSize: '2.8rem',
              color: '#8b4513',
              margin: '0 0 0.5rem 0',
              fontWeight: 'normal'
            }}>
              Palomitas
            </h2>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🕊️</div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              padding: '0.75rem 1.5rem',
              display: 'inline-block',
              fontSize: '1.4rem',
              fontWeight: '500',
              color: '#8b4513',
              marginBottom: '1.5rem'
            }}>
              {formatNumber(profile?.djr_balance)}
            </div>
            <br />
            {isAdmin ? (
              <button
                onClick={() => setShowSendForm('DJR')}
                style={{
                  background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.8rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                  width: '200px',
                  margin: '0 auto'
                }}
              >
                Send
              </button>
            ) : (
              <button
                onClick={() => setShowReleaseForm('DJR')}
                style={{
                  background: 'linear-gradient(45deg, #8b4513, #a0522d)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.8rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                  width: '200px',
                  margin: '0 auto',
                  display: 'block'
                }}
              >
                Release
              </button>
            )}
          </div>
        </div>
        <FloatingGrailButton />
        {showManifesto && <ManifestoPopup />}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '25px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          margin: '0 0 0.5rem 0',
          color: '#d2691e'
        }}>
          GRAIL
        </h1>
        <p style={{ color: '#8b4513', margin: '0 0 2rem 0' }}>Token Exchange</p>

        <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: '20px', overflow: 'hidden' }}>
          <button
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: activeTab === 'login' ? '#d2691e' : '#f0f0f0',
              color: activeTab === 'login' ? 'white' : '#8b4513',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: activeTab === 'register' ? '#d2691e' : '#f0f0f0',
              color: activeTab === 'register' ? 'white' : '#8b4513',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Register
          </button>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '15px',
            marginBottom: '1rem',
            backgroundColor: message.includes('successful') ? '#d4edda' : 
                           message.includes('failed') ? '#f8d7da' : '#fff3cd',
            color: message.includes('successful') ? '#155724' : 
                   message.includes('failed') ? '#721c24' : '#856404',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
          style={{
            width: '100%',
            padding: '1rem',
            border: '2px solid #e0e0e0',
            borderRadius: '15px',
            marginBottom: '1rem',
            boxSizing: 'border-box',
            fontSize: '1rem',
            outline: 'none'
          }}
        />

        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Password"
          style={{
            width: '100%',
            padding: '1rem',
            border: '2px solid #e0e0e0',
            borderRadius: '15px',
            marginBottom: '1rem',
            boxSizing: 'border-box',
            fontSize: '1rem',
            outline: 'none'
          }}
        />

        {activeTab === 'register' && (
          <>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Display Name (optional)"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <input
              type="text"
              value={formData.username}
              onChange={(e) => {
                // Allow only alphanumeric characters and convert letters to uppercase
                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                setFormData({ ...formData, username: value });
              }}
              placeholder="Username (ABC123)"
              maxLength={6}
              inputMode="text"
              autoComplete="username"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </>
        )}

        <button 
          onClick={activeTab === 'login' ? handleLogin : handleRegister}
          disabled={loading || !supabase}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'linear-gradient(45deg, #d2691e, #cd853f)',
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            opacity: (loading || !supabase) ? 0.5 : 1,
            boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)'
          }}
        >
          {loading ? 'Loading...' : (activeTab === 'login' ? 'Login' : 'Register')}
        </button>
      </div>
      <FloatingGrailButton />
      {showManifesto && <ManifestoPopup />}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
