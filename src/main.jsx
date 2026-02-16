import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { LanguageProvider } from './contexts/LanguageContext'
import LoginForm from './components/LoginForm'
import ResetPassword from './components/ResetPassword'
import Dashboard from './components/Dashboard'
import SendForm from './components/SendForm'
import SendDovesEggs from './components/SendDovesEggs'
import EggsInFlight from './components/EggsInFlight'
import ReleaseForm from './components/ReleaseForm'
import SendMeritsForm from './components/SendMeritsForm'
import NotificationsFeed from './components/NotificationsFeed'
import ManifestoPopup from './components/ManifestoPopup'
import FloatingGrailButton from './components/FloatingGrailButton'
import TarotCupsPage from './components/cupgame'
import GPTChatWindow from './components/GPTChatWindow'
import WelcomeModal from './components/WelcomeModal'
import PayPalButton from './components/PayPalButton'
import PalomasMenu from './components/PalomasMenu'
import TicketsPage from './components/TicketsPage'
import AdminTicketManager from './components/AdminTicketManager'
import AdminPowerUps from './components/AdminPowerUps'
import SendLove from './components/SendLove'

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
  const [showPalomasMenu, setShowPalomasMenu] = useState(false) // Palomas management menu
  const [showTickets, setShowTickets] = useState(false) // Tickets page
  const [showAdminTickets, setShowAdminTickets] = useState(false) // Admin ticket management
  const [showAdminPowerUps, setShowAdminPowerUps] = useState(false) // Admin power-ups management
  const [showSendLove, setShowSendLove] = useState(false) // Send love feature
  const [showSendDovesEggs, setShowSendDovesEggs] = useState(null) // New dual-send interface - stores 'DOVES' or 'EGGS'
  const [showEggsInFlight, setShowEggsInFlight] = useState(false) // Eggs management

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

  // Auto-clearing message helper
  const showMessage = (msg, duration = 3000) => {
    setMessage(msg)
    if (duration > 0) {
      setTimeout(() => setMessage(''), duration)
    }
  }

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
        console.log('🚀 Initializing Supabase...')

        // Check if this is a password reset URL first
        const urlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = urlParams.get('type') || hashParams.get('type')

        if (type === 'recovery') {
          console.log('🔐 Password recovery mode detected')
          setShowResetPassword(true)
        }

        console.log('📦 Creating Supabase client...')
        console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
        console.log('Has ANON key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

        const { createClient } = await import('@supabase/supabase-js')
        const client = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        )

        console.log('✅ Supabase client created')
        setSupabase(client)
        setMessage('')

        // Only auto-login if NOT on a reset password page
        if (type !== 'recovery') {
          console.log('🔑 Checking for existing session...')
          const { data: { session }, error: sessionError } = await client.auth.getSession()

          if (sessionError) {
            console.error('❌ Session error:', sessionError)
          }

          if (session?.user) {
            console.log('👤 User session found:', session.user.email)
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
        showMessage('Connection failed')
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
    console.log('🔍 ensureProfileExists called for user:', authUser?.id, authUser?.email)

    try {
      console.log('📡 Fetching profile from database...')
      const { data: existingProfile, error: fetchError } = await client
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching profile:', fetchError)
        throw fetchError
      }

      console.log('✅ Profile fetched:', {
        username: existingProfile?.username,
        email: existingProfile?.email,
        dov_balance: existingProfile?.dov_balance,
        total_palomas_collected: existingProfile?.total_palomas_collected,
        profile_picture_url: existingProfile?.profile_picture_url ? 'Has picture' : 'No picture'
      })

      if (existingProfile) {
        // One-time migration: sync dov_balance with total_palomas_collected if needed
        if ((existingProfile.dov_balance === 0 || existingProfile.dov_balance === null) &&
            existingProfile.total_palomas_collected > 0) {
          console.log('🔄 Migrating balance: setting dov_balance to match total_palomas_collected')
          const { error: migrationError } = await client
            .from('profiles')
            .update({
              dov_balance: existingProfile.total_palomas_collected,
              last_status_update: new Date().toISOString()
            })
            .eq('id', authUser.id)

          if (migrationError) {
            console.error('❌ Migration error:', migrationError)
          } else {
            console.log('✅ Balance migrated successfully')
            existingProfile.dov_balance = existingProfile.total_palomas_collected
          }
        }

        console.log('📦 Setting profile state...')
        setProfile(existingProfile)

        // Sync cups when user logs in
        console.log('🏆 Syncing cups from Palomas...')
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
        showMessage('Profile creation failed: ' + createError.message)
        return null
      }

      setProfile(createdProfile)
      showMessage('Profile created successfully!')
      // Sync cups for new profile
      await syncCupsFromPalomas(authUser.id)
      return createdProfile
    } catch (error) {
      showMessage('Error creating profile: ' + error.message)
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
        showMessage('Failed to save wallet address: ' + error.message)
        return
      }

      await ensureProfileExists(user)

      if (walletAddress) {
        showMessage('Wallet address saved!')
      } else {
        showMessage('Wallet address removed')
      }
    } catch (error) {
      console.error('Error handling wallet save:', error)
      showMessage('Error saving wallet: ' + error.message)
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
    await ensureProfileExists(data.user)
    await loadAllProfiles()
    await loadNotifications()
  }

  const handleSuccessfulRegister = async (data) => {
    console.log('Registration successful:', data.user)
    setUser(data.user)
    showMessage('Registration successful!')
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
    showMessage('Password reset complete! Please log in with your new password.')
  }

  const handleLogout = async () => {
    console.log('🚪 Logout initiated...')

    try {
      if (supabase?.notificationSubscription) {
        console.log('📡 Unsubscribing from notifications...')
        await supabase.notificationSubscription.unsubscribe()
      }

      if (supabase) {
        console.log('🔐 Signing out from Supabase...')
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('❌ Logout error:', error)
          throw error
        }
        console.log('✅ Signed out successfully')
      }

      // Reset all state
      console.log('🧹 Clearing app state...')
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
      setShowPayPal(false)
      setShowWelcome(false)
      setHasSeenWelcome(false)
      setShowPalomasMenu(false)
      setShowTickets(false)
      setShowAdminTickets(false)
      setShowSendLove(false)
      showMessage('Logged out successfully', 2000)
      setTransferData({ recipient: '', amount: '' })
      setReleaseData({ amount: '', reason: '' })

      console.log('✅ Logout complete!')
    } catch (error) {
      console.error('❌ Error during logout:', error)
      showMessage('Logout error - please refresh the page')
    }
  }

  // NEW: Handle Palomas Transfer Function with FIFO expiration tracking
  const handlePalomasTransfer = async () => {
    if (!supabase || !profile) {
      showMessage('Please wait for connection...')
      return
    }

    const recipient = transferData.recipient.trim().toUpperCase()
    const amount = parseFloat(transferData.amount)

    if (!recipient || !amount) {
      showMessage('Please fill in recipient and amount')
      return
    }

    try {
      setIsTransferring(true)

      // Find recipient
      const { data: recipientProfile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', recipient)
        .single()

      if (findError || !recipientProfile) {
        showMessage('Recipient not found')
        return
      }

      if (recipientProfile.id === user.id) {
        showMessage('Cannot send to yourself')
        return
      }

      // Check sender has enough Palomas (using dov_balance)
      if (profile.dov_balance < amount) {
        showMessage('Insufficient Palomas')
        return
      }

      // FIFO: Get sender's active transactions ordered by received_at (oldest first)
      const { data: senderTransactions, error: txError } = await supabase
        .from('paloma_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_expired', false)
        .gte('expires_at', new Date().toISOString())
        .order('received_at', { ascending: true })

      if (txError) {
        console.error('Error fetching sender transactions:', txError)
        showMessage('Transfer failed: Could not fetch transactions')
        return
      }

      // Calculate total available (should match dov_balance)
      const totalAvailable = senderTransactions.reduce((sum, tx) => sum + tx.amount, 0)

      if (totalAvailable < amount) {
        showMessage('Insufficient active Palomas')
        return
      }

      // Deduct from oldest transactions first (FIFO)
      let remaining = amount
      for (const tx of senderTransactions) {
        if (remaining <= 0) break

        const deductAmount = Math.min(remaining, tx.amount)

        if (tx.amount === deductAmount) {
          // Delete transaction entirely
          await supabase
            .from('paloma_transactions')
            .delete()
            .eq('id', tx.id)
        } else {
          // Reduce transaction amount
          await supabase
            .from('paloma_transactions')
            .update({ amount: tx.amount - deductAmount })
            .eq('id', tx.id)
        }

        remaining -= deductAmount
      }

      // Create new transaction for recipient with fresh 1-year expiration
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)

      await supabase
        .from('paloma_transactions')
        .insert([{
          user_id: recipientProfile.id,
          amount: amount,
          transaction_type: 'received',
          source: `transfer_from_${profile.username}`,
          received_at: new Date().toISOString(),
          expires_at: expirationDate.toISOString(),
          metadata: {
            sender_username: profile.username,
            sender_id: user.id
          }
        }])

      // Update sender's dov_balance
      await supabase
        .from('profiles')
        .update({
          dov_balance: profile.dov_balance - amount,
          last_status_update: new Date().toISOString()
        })
        .eq('id', user.id)

      // Update recipient's dov_balance
      await supabase
        .from('profiles')
        .update({
          dov_balance: recipientProfile.dov_balance + amount,
          last_status_update: new Date().toISOString()
        })
        .eq('id', recipientProfile.id)

      showMessage(`Sent ${amount} Palomas to ${recipient}!`)
      setTransferData({ recipient: '', amount: '' })
      setShowSendForm(null)

      await ensureProfileExists(user)
      await loadAllProfiles()
    } catch (err) {
      console.error('Transfer error:', err)
      showMessage('Transfer failed: ' + err.message)
    } finally {
      setIsTransferring(false)
    }
  }

  // EXISTING: Admin Transfer Function (for DOV/DJR tokens)
  const handleAdminTransfer = async (tokenType) => {
    if (!supabase || !profile) {
      showMessage('Please wait for connection...')
      return
    }

    const recipient = transferData.recipient.trim().toUpperCase()
    const amount = parseFloat(transferData.amount)

    if (!recipient || !amount) {
      showMessage('Please fill in recipient and amount')
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
        showMessage('Recipient not found')
        return
      }

      if (recipientProfile.id === user.id) {
        showMessage('Cannot send to yourself')
        return
      }

      const currentBalance = tokenType === 'DOV' ? profile.dov_balance : profile.djr_balance
      if (currentBalance < amount) {
        showMessage('Insufficient tokens')
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

      showMessage('Sent ' + amount + ' ' + tokenType + ' to ' + recipient + '!')
      setTransferData({ recipient: '', amount: '' })
      setShowSendForm(null)

      await ensureProfileExists(user)
      await loadAllProfiles()
    } catch (err) {
      showMessage('Transfer failed: ' + err.message)
    } finally {
      setIsTransferring(false)
    }
  }

  const handleRelease = async (tokenType) => {
    if (!supabase || !profile) {
      showMessage('Please wait for connection...')
      return
    }

    const amount = parseFloat(releaseData.amount)
    const reason = releaseData.reason.trim() || 'Token release'

    if (!amount) {
      showMessage('Please enter amount')
      return
    }

    // For Palomas (DOV), check total_palomas_collected instead of dov_balance
    const currentBalance = tokenType === 'DOV' ? profile.total_palomas_collected : profile.djr_balance
    if (currentBalance < amount) {
      showMessage('Insufficient tokens')
      return
    }

    try {
      setIsReleasing(true)

      if (tokenType === 'DOV') {
        // Release Palomas from total_palomas_collected
        await supabase
          .from('profiles')
          .update({
            total_palomas_collected: profile.total_palomas_collected - amount,
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

      showMessage('Released ' + amount + ' ' + tokenType + '!')
      setReleaseData({ amount: '', reason: '' })
      setShowReleaseForm(null)

      await ensureProfileExists(user)
      await loadAllProfiles()
      await loadNotifications()
    } catch (err) {
      showMessage('Release failed: ' + err.message)
    } finally {
      setIsReleasing(false)
    }
  }

  // PayPal handler - updated to close welcome modal
  const handlePayPalClick = () => {
    if (!user) {
      showMessage('Please log in to purchase Palomas')
      return
    }
    closeWelcome() // Close welcome modal when opening PayPal
    setShowPayPal(true)
  }

  // FOR DEVELOPMENT: Make all users admin for testing
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isAdmin = isDevelopment ? true : (profile?.username === 'JPR333' || user?.email === 'jproney@gmail.com')

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
          onShowPalomasMenu={() => setShowPalomasMenu(true)}
          onShowTickets={(isAdmin) => {
            if (isAdmin) {
              setShowAdminTickets(true)
            } else {
              setShowTickets(true)
            }
          }}
          onShowAdminPowerUps={() => setShowAdminPowerUps(true)}
        />
        {showPalomasMenu && (
          <PalomasMenu
            profile={profile}
            isAdmin={isAdmin}
            onShowSendForm={setShowSendForm}
            onShowReleaseForm={setShowReleaseForm}
            onPayPalClick={handlePayPalClick}
            onShowSendLove={() => setShowSendLove(true)}
            onShowCupGame={() => setShowCupGame(true)}
            onClose={() => setShowPalomasMenu(false)}
            supabase={supabase}
            onShowSendDovesEggs={setShowSendDovesEggs}
            onShowEggsInFlight={() => setShowEggsInFlight(true)}
          />
        )}
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
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
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
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
                showMessage('Payment successful! Palomas will be credited shortly.')
                // Refresh user data after a short delay
                setTimeout(async () => {
                  await ensureProfileExists(user)
                  await syncCupsFromPalomas(user.id)
                }, 3000)
              }}
              onError={(error) => {
                console.error('Payment failed:', error)
                showMessage('Payment failed. Please try again.')
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
          onShowPalomasMenu={() => setShowPalomasMenu(true)}
          onShowTickets={(isAdmin) => {
            if (isAdmin) {
              setShowAdminTickets(true)
            } else {
              setShowTickets(true)
            }
          }}
          onShowAdminPowerUps={() => setShowAdminPowerUps(true)}
        />
        {showPalomasMenu && (
          <PalomasMenu
            profile={profile}
            isAdmin={isAdmin}
            onShowSendForm={setShowSendForm}
            onShowReleaseForm={setShowReleaseForm}
            onPayPalClick={handlePayPalClick}
            onShowSendLove={() => setShowSendLove(true)}
            onShowCupGame={() => setShowCupGame(true)}
            onClose={() => setShowPalomasMenu(false)}
            supabase={supabase}
            onShowSendDovesEggs={setShowSendDovesEggs}
            onShowEggsInFlight={() => setShowEggsInFlight(true)}
          />
        )}
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
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
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
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
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
      </>
    )
  }

  // Tickets view
  if (user && showTickets) {
    return (
      <>
        <TicketsPage
          user={user}
          profile={profile}
          supabase={supabase}
          onBack={() => setShowTickets(false)}
          isAdmin={isAdmin}
          onProfileUpdate={setProfile}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
      </>
    )
  }

  // Admin ticket management view
  if (user && showAdminTickets && isAdmin) {
    return (
      <>
        <AdminTicketManager
          profile={profile}
          supabase={supabase}
          onBack={() => setShowAdminTickets(false)}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow
          isOpen={showGPTChat}
          onToggle={toggleGPTChat}
          profile={profile}
        /> */}
      </>
    )
  }

  // Admin power-ups management view
  if (user && showAdminPowerUps && isAdmin) {
    return (
      <>
        <AdminPowerUps
          profile={profile}
          supabase={supabase}
          onBack={() => setShowAdminPowerUps(false)}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
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
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
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
          onSend={showSendForm === 'DOV' ? handlePalomasTransfer : handleAdminTransfer} // FIXED: Use Palomas transfer for DOV
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
      </>
    )
  }

  // Send Love view (Admin only)
  if (user && showSendLove && isAdmin) {
    return (
      <>
        <SendLove
          profile={profile}
          supabase={supabase}
          onClose={() => setShowSendLove(false)}
          onSuccess={(msg) => showMessage(msg)}
        />
        <Dashboard
          profile={profile}
          user={user}
          supabase={supabase}
          isAdmin={isAdmin}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onShowNotifications={() => setShowNotifications(true)}
          onShowSendForm={setShowSendForm}
          onShowReleaseForm={setShowReleaseForm}
          onShowSendMeritsForm={() => setShowSendMeritsForm(true)}
          onShowPalomasMenu={() => setShowPalomasMenu(true)}
          onShowTickets={(isAdmin) => {
            if (isAdmin) {
              setShowAdminTickets(true)
            } else {
              setShowTickets(true)
            }
          }}
          handlePalomasTransfer={handlePalomasTransfer}
          transferData={transferData}
          setTransferData={setTransferData}
          isTransferring={isTransferring}
          onLogout={handleLogout}
          message={message}
          onShowCupGame={() => setShowCupGame(true)}
          onPayPalClick={handlePayPalClick}
        />
        {showPalomasMenu && (
          <PalomasMenu
            profile={profile}
            isAdmin={isAdmin}
            onShowSendForm={setShowSendForm}
            onShowReleaseForm={setShowReleaseForm}
            onPayPalClick={handlePayPalClick}
            onShowSendLove={() => setShowSendLove(true)}
            onShowCupGame={() => setShowCupGame(true)}
            onClose={() => setShowPalomasMenu(false)}
            supabase={supabase}
            onShowSendDovesEggs={setShowSendDovesEggs}
            onShowEggsInFlight={() => setShowEggsInFlight(true)}
          />
        )}
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
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
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
      </>
    )
  }

  // Send Doves/Eggs view
  if (user && showSendDovesEggs) {
    return (
      <>
        <SendDovesEggs
          profile={profile}
          supabase={supabase}
          transferType={showSendDovesEggs} // 'DOVES' or 'EGGS'
          onClose={() => setShowSendDovesEggs(null)}
          onSuccess={(msg) => {
            showMessage(msg, 5000)
            ensureProfileExists(user)
          }}
        />
      </>
    )
  }

  // Eggs in Flight view
  if (user && showEggsInFlight) {
    return (
      <>
        <EggsInFlight
          profile={profile}
          supabase={supabase}
          onClose={() => setShowEggsInFlight(false)}
          onSuccess={(msg) => {
            showMessage(msg, 5000)
            ensureProfileExists(user)
          }}
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
          onShowPalomasMenu={() => setShowPalomasMenu(true)}
          onShowTickets={(isAdmin) => {
            if (isAdmin) {
              setShowAdminTickets(true)
            } else {
              setShowTickets(true)
            }
          }}
          onShowAdminPowerUps={() => setShowAdminPowerUps(true)}
        />
        {showPalomasMenu && (
          <PalomasMenu
            profile={profile}
            isAdmin={isAdmin}
            onShowSendForm={setShowSendForm}
            onShowReleaseForm={setShowReleaseForm}
            onPayPalClick={handlePayPalClick}
            onShowSendLove={() => setShowSendLove(true)}
            onShowCupGame={() => setShowCupGame(true)}
            onClose={() => setShowPalomasMenu(false)}
            supabase={supabase}
            onShowSendDovesEggs={setShowSendDovesEggs}
            onShowEggsInFlight={() => setShowEggsInFlight(true)}
          />
        )}
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
        {/* GPTChatWindow disabled - moved to standalone page
        <GPTChatWindow 
          isOpen={showGPTChat} 
          onToggle={toggleGPTChat} 
          profile={profile} 
        /> */}
      </>
    )
  }

  // TODO: REMOVE BEFORE PUSH - Development bypass for testing
  const DEV_BYPASS = false // SET TO FALSE BEFORE PUSHING
  if (DEV_BYPASS && !user) {
    const mockUser = { id: 'dev-user-123', email: 'dev@test.com' }
    const mockProfile = {
      id: 'dev-user-123',
      username: 'TESTUSER',
      email: 'dev@test.com',
      dov_balance: 1000,
      djr_balance: 500000,
      total_palomas_collected: 2500,
      cup_count: 25,
      tarot_level: 25, // Page of Cups for testing web3 queue
      merit_count: 2,
      palomas_purchased: 400,
      transformation_numbers: { 25: 7 }, // 7th person to reach Page of Cups
      tiempo_balance: 150
    }
    setUser(mockUser)
    setProfile(mockProfile)
  }
  
  return (
    <>
      <LoginForm
        supabase={supabase}
        onLogin={handleSuccessfulLogin}
        onRegister={handleSuccessfulRegister}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} supabase={supabase} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
)