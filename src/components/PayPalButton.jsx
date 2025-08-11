import React, { useState, useEffect } from 'react'

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

export default PayPalButton