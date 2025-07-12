import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'
import SendForm from './components/SendForm'
import ReleaseForm from './components/ReleaseForm'
import NotificationsFeed from './components/NotificationsFeed'
import ManifestoPopup from './components/ManifestoPopup'
import FloatingGrailButton from './components/FloatingGrailButton'

function App() {
  // Core state
  const [supabase, setSupabase] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [allProfiles, setAllProfiles] = useState([])
  const [notifications, setNotifications] = useState([])
  
  // UI state
  const [activeTab, setActiveTab] = useState('login')
  const [showSendForm, setShowSendForm] = useState(null)
  const [showReleaseForm, setShowReleaseForm] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showManifesto, setShowManifesto] = useState(false)
  
  // Form state
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
  
  // Loading states
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)

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

  const handlePayPalClick = () => {
    if (!user) {
      setMessage('Please log in to collect tokens')
      return
    }
    const paypalUrl = `https://www.paypal.com/ncp/payment/LEWS26K7J8FAC?custom_id=${user.id}`
    window.open(paypalUrl, '_blank')
    setMessage('Complete your PayPal payment. Tokens will be credited automatically!')
  }

  const isAdmin = profile?.username === 'JPR333' || user?.email === 'jproney@gmail.com'

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
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      </>
    )
  }

  if (user) {
    return (
      <>
        <Dashboard
          profile={profile}
          user={user}
          isAdmin={isAdmin}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onShowNotifications={() => setShowNotifications(true)}
          onWalletSave={handleWalletSave}
          onLogout={handleLogout}
          message={message}
          onShowSendForm={setShowSendForm}
          onShowReleaseForm={setShowReleaseForm}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      </>
    )
  }

  return (
    <>
      <LoginForm
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        formData={formData}
        setFormData={setFormData}
        message={message}
        loading={loading}
        supabase={supabase}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
