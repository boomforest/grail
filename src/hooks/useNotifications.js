import { useState, useEffect } from 'react'

export const useNotifications = (supabase) => {
  const [notifications, setNotifications] = useState([])
  const [subscription, setSubscription] = useState(null)

  const loadNotifications = async () => {
    if (!supabase) {
      console.log('No supabase client available')
      return
    }

    try {
      console.log('Attempting to load notifications...')
      
      const response = await supabase
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

  const createReleaseNotification = async (user, profile, amount, reason, tokenType) => {
    if (!supabase || !profile || !user) {
      console.log('Cannot create notification - missing supabase, user or profile')
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

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return

    // Load initial notifications
    loadNotifications()

    // Set up real-time subscription
    try {
      const notificationSubscription = supabase
        .channel('release_notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'release_notifications' },
          (payload) => {
            console.log('New notification received:', payload)
            loadNotifications()
          }
        )
        .subscribe()

      setSubscription(notificationSubscription)
    } catch (subscriptionError) {
      console.warn('Could not set up real-time notifications:', subscriptionError)
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase])

  return {
    notifications,
    loadNotifications,
    createReleaseNotification
  }
}