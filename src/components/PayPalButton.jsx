import React, { useState, useEffect, useRef } from 'react'

const PayPalButton = ({ user, onSuccess, onError, profile, syncCupsFromPalomas }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const paypalRef = useRef(null)
  const sdkLoadedRef = useRef(false)

  useEffect(() => {
    if (!user) return

    // Only load SDK once
    if (!sdkLoadedRef.current) {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo,paylater`
      script.onload = () => {
        sdkLoadedRef.current = true
        setPaypalLoaded(true)
      }
      script.onerror = () => {
        onError && onError(new Error('Failed to load PayPal SDK'))
      }
      document.head.appendChild(script)
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }
    } else {
      setPaypalLoaded(true)
    }
  }, [user])

  useEffect(() => {
    if (!paypalLoaded || !user || !paypalRef.current || !window.paypal) return

    // Clear previous buttons
    paypalRef.current.innerHTML = ''

    window.paypal.Buttons({
      createOrder: (data, actions) => {
        setIsLoading(true)
        return actions.order.create({
          purchase_units: [{
            amount: { value: '10.00', currency_code: 'USD' },
            description: 'Casa de Copas Palomas - DOV Tokens',
            custom_id: user.id,
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
      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture()
          setIsLoading(false)
          onSuccess && onSuccess(order)
          if (syncCupsFromPalomas) setTimeout(() => syncCupsFromPalomas(user.id), 2000)
          alert(`Payment successful! Your Palomas will be credited shortly. Order ID: ${order.id}`)
        } catch (error) {
          setIsLoading(false)
          onError && onError(error)
        }
      },
      onError: (err) => {
        setIsLoading(false)
        onError && onError(err)
        alert('Payment failed. Please try again.')
      },
      onCancel: (data) => {
        setIsLoading(false)
        alert('Payment cancelled.')
      },
      style: {
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        layout: 'vertical',
        height: 40,
        tagline: false
      }
    }).render(paypalRef.current)
  }, [paypalLoaded, user])

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
      <div ref={paypalRef}></div>
    </div>
  )
}

export default PayPalButton