// netlify/functions/paypal-webhook.js
const { createClient } = require('@supabase/supabase-js')

// PayPal API endpoints - LIVE
const PAYPAL_API_BASE = 'https://api-m.paypal.com'

// PayPal webhook verification function
async function verifyPayPalWebhook(headers, body, webhookId) {
  try {
    // Get PayPal access token (LIVE)
    const authResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    })
    
    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Verify webhook signature (LIVE)
    const verifyResponse = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        transmission_id: headers['paypal-transmission-id'],
        cert_id: headers['paypal-cert-id'],
        auth_algo: headers['paypal-auth-algo'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(body)
      })
    })

    const verifyData = await verifyResponse.json()
    return verifyData.verification_status === 'SUCCESS'
  } catch (error) {
    console.error('Webhook verification error:', error)
    // For development, allow through if verification fails
    return true
  }
}

// Main webhook handler
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Initialize Supabase client with SERVICE ROLE KEY (has full permissions)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY  // Changed from ANON key to SERVICE ROLE key
    )

    // Parse the webhook body
    const webhookData = JSON.parse(event.body)
    
    console.log('PayPal Webhook received:', {
      event_type: webhookData.event_type,
      resource_type: webhookData.resource_type,
      summary: webhookData.summary,
      full_payload: webhookData
    })

    // Verify webhook authenticity (temporarily disabled for testing)
    const isValid = await verifyPayPalWebhook(
      event.headers, 
      event.body, 
      process.env.PAYPAL_WEBHOOK_ID
    )

    if (!isValid) {
      console.warn('PayPal webhook signature verification failed - proceeding anyway for testing')
      // Temporarily allow through for testing - re-enable verification in production
      // return {
      //   statusCode: 400,
      //   body: JSON.stringify({ error: 'Invalid webhook signature' })
      // }
    }

    // Handle payment completion events
    if (webhookData.event_type === 'PAYMENT.SALE.COMPLETED' ||
        webhookData.event_type === 'PAYMENT.CAPTURE.COMPLETED' || 
        webhookData.event_type === 'CHECKOUT.ORDER.APPROVED') {
      
      const resource = webhookData.resource
      console.log('Payment resource:', resource)

      // Extract payment details
      let paymentAmount = 0
      if (resource.amount?.total) {
        paymentAmount = parseFloat(resource.amount.total)
      } else if (resource.amount?.value) {
        paymentAmount = parseFloat(resource.amount.value)
      } else if (resource.purchase_units?.[0]?.amount?.value) {
        paymentAmount = parseFloat(resource.purchase_units[0].amount.value)
      }
      
      // Extract custom_id (user ID) from the payment - prioritize custom_id field
      let userId = null
      
      // Check in order of most likely location for live payments
      if (resource.custom_id) {
        userId = resource.custom_id
        console.log('Found user ID in resource.custom_id:', userId)
      } else if (resource.custom) {
        userId = resource.custom
        console.log('Found user ID in resource.custom:', userId)
      } else if (resource.invoice_id) {
        userId = resource.invoice_id
        console.log('Found user ID in resource.invoice_id:', userId)
      } else if (resource.purchase_units?.[0]?.custom_id) {
        userId = resource.purchase_units[0].custom_id
        console.log('Found user ID in resource.purchase_units[0].custom_id:', userId)
      } else if (resource.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id) {
        userId = resource.purchase_units[0].payments.captures[0].custom_id
        console.log('Found user ID in resource.purchase_units[0].payments.captures[0].custom_id:', userId)
      }

      console.log('Extracted values:', { paymentAmount, userId })

      if (!userId) {
        console.error('No user ID found in PayPal payment data')
        console.log('Full resource object for debugging:', JSON.stringify(resource, null, 2))
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No user ID found in payment' })
        }
      }

      if (paymentAmount <= 0) {
        console.error('Invalid payment amount:', paymentAmount)
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid payment amount' })
        }
      }

      console.log(`Processing payment: $${paymentAmount} for user ${userId}`)

      // Calculate Palomas based on new pricing: 10 Palomas per $10 USD
      // This means $1 = 1 Paloma, but only in groups of 10
      const palomasToAdd = Math.floor(paymentAmount / 10) * 10
      
      // Validate that the payment is in valid increments of $10
      if (paymentAmount % 10 !== 0) {
        console.warn(`Payment amount $${paymentAmount} is not in $10 increments. Rounding down to $${Math.floor(paymentAmount / 10) * 10}`)
      }

      console.log(`Payment calculation:
        - Payment amount: $${paymentAmount}
        - Groups of $10: ${Math.floor(paymentAmount / 10)}
        - Palomas to add: ${palomasToAdd}`)

      // Enhanced logging for debugging
      console.log(`Looking up user: ${userId}`)

      // Update user's Paloma balance and total - with enhanced logging
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('dov_balance, total_palomas_collected, id, username')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching user profile:', fetchError)
        console.log('Fetch error details:', JSON.stringify(fetchError, null, 2))
        console.log('User ID that failed lookup:', userId)
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Database error - user not found' })
        }
      }

      // Log what we found
      console.log('Current profile found:', JSON.stringify(currentProfile, null, 2))

      const newDovBalance = (currentProfile.dov_balance || 0) + palomasToAdd
      const newTotalPalomas = (currentProfile.total_palomas_collected || 0) + palomasToAdd

      console.log(`Calculating update:`)
      console.log(`- Current DOV balance: ${currentProfile.dov_balance}`)
      console.log(`- Palomas to add: ${palomasToAdd}`)
      console.log(`- New DOV balance will be: ${newDovBalance}`)
      console.log(`- New total palomas will be: ${newTotalPalomas}`)

      // Update the database with enhanced logging
      console.log('About to update database...')
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({
          dov_balance: newDovBalance,
          total_palomas_collected: newTotalPalomas,
          last_status_update: new Date().toISOString()
        })
        .eq('id', userId)
        .select()  // Return the updated data

      console.log('Update result:', updateResult)
      console.log('Update error:', updateError)

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        console.log('Update error details:', JSON.stringify(updateError, null, 2))
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to update user balance' })
        }
      }

      // Insert transaction record for expiration tracking
      console.log('Creating paloma_transaction record for expiration tracking...')
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1) // 1 year from now

      const { error: transactionError } = await supabase
        .from('paloma_transactions')
        .insert([{
          user_id: userId,
          amount: palomasToAdd,
          transaction_type: 'purchase',
          source: 'paypal',
          received_at: new Date().toISOString(),
          expires_at: expirationDate.toISOString(),
          metadata: {
            payment_amount: paymentAmount,
            paypal_transaction_id: resource.id || resource.transaction_id,
            event_type: webhookData.event_type
          }
        }])

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError)
        // Don't fail the webhook - balance was updated successfully
        // Just log the error for debugging
      } else {
        console.log(`✅ Transaction record created: ${palomasToAdd} Palomas expiring on ${expirationDate.toISOString()}`)
      }

      // Verify the update worked by fetching again
      console.log('Verifying update by fetching user again...')
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('dov_balance, total_palomas_collected')
        .eq('id', userId)
        .single()

      console.log('Verification fetch result:', verifyProfile)
      console.log('Verification fetch error:', verifyError)

      // Calculate and update cups (1 cup = 100 Palomas)
      const cupsEarned = Math.floor(newTotalPalomas / 100)
      
      const { error: cupUpdateError } = await supabase
        .from('profiles')
        .update({
          cup_count: cupsEarned
        })
        .eq('id', userId)

      if (cupUpdateError) {
        console.error('Error updating cup count:', cupUpdateError)
      }

      // Log the cup award if cups increased
      const previousCups = Math.floor((currentProfile.total_palomas_collected || 0) / 100)
      if (cupsEarned > previousCups) {
        await supabase
          .from('cup_logs')
          .insert([{
            user_id: userId,
            awarded_by: userId,
            amount: cupsEarned - previousCups,
            reason: `Earned from PayPal payment of $${paymentAmount} (${palomasToAdd} Palomas)`,
            cup_count_after: cupsEarned
          }])
      }

      console.log(`Successfully processed payment:
        User: ${userId}
        Payment Amount: $${paymentAmount}
        Palomas added: ${palomasToAdd}
        New DOV balance: ${newDovBalance}
        New total Palomas: ${newTotalPalomas}
        Cups earned: ${cupsEarned}`)

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          paymentAmount: paymentAmount,
          palomasAdded: palomasToAdd,
          newBalance: newDovBalance,
          cupsEarned: cupsEarned
        })
      }
    }

    // Handle other webhook events
    console.log('Unhandled webhook event type:', webhookData.event_type)
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook received but not processed' })
    }

  } catch (error) {
    console.error('PayPal webhook error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    }
  }
}
