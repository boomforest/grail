// netlify/functions/expire-palomas.js
// Daily cron job to expire Palomas that are 1 year old
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  console.log('🕐 Starting Paloma expiration check...', new Date().toISOString())

  // Initialize Supabase with service role key (full permissions)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const now = new Date().toISOString()

    // Find all expired transactions that haven't been marked as expired yet
    const { data: expiredTransactions, error: fetchError } = await supabase
      .from('paloma_transactions')
      .select('*')
      .lte('expires_at', now)
      .eq('is_expired', false)

    if (fetchError) {
      console.error('❌ Error fetching expired transactions:', fetchError)
      throw fetchError
    }

    console.log(`📊 Found ${expiredTransactions.length} expired transactions to process`)

    if (expiredTransactions.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No expired Palomas found',
          timestamp: now
        })
      }
    }

    // Group expired transactions by user
    const userExpirations = {}
    for (const tx of expiredTransactions) {
      if (!userExpirations[tx.user_id]) {
        userExpirations[tx.user_id] = []
      }
      userExpirations[tx.user_id].push(tx)
    }

    console.log(`👥 Processing expirations for ${Object.keys(userExpirations).length} users`)

    let totalExpired = 0
    const results = []

    // Process each user's expirations
    for (const [userId, transactions] of Object.entries(userExpirations)) {
      const totalExpiredForUser = transactions.reduce((sum, tx) => sum + tx.amount, 0)

      console.log(`\n💰 User ${userId}: Expiring ${totalExpiredForUser} Palomas across ${transactions.length} transactions`)

      // Mark all transactions as expired
      for (const tx of transactions) {
        const { error: markError } = await supabase
          .from('paloma_transactions')
          .update({ is_expired: true })
          .eq('id', tx.id)

        if (markError) {
          console.error(`❌ Error marking transaction ${tx.id} as expired:`, markError)
        } else {
          console.log(`  ✅ Marked transaction ${tx.id} (${tx.amount} Palomas) as expired`)
        }
      }

      // Get current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('dov_balance, username, total_palomas_collected')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.error(`❌ Error fetching profile for user ${userId}:`, profileError)
        continue
      }

      // Calculate new balance (don't go below 0)
      const currentBalance = profile.dov_balance || 0
      const newBalance = Math.max(0, currentBalance - totalExpiredForUser)

      console.log(`  📉 User ${profile.username}: ${currentBalance} → ${newBalance} Palomas`)

      // Update user's balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          dov_balance: newBalance,
          last_expiration_check: now
        })
        .eq('id', userId)

      if (updateError) {
        console.error(`❌ Error updating balance for user ${userId}:`, updateError)
      } else {
        console.log(`  ✅ Updated balance for ${profile.username}`)
      }

      totalExpired += totalExpiredForUser
      results.push({
        user_id: userId,
        username: profile.username,
        expired_amount: totalExpiredForUser,
        transaction_count: transactions.length,
        old_balance: currentBalance,
        new_balance: newBalance
      })
    }

    console.log(`\n✅ Expiration complete!`)
    console.log(`   Total Palomas expired: ${totalExpired}`)
    console.log(`   Users affected: ${results.length}`)
    console.log(`   Transactions processed: ${expiredTransactions.length}`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Expired ${totalExpired} Palomas across ${results.length} users`,
        timestamp: now,
        summary: {
          total_expired: totalExpired,
          users_affected: results.length,
          transactions_processed: expiredTransactions.length
        },
        details: results
      })
    }
  } catch (error) {
    console.error('❌ Fatal error during expiration:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Expiration failed',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }
}
