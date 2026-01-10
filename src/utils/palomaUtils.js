// Utility functions for Palomas (DOV) balance and expiration management

/**
 * Get the active (non-expired) Palomas balance for a user
 * This calculates the balance from transaction records
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<number>} Active Palomas balance
 */
export async function getActivePalomasBalance(supabase, userId) {
  if (!supabase || !userId) {
    console.error('Missing supabase client or userId')
    return 0
  }

  try {
    const { data, error } = await supabase
      .from('paloma_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('is_expired', false)
      .gte('expires_at', new Date().toISOString())

    if (error) {
      console.error('Error fetching active Palomas:', error)
      return 0
    }

    return data.reduce((sum, tx) => sum + tx.amount, 0)
  } catch (error) {
    console.error('Error in getActivePalomasBalance:', error)
    return 0
  }
}

/**
 * Get a breakdown of Palomas by expiration timeframe
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Breakdown with expiring30Days, expiring90Days, active, total
 */
export async function getPalomasExpirationBreakdown(supabase, userId) {
  if (!supabase || !userId) {
    console.error('Missing supabase client or userId')
    return { expiring30Days: 0, expiring90Days: 0, active: 0, total: 0 }
  }

  try {
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('paloma_transactions')
      .select('amount, expires_at')
      .eq('user_id', userId)
      .eq('is_expired', false)
      .gte('expires_at', now.toISOString())
      .order('expires_at', { ascending: true })

    if (error) {
      console.error('Error fetching Palomas breakdown:', error)
      return { expiring30Days: 0, expiring90Days: 0, active: 0, total: 0 }
    }

    let expiring30Days = 0
    let expiring90Days = 0
    let active = 0

    data?.forEach(tx => {
      const expiresAt = new Date(tx.expires_at)
      if (expiresAt <= thirtyDays) {
        expiring30Days += tx.amount
      } else if (expiresAt <= ninetyDays) {
        expiring90Days += tx.amount
      } else {
        active += tx.amount
      }
    })

    return {
      expiring30Days,
      expiring90Days,
      active,
      total: expiring30Days + expiring90Days + active
    }
  } catch (error) {
    console.error('Error in getPalomasExpirationBreakdown:', error)
    return { expiring30Days: 0, expiring90Days: 0, active: 0, total: 0 }
  }
}

/**
 * Get all active transactions for a user (for detailed views)
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of transaction objects
 */
export async function getActiveTransactions(supabase, userId) {
  if (!supabase || !userId) {
    console.error('Missing supabase client or userId')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('paloma_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_expired', false)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })

    if (error) {
      console.error('Error fetching active transactions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getActiveTransactions:', error)
    return []
  }
}

/**
 * Calculate days until expiration for a given date
 * @param {string|Date} expirationDate - Expiration date
 * @returns {number} Days until expiration (can be negative if expired)
 */
export function daysUntilExpiration(expirationDate) {
  const expDate = new Date(expirationDate)
  const now = new Date()
  const diffTime = expDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Format expiration date for display
 * @param {string|Date} expirationDate - Expiration date
 * @returns {string} Formatted date string
 */
export function formatExpirationDate(expirationDate) {
  const days = daysUntilExpiration(expirationDate)

  if (days < 0) {
    return 'Expired'
  } else if (days === 0) {
    return 'Expires today'
  } else if (days === 1) {
    return 'Expires tomorrow'
  } else if (days <= 30) {
    return `Expires in ${days} days`
  } else if (days <= 90) {
    const weeks = Math.floor(days / 7)
    return `Expires in ${weeks} week${weeks !== 1 ? 's' : ''}`
  } else {
    const months = Math.floor(days / 30)
    return `Expires in ${months} month${months !== 1 ? 's' : ''}`
  }
}

/**
 * Sync dov_balance with actual transaction total (for debugging/maintenance)
 * @param {Object} supabase - Supabase client with service role
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result with oldBalance, newBalance, synced
 */
export async function syncDovBalance(supabase, userId) {
  if (!supabase || !userId) {
    console.error('Missing supabase client or userId')
    return { success: false, error: 'Missing parameters' }
  }

  try {
    // Get current balance from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('dov_balance')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { success: false, error: profileError.message }
    }

    // Calculate actual balance from transactions
    const actualBalance = await getActivePalomasBalance(supabase, userId)

    // If they match, no need to update
    if (profile.dov_balance === actualBalance) {
      return {
        success: true,
        synced: false,
        oldBalance: profile.dov_balance,
        newBalance: actualBalance,
        message: 'Balance already in sync'
      }
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        dov_balance: actualBalance,
        last_status_update: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating balance:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`✅ Synced balance for user ${userId}: ${profile.dov_balance} → ${actualBalance}`)

    return {
      success: true,
      synced: true,
      oldBalance: profile.dov_balance,
      newBalance: actualBalance,
      message: `Balance synced: ${profile.dov_balance} → ${actualBalance}`
    }
  } catch (error) {
    console.error('Error in syncDovBalance:', error)
    return { success: false, error: error.message }
  }
}
