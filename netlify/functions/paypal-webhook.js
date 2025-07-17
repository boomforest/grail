// Save this as: netlify/functions/paypal-webhook.js
import { createClient } from '@supabase/supabase-js'

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Parse the PayPal webhook data
    const payload = JSON.parse(event.body)
    
    console.log('PayPal webhook received:', payload.event_type)
    
    // Only handle completed payments
    if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const payment = payload.resource
      const amount = parseFloat(payment.amount.value)
      const userId = payment.custom_id // This will be the user's ID
      
      // Calculate DOV tokens ($1 = 1 DOV)
      const dovTokens = amount
      
      console.log(`Payment: $${amount} -> ${dovTokens} DOV for user ${userId}`)
      
      if (userId) {
        // Initialize Supabase client
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        )
        
        // Get current user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('dov_balance, total_palomas_collected, username')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.error('Error finding user:', error)
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'User not found' })
          }
        }
        
        // Calculate new balances
        const newDovBalance = (profile.dov_balance || 0) + dovTokens
        const newTotalPalomas = (profile.total_palomas_collected || 0) + dovTokens
        
        // Update both DOV balance and total palomas collected
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            dov_balance: newDovBalance,
            total_palomas_collected: newTotalPalomas,
            last_status_update: new Date().toISOString()
          })
          .eq('id', userId)
        
        if (updateError) {
          console.error('Error updating balance:', updateError)
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Database update failed' })
          }
        }
        
        console.log(`SUCCESS: Added ${dovTokens} DOV to ${profile.username}`)
        console.log(`New DOV balance: ${newDovBalance}`)
        console.log(`Total Palomas collected: ${newTotalPalomas}`)
        console.log(`Cups will be synced automatically: ${Math.floor(newTotalPalomas / 100)}`)
        
        // Log the transaction (optional - only if transactions table exists)
        try {
          await supabase
            .from('transactions')
            .insert([{
              user_id: userId,
              type: 'purchase',
              amount: dovTokens,
              token_type: 'DOV',
              paypal_payment_id: payment.id,
              usd_amount: amount,
              created_at: new Date().toISOString()
            }])
        } catch (transactionError) {
          // Don't fail the webhook if transaction logging fails
          console.log('Transaction logging failed (table may not exist):', transactionError)
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true, 
            message: `Added ${dovTokens} DOV tokens`,
            total_palomas: newTotalPalomas,
            cups_available: Math.floor(newTotalPalomas / 100)
          })
        }
      } else {
        console.error('No user ID found in payment.custom_id')
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No user ID provided' })
        }
      }
    } else {
      console.log(`Ignoring event type: ${payload.event_type}`)
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Event type not handled' })
      }
    }
    
  } catch (error) {
    console.error('Webhook error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed', details: error.message })
    }
  }
}
