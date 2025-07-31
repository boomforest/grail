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
import WelcomeModal from './components/WelcomeModal'
import PayPalButton from './components/PayPalButton'

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
