import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export const useSupabase = () => {
  const [supabase, setSupabase] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      try {
        const client = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        )
        setSupabase(client)
        
        // Check for existing session
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        }
        
        // Listen for auth changes
        const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            setUser(session.user)
          } else {
            setUser(null)
            setProfile(null)
          }
        })

        setLoading(false)
        
        return () => {
          authListener?.subscription?.unsubscribe()
        }
      } catch (error) {
        console.error('Supabase initialization error:', error)
        setMessage('Connection failed')
        setLoading(false)
      }
    }

    initSupabase()
  }, [])

  // Ensure profile exists when user logs in
  const ensureProfileExists = async (authUser) => {
    if (!supabase || !authUser) return null

    try {
      const { data: existingProfile } = await supabase
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
        djr_balance: isAdmin ? 1000000 : 0,
        cup_count: 0,
        tarot_level: 1,
        merit_count: 0,
        total_palomas_collected: isAdmin ? 1000000 : 0
      }

      const { data: createdProfile, error: createError } = await supabase
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

  // Update profile when user changes
  useEffect(() => {
    if (user && supabase) {
      ensureProfileExists(user)
    }
  }, [user, supabase])

  return {
    supabase,
    user,
    profile,
    loading,
    message,
    setMessage,
    setUser,
    setProfile,
    ensureProfileExists
  }
}