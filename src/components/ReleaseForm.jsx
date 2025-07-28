import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import LoginForm from './components/LoginForm'
import ResetPassword from './components/ResetPassword'
import Dashboard from './components/Dashboard'
import SendForm from './components/SendForm'
import ReleaseForm from './components/ReleaseForm'
import SendMeritsForm from './components/SendMeritsForm'
import NotificationsFeed from './components/NotificationsFeed'
import ManifestoPopup from './components/ManifestoPopup'
import FloatingGrailButton from './components/FloatingGrailButton'
import TarotCupsPage from './components/cupgame'
import GPTChatWindow from './components/GPTChatWindow'
import AdminGiftClaims from './components/AdminGiftClaims'

// Welcome Modal Component
const WelcomeModal = ({ onClose, onBuyPalomas }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Close button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'color 0.3s ease',
            padding: '5px',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => e.target.style.color = '#334155'}
          onMouseOut={(e) => e.target.style.color = '#64748b'}
        >
          ×
        </button>

        {/* Content */}
        <div style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: '1.6',
          color: '#1e293b'
        }}>
          {/* Welcome Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
            }}>
              🏆
            </div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Welcome to the Grail App
            </h2>
          </div>

          {/* Main description */}
          <div style={{
            fontSize: '17px',
            fontStyle: 'italic',
            marginBottom: '28px',
            color: '#475569',
            textAlign: 'center',
            padding: '0 8px'
          }}>
            This is the economy hub for the Casa de Copas community—think nonprofit casino: 
            instead of profits going to a corporation, extra funds support studio time, classes, 
            and creative grants for emerging Mexican artists.
          </div>

          {/* Beta Access Section */}
          <div style={{
            backgroundColor: '#f1f5f9',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              color: '#0f172a'
            }}>
              July–August Beta Access
            </h3>
            <p style={{
              fontSize: '16px',
              fontStyle: 'italic',
              margin: '0',
              color: '#475569',
              lineHeight: '1.5'
            }}>
              You're invited to work and play at Casa any weekday from 12–6pm, 
              as long as you have a positive Paloma balance—that's your entry ticket.
            </p>
          </div>

          {/* How it works */}
          <div style={{
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#fefce8',
              borderRadius: '12px',
              border: '1px solid #fde047'
            }}>
              <div style={{
                fontSize: '24px',
                marginRight: '16px'
              }}>
                💰
              </div>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#854d0e',
                  marginBottom: '4px'
                }}>
                  Buy Palomas through the app
                </div>
                <div style={{
                  fontSize: '14px',
                  fontStyle: 'italic',
                  color: '#a16207'
                }}>
                  Then use them inside for coffee, merch, classes, and more—just tap and go.
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <button
              onClick={onBuyPalomas}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
                transform: 'translateY(0)',
                minWidth: '200px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 24px rgba(124, 58, 237, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.3)'
              }}
            >
              Get Your First Palomas
            </button>
          </div>

          {/* Footer message */}
          <div style={{
            fontSize: '15px',
            fontStyle: 'italic',
            textAlign: 'center',
            color: '#64748b',
            lineHeight: '1.5',
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            Thanks for helping us launch this dream. You're not just testing an app—you're building a movement.
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  )
}

// Simple PayPal Button Component - No design flourishes
const PayPalButton = ({ user, onSuccess, onError, profile, syncCupsFromPalomas }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)

  useEffect(() => {
    // Check if PayPal SDK is loaded
    if (window.paypal) {
      setPaypalLoaded(true)
      renderPayPalButton()
    } else {
      // Load PayPal SDK dynamically
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo,paylater`
      script.onload = () => {
        setPaypalLoaded(true)
        renderPayPalButton()
      }
      script.onerror = () => {
        console.error('Failed to load PayPal SDK')
        onError && onError(new Error('Failed to load PayPal SDK'))
      }
      document.head.appendChild(script)
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }
    }
  }, [user])

  const renderPayPalButton = () => {
    if (!window.paypal || !user || !paypalLoaded) return

    // Clear any existing PayPal buttons
    const container = document.getElementById('paypal-button-container')
    if (container) container.innerHTML = ''

    // Render PayPal button
    window.paypal.Buttons({
      // Create order on PayPal
      createOrder: (data, actions) => {
        setIsLoading(true)
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: '10.00', // $10 = 10 Palomas
              currency_code: 'USD'
            },
            description: 'Casa de Copas Palomas - DOV Tokens',
            custom_id: user.id, // This is crucial for the webhook!
            invoice_id: `palomas-${user.id}-${Date.now()}`
          }],
          application_context: {
            brand_name: 'Casa de Copas',
            locale: 'en-US',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW'
          }
        })
      },

      // Handle successful payment
      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture()
          console.log('Payment successful:', order)
          
          setIsLoading(false)
          
          // The webhook will handle adding Palomas automatically
          onSuccess && onSuccess(order)
          
          // Sync cups after payment
          if (syncCupsFromPalomas) {
            setTimeout(() => syncCupsFromPalomas(user.id), 2000)
          }
          
          // Show success message
          alert(`Payment successful! Your Palomas will be credited shortly. Order ID: ${order.id}`)
          
        } catch (error) {
          console.error('Payment capture error:', error)
          setIsLoading(false)
          onError && onError(error)
        }
      },

      // Handle payment errors
      onError: (err) => {
        console.error('PayPal error:', err)
        setIsLoading(false)
        onError && onError(err)
        alert('Payment failed. Please try again.')
      },

      // Handle cancelled payments
      onCancel: (data) => {
        console.log('Payment cancelled:', data)
        setIsLoading(false)
        alert('Payment cancelled.')
      },

      // Simple button styling - no flourishes
      style: {
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        layout: 'vertical',
        height: 40,
        tagline: false
      }
    }).render('#paypal-button-container')
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>Please log in to purchase Palomas</p>
      </div>
    )
  }

  if (!paypalLoaded) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>Loading PayPal...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3>Purchase Palomas</h3>
        <p>$10 = 10 Palomas</p>
      </div>
      
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <p>Processing payment...</p>
        </div>
      )}
      
      <div id="paypal-button-container"></div>
    </div>
  )
}

function App() {
  // Core state
  const [supabase, setSupabase] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [notifications, setNotifications] = useState([])
  
  // UI state
  const [showSendForm, setShowSendForm] = useState(null)
  const [showReleaseForm, setShowReleaseForm] = useState(null)
  const [showSendMeritsForm, setShowSendMeritsForm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showManifesto, setShowManifesto] = useState(false)
  const [showCupGame, setShowCupGame] = useState(false)
  const [showGPTChat, setShowGPTChat] = useState(false)
  const [showPayPal, setShowPayPal] = useState(false) // PayPal modal state
  const [showResetPassword, setShowResetPassword] = useState(false) // Reset password state
  const [showWelcome, setShowWelcome] = useState(false) // Welcome modal state
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false) // Track if user has seen welcome
  const [showGiftClaims, setShowGiftClaims] = useState(false) // Admin gift claims state
  
  // Form state for transfers and releases
  const [transferData, setTransferData] = useState({
    recipient: '',
    amount: ''
  })
  const [releaseData, setReleaseData] = useState({
    amount: '',
    reason: ''
  })
  
  // Loading states
  const [message, setMessage] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)

  const toggleGPTChat = () => {
    setShowGPTChat(prev => !prev)
  }

  // Check if should show welcome modal
  useEffect(() => {
    if (user && profile && !hasSeenWelcome) {
      const totalPalomas = profile.total_palomas_collected || 0
      if (totalPalomas === 0) {
        // Small delay to let the dashboard load first
        const timer = setTimeout(() => {
          setShowWelcome(true)
        }, 1000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [user, profile, hasSeenWelcome])

  // Close welcome modal
  const closeWelcome = () => {
    setShowWelcome(false)
    setHasSeenWelcome(true)
  }

  // Sync cups function
  const syncCupsFromPalomas = async (userId) => {
    if (!supabase || !userId) return

    try {
      // Get current profile data
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_palomas_collected, cup_count')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching profile for cup sync:', fetchError)
        return
      }

      // Calculate cups earned from total palomas
      const cupsEarned = Math.floor((profile.total_palomas_collected || 0) / 100)
      const currentCups = profile.cup_count || 0

      // Only update if there's a difference
      if (cupsEarned !== currentCups) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            cup_count: cupsEarned,
            last_status_update: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error syncing cups:', updateError)
        } else {
          console.log(`Synced cups for user ${userId}: ${currentCups} → ${cupsEarned}`)
          
          // Refresh profile data
          await ensureProfileExists({ id: userId })
          
          // Log the cup sync if there was an increase
          if (cupsEarned > currentCups) {
            await supabase
              .from('cup_logs')
              .insert([{
                user_id: userId,
                awarded_by: userId,
                amount: cupsEarned - currentCups,
                reason: `Synced cups from ${profile.total_palomas_collected} total Palomas collected`,
                cup_count_after: cupsEarned
              }])
          }
        }
      }
    } catch (error) {
      console.error('Error in syncCupsFromPalomas:', error)
    }
  }

  useEffect(() => {
    const initSupabase = async () => {
      try {
        // Check if this is a password reset URL first
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = urlParams.get('type') || hashParams.get('type')
        
        if (type === 'recovery') {
          setShowResetPassword(true)
        }

        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        )
        setSupabase(client)
        setMessage('')

        // Only auto-login if NOT on a reset password page
        if (type !== 'recovery') {
          const { data: { session } } = await client.auth.getSession()
          if (session?.user) {
            setUser(session.user)
            await ensureProfileExists(session.user, client)
            await loadAllProfiles(client)
            await loadNotifications(client)
            
            // Set up real-time subscription for notifications
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

              client.notificationSubscription = notificationSubscription
            } catch (subscriptionError) {
              console.warn('Could not set up real-time notifications:', subscriptionError)
            }
          }
        }
      } catch (error) {
        setMessage('Connection failed')
        console.error('Supabase error:', error)
      }
    }
    initSupabase()
    
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
        // Sync cups when user logs in
        await syncCupsFromPalomas(authUser.id)
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
        djr_balance: isAdmin ? 1000000 : 0,
        // Add default cup game values for new profiles
        cup_count: 0,
        tarot_level: 1,
        merit_count: 0,
        total_palomas_collected: isAdmin ? 1000000 : 0
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
      // Sync cups for new profile
      await syncCupsFromPalomas(authUser.id)
      return createdProfile
    } catch (error) {
      setMessage('Error creating profile: ' + error.message)
      return null
    }
  }

  const loadNotifications = async (client = supabase) => {
    if (!client) {
      console.log('No supabase client available')
      return
    }

    try {
      console.log('Attempting to load notifications...')
      
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

  const handleWalletSave = async (walletAddress) => {
    if (!supabase || !user) {
      console.log('No supabase client or user available')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress || null })
        .eq('id', user.id)

      if (error) {
        console.error('Error saving wallet address:', error)
        setMessage('Failed to save wallet address: ' + error.message)
        return
      }

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

  // Success handlers for LoginForm
  const handleSuccessfulLogin = async (data) => {
    console.log('Login successful:', data.user)
    setUser(data.user)
    setMessage('Login successful!')
    await ensureProfileExists(data.user)
    await loadAllProfiles()
    await loadNotifications()
  }

  const handleSuccessfulRegister = async (data) => {
    console.log('Registration successful:', data.user)
    setUser(data.user)
    setMessage('Registration successful!')
    await ensureProfileExists(data.user)
    await loadAllProfiles()
    await loadNotifications()
  }

  // Handle password reset completion
  const handlePasswordResetComplete = async () => {
    // Sign out the user after password reset
    if (supabase) {
      await supabase.auth.signOut()
    }
    
    setShowResetPassword(false)
    setUser(null)
    setProfile(null)
    
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname)
    setMessage('Password reset complete! Please log in with your new password.')
  }

  const handleLogout = async () => {
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
    setShowSendMeritsForm(false)
    setShowNotifications(false)
    setShowManifesto(false)
    setShowCupGame(false)
    setShowGPTChat(false)
    setShowPayPal(false) // Reset PayPal modal
    setShowWelcome(false) // Reset welcome modal
    setHasSeenWelcome(false) // Reset welcome state
    setShowGiftClaims(false) // Reset gift claims
    setMessage('')
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
          .update({ 
            dov_balance: profile.dov_balance - amount,
            last_status_update: new Date().toISOString()
          })
          .eq('id', user.id)
      } else {
        await supabase
          .from('profiles')
          .update({ 
            djr_balance: profile.djr_balance - amount,
            last_status_update: new Date().toISOString()
          })
          .eq('id', user.id)
      }

      console.log(`About to create notification for ${tokenType} release`)
      await createReleaseNotification(amount, reason, tokenType)
      console.log('Finished creating notification')

      setMessage('Released ' + amount + ' ' + tokenType + '!')
      setReleaseData({ amount: '', reason: '' })
      setShowReleaseForm(null)
      
      await ensureProfileExists(user)
      await loadAllProfiles()
      await loadNotifications()
    } catch (err) {
      setMessage('Release failed: ' + err.message)
    } finally {
      setIsReleasing(false)
    }
  }

  // PayPal handler - updated to close welcome modal
  const handlePayPalClick = () => {
    if (!user) {
      setMessage('Please log in to purchase Palomas')
      return
    }
    closeWelcome() // Close welcome modal when opening PayPal
    setShowPayPal(true)
    setMessage('Use the PayPal checkout below to purchase Palomas. Your tokens will be credited automatically!')
  }

  const isAdmin = profile?.username === 'JPR333' || user?.email === 'jproney@gmail.com'

  // Welcome Modal View - Show if user has 0 palomas and hasn't seen it
  if (user && showWelcome) {
    return (
      <>
        <WelcomeModal
          onClose={closeWelcome}
          onBuyPalomas={() => {
            closeWelcome()
            setShowPayPal(true)
          }}
        />
        <Dashboard
          profile={profile}
          user={user}
          supabase={supabase}
          isAdmin={isAdmin}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onShowNotifications={() => setShowNotifications(true)}
          onShowCupGame={() => {
            setShowCupGame(true)
            syncCupsFromPalomas(user.id)
          }}
          onWalletSave={handleWalletSave}
          onLogout={handleLogout}
          onProfileUpdate={setProfile}
          message={message}
          onShowSendMeritsForm={() => setShowSendMeritsForm(true)}
          onShowSendForm={setShowSendForm}
          onShowReleaseForm={setShowReleaseForm}
          onPayPalClick={handlePayPalClick}
          onShowGiftClaims={() => setShowGiftClaims(true)}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  // Reset Password View - Show this first if we're on a reset URL
  if (showResetPassword) {
    return (
      <>
        <ResetPassword
          supabase={supabase}
          onPasswordReset={handlePasswordResetComplete}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      </>
    )
  }

  // Admin Gift Claims View
  if (user && showGiftClaims && isAdmin) {
    return (
      <>
        <AdminGiftClaims
          supabase={supabase}
          onBack={() => setShowGiftClaims(false)}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  // PayPal Modal View
  if (user && showPayPal) {
    return (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowPayPal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ×
            </button>
            
            <PayPalButton
              user={user}
              profile={profile}
              syncCupsFromPalomas={syncCupsFromPalomas}
              onSuccess={(order) => {
                console.log('Payment completed:', order)
                setMessage(`Payment successful! Palomas will be credited shortly.`)
                // Refresh user data after a short delay
                setTimeout(async () => {
                  await ensureProfileExists(user)
                  await syncCupsFromPalomas(user.id)
                }, 3000)
              }}
              onError={(error) => {
                console.error('Payment failed:', error)
                setMessage('Payment failed. Please try again.')
              }}
            />
          </div>
        </div>

        <Dashboard
          profile={profile}
          user={user}
          supabase={supabase}
          isAdmin={isAdmin}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onShowNotifications={() => setShowNotifications(true)}
          onShowCupGame={() => {
            setShowCupGame(true)
            syncCupsFromPalomas(user.id)
          }}
          onWalletSave={handleWalletSave}
          onLogout={handleLogout}
          onProfileUpdate={setProfile}
          message={message}
          onShowSendMeritsForm={() => setShowSendMeritsForm(true)}
          onShowSendForm={setShowSendForm}
          onShowReleaseForm={setShowReleaseForm}
          onPayPalClick={handlePayPalClick}
          onShowGiftClaims={() => setShowGiftClaims(true)}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  // Add send merits view
  if (user && showSendMeritsForm && isAdmin) {
    return (
      <>
        <SendMeritsForm
          onBack={() => setShowSendMeritsForm(false)}
          message={message}
          supabase={supabase}
          user={user}
          allProfiles={allProfiles}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  // Add cup game view
  if (user && showCupGame) {
    return (
      <>
        <TarotCupsPage
          profile={profile}
          onBack={() => setShowCupGame(false)}
          supabase={supabase}
          user={user}
          onProfileUpdate={(updatedProfile) => {
            setProfile(updatedProfile)
            // Sync cups when profile updates in cup game
            syncCupsFromPalomas(user.id)
          }}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  // Render based on current view
  if (user && showNotifications && isAdmin) {
    return (
      <>
        <NotificationsFeed
          onBack={() => setShowNotifications(false)}
          notifications={notifications}
          onRefresh={() => loadNotifications()}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  if (user && showSendForm) {
    return (
      <>
        <SendForm
          tokenType={showSendForm}
          onBack={() => setShowSendForm(null)}
          message={message}
          transferData={transferData}
          setTransferData={setTransferData}
          isTransferring={isTransferring}
          onSend={handleAdminTransfer}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  if (user && showReleaseForm) {
    return (
      <>
        <ReleaseForm
          tokenType={showReleaseForm}
          onBack={() => setShowReleaseForm(null)}
          message={message}
          releaseData={releaseData}
          setReleaseData={setReleaseData}
          isReleasing={isReleasing}
          onRelease={handleRelease}
          user={user}
          profile={profile}
          supabase={supabase}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  if (user) {
    return (
      <>
        <Dashboard
          profile={profile}
          user={user}
          supabase={supabase}
          isAdmin={isAdmin}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onShowNotifications={() => setShowNotifications(true)}
          onShowCupGame={() => {
            setShowCupGame(true)
            // Sync cups when opening cup game
            syncCupsFromPalomas(user.id)
          }}
          onWalletSave={handleWalletSave}
          onLogout={handleLogout}
          onProfileUpdate={setProfile}
          message={message}
          onShowSendMeritsForm={() => setShowSendMeritsForm(true)}
          onShowSendForm={setShowSendForm}
          onShowReleaseForm={setShowReleaseForm}
          onPayPalClick={handlePayPalClick}
          onShowGiftClaims={() => setShowGiftClaims(true)}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        />
      </>
    )
  }

  return (
    <>
      <LoginForm
        supabase={supabase}
        onLogin={handleSuccessfulLogin}
        onRegister={handleSuccessfulRegister}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
