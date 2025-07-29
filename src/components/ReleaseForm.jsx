import React, { useState, useEffect } from 'react'

// Helper function to calculate Tiempo earning rate based on tarot level
const calculateTiempoEarningRate = (tarotLevel) => {
  if (tarotLevel <= 1) return 0 // King of Swords starts at 0%
  if (tarotLevel <= 14) return (tarotLevel - 1) * 3 // Swords: 0%, 3%, 6%, 9%... up to 39%
  if (tarotLevel <= 26) return 39 + ((tarotLevel - 14) * 3) // Cups: 42%, 45%, 48%... up to 75%
  return 75 // Max rate
}

// Helper function to check if user can use Tiempo for personal discounts
const canUsePersonalDiscounts = (tarotLevel) => {
  return tarotLevel >= 15 // Only Cups levels (15+)
}

function ReleaseForm({ tokenType, onBack, message, releaseData, setReleaseData, isReleasing, onRelease, user, profile, supabase }) {
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showProductManagement, setShowProductManagement] = useState(false)
  const [claimMessage, setClaimMessage] = useState('')

  // Product management states
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'beverages',
    price: '',
    cost_price: '', // NEW: Cost price for profit calculation
    image_url: ''
  })
  const [editingProduct, setEditingProduct] = useState(null)
  const [uploading, setUploading] = useState(false)

  const isAdmin = profile?.username === 'JPR333'
  const userTarotLevel = profile?.tarot_level || 1
  const tiempoEarningRate = calculateTiempoEarningRate(userTarotLevel)
  const canGetDiscounts = canUsePersonalDiscounts(userTarotLevel)

  // Load products
  useEffect(() => {
    loadProducts()
    if (showHistory) {
      loadPurchaseHistory()
    }
  }, [supabase, showHistory])

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const { data, error } = await supabase
        .from('casa_products')
        .select('*')
        .order('category', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadPurchaseHistory = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_purchase_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchaseHistory(data || [])
    } catch (error) {
      console.error('Error loading purchase history:', error)
    }
  }

  // Calculate Tiempo tokens that will be earned from a purchase
  const calculateTiempoEarning = (product) => {
    if (!product.cost_price || tiempoEarningRate === 0) return 0
    
    const profitMargin = product.price - product.cost_price
    const tiempoEarned = Math.floor((profitMargin * tiempoEarningRate / 100) * quantity)
    return Math.max(0, tiempoEarned)
  }

  // Award Tiempo tokens to user
  const awardTiempoTokens = async (userId, amount, reason) => {
    if (amount <= 0) return

    try {
      // Get current profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('tiempo_balance')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      // Update Tiempo balance
      const newBalance = (currentProfile.tiempo_balance || 0) + amount
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          tiempo_balance: newBalance,
          last_status_update: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError

      // Log the Tiempo award
      await supabase
        .from('tiempo_logs')
        .insert([{
          user_id: userId,
          amount: amount,
          transaction_type: 'earned',
          reason: reason,
          balance_after: newBalance
        }])

      console.log(`Awarded ${amount} Tiempo tokens to user ${userId}`)
    } catch (error) {
      console.error('Error awarding Tiempo tokens:', error)
    }
  }

  const handleClaimGift = async (product) => {
    if (!user || !profile) {
      setClaimMessage('Please log in to claim gifts')
      return
    }

    const totalCost = product.price * quantity
    if (profile.total_palomas_collected < totalCost) {
      setClaimMessage('Insufficient Palomas')
      return
    }

    try {
      // Calculate Tiempo earning before purchase
      const tiempoToEarn = calculateTiempoEarning(product)

      // Deduct Palomas from user balance
      const { error: deductError } = await supabase
        .from('profiles')
        .update({
          total_palomas_collected: profile.total_palomas_collected - totalCost,
          last_status_update: new Date().toISOString()
        })
        .eq('id', user.id)

      if (deductError) throw deductError

      // Generate receipt number
      const receiptNumber = `CDC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      // Create purchase record
      const purchaseRecord = {
        user_id: user.id,
        username: profile.username,
        product_name: product.name,
        product_description: product.description,
        quantity: quantity,
        unit_price: product.price,
        total_cost: totalCost,
        receipt_number: receiptNumber,
        pickup_status: 'pending'
      }

      const { error: purchaseError } = await supabase
        .from('user_purchase_history')
        .insert([purchaseRecord])

      if (purchaseError) throw purchaseError

      // Create admin notification
      const adminNotification = {
        user_id: user.id,
        username: profile.username,
        product_name: product.name,
        quantity: quantity,
        total_cost: totalCost,
        receipt_number: receiptNumber
      }

      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert([adminNotification])

      if (notificationError) throw notificationError

      // Award Tiempo tokens if earned
      if (tiempoToEarn > 0) {
        await awardTiempoTokens(
          user.id, 
          tiempoToEarn, 
          `Earned from purchasing ${product.name} (${quantity}x)`
        )
      }

      // Update local profile state
      profile.total_palomas_collected -= totalCost

      const tiempoMessage = tiempoToEarn > 0 ? ` You earned ${tiempoToEarn} Tiempo tokens!` : ''
      setClaimMessage(`Gift claimed successfully! Receipt: ${receiptNumber}.${tiempoMessage}`)
      setSelectedProduct(null)
      setQuantity(1)

    } catch (error) {
      console.error('Error claiming gift:', error)
      setClaimMessage('Error claiming gift: ' + error.message)
    }
  }

  // Product management functions
  const handleImageUpload = async (file) => {
    if (!file) return null

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProduct = async () => {
    try {
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        cost_price: parseFloat(newProduct.cost_price), // NEW: Save cost price
        image_url: newProduct.image_url
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('casa_products')
          .update(productData)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('casa_products')
          .insert([productData])
        if (error) throw error
      }

      setNewProduct({ name: '', description: '', category: 'beverages', price: '', cost_price: '', image_url: '' })
      setEditingProduct(null)
      loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      cost_price: product.cost_price?.toString() || '', // NEW: Load cost price
      image_url: product.image_url
    })
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('casa_products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  // Purchase History Modal Component
  const PurchaseHistoryModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#faf8f3',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={() => setShowHistory(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#8b5a3c'
          }}
        >
          ×
        </button>

        <h2 style={{ color: '#8b5a3c', marginBottom: '1.5rem' }}>Purchase History</h2>

        {purchaseHistory.length === 0 ? (
          <p style={{ color: '#a0785a', fontStyle: 'italic' }}>No purchases yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {purchaseHistory.map((purchase) => (
              <div
                key={purchase.id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid rgba(210, 105, 30, 0.2)',
                }}
              >
                <div style={{ fontWeight: '600', color: '#8b5a3c', marginBottom: '0.5rem' }}>
                  {purchase.product_name} (×{purchase.quantity})
                </div>
                <div style={{ fontSize: '0.9rem', color: '#a0785a', marginBottom: '0.5rem' }}>
                  {purchase.product_description}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#d2691e', marginBottom: '0.5rem' }}>
                  {purchase.total_cost} Palomas • Receipt: {purchase.receipt_number}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a0785a' }}>
                  {new Date(purchase.created_at).toLocaleDateString()} • Status: {purchase.pickup_status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (showHistory) {
    return <PurchaseHistoryModal />
  }

  if (showProductManagement && isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f1e8',
        padding: '2rem 1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button
            onClick={() => setShowProductManagement(false)}
            style={{
              marginBottom: '2rem',
              background: 'rgba(210, 105, 30, 0.1)',
              border: '1px solid rgba(210, 105, 30, 0.3)',
              borderRadius: '12px',
              padding: '0.8rem 1.5rem',
              cursor: 'pointer',
              color: '#d2691e'
            }}
          >
            ← Back to Store
          </button>

          <h1 style={{ color: '#8b5a3c', marginBottom: '2rem' }}>Product Management</h1>

          {/* Product Form */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid rgba(210, 105, 30, 0.2)'
          }}>
            <h2 style={{ color: '#8b5a3c', marginBottom: '1.5rem' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                style={{
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(210, 105, 30, 0.3)',
                  fontSize: '1rem'
                }}
              />

              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                rows={3}
                style={{
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(210, 105, 30, 0.3)',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />

              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                style={{
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(210, 105, 30, 0.3)',
                  fontSize: '1rem'
                }}
              >
                <option value="beverages">Beverages</option>
                <option value="food">Food</option>
                <option value="merchandise">Merchandise</option>
                <option value="experiences">Experiences</option>
                <option value="other">Other</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b5a3c', fontWeight: '500' }}>
                    Selling Price (Palomas)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Selling Price"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(210, 105, 30, 0.3)',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b5a3c', fontWeight: '500' }}>
                    Cost Price (Palomas)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Cost Price"
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({...newProduct, cost_price: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(210, 105, 30, 0.3)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              {/* Show profit margin calculation */}
              {newProduct.price && newProduct.cost_price && (
                <div style={{
                  padding: '0.8rem',
                  backgroundColor: 'rgba(210, 105, 30, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#8b5a3c'
                }}>
                  <strong>Profit Margin:</strong> {(parseFloat(newProduct.price) - parseFloat(newProduct.cost_price)).toFixed(2)} Palomas
                  ({(((parseFloat(newProduct.price) - parseFloat(newProduct.cost_price)) / parseFloat(newProduct.price)) * 100).toFixed(1)}%)
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b5a3c', fontWeight: '500' }}>
                  Product Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0]
                    if (file) {
                      try {
                        const imageUrl = await handleImageUpload(file)
                        setNewProduct({...newProduct, image_url: imageUrl})
                      } catch (error) {
                        alert('Failed to upload image')
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(210, 105, 30, 0.3)',
                    fontSize: '1rem'
                  }}
                />
                {uploading && <p style={{ color: '#d2691e', marginTop: '0.5rem' }}>Uploading...</p>}
              </div>

              <button
                onClick={handleSaveProduct}
                disabled={!newProduct.name || !newProduct.price || !newProduct.cost_price || uploading}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#d2691e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  opacity: (!newProduct.name || !newProduct.price || !newProduct.cost_price || uploading) ? 0.5 : 1
                }}
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>

              {editingProduct && (
                <button
                  onClick={() => {
                    setEditingProduct(null)
                    setNewProduct({ name: '', description: '', category: 'beverages', price: '', cost_price: '', image_url: '' })
                  }}
                  style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Existing Products List */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(210, 105, 30, 0.2)'
          }}>
            <h2 style={{ color: '#8b5a3c', marginBottom: '1.5rem' }}>Existing Products</h2>

            {products.length === 0 ? (
              <p style={{ color: '#a0785a', fontStyle: 'italic' }}>No products yet</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      border: '1px solid rgba(210, 105, 30, 0.2)',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#8b5a3c' }}>{product.name}</div>
                      <div style={{ fontSize: '0.9rem', color: '#a0785a' }}>
                        {product.category} • {product.price} Palomas
                        {product.cost_price && ` • Profit: ${(product.price - product.cost_price).toFixed(2)}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditProduct(product)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Rest of the component remains the same, but with added Tiempo earning display
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f1e8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem 1rem',
      color: '#8b5a3c'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(210, 105, 30, 0.1)',
              border: '1px solid rgba(210, 105, 30, 0.3)',
              borderRadius: '12px',
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              color: '#d2691e',
              fontWeight: '500'
            }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowHistory(true)}
              style={{
                background: 'rgba(210, 105, 30, 0.1)',
                border: '1px solid rgba(210, 105, 30, 0.3)',
                borderRadius: '12px',
                padding: '0.8rem 1.5rem',
                fontSize: '1rem',
                cursor: 'pointer',
                color: '#d2691e',
                fontWeight: '500'
              }}
            >
              📜 Purchase History
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowProductManagement(true)}
                style={{
                  background: 'rgba(210, 105, 30, 0.1)',
                  border: '1px solid rgba(210, 105, 30, 0.3)',
                  borderRadius: '12px',
                  padding: '0.8rem 1.5rem',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  color: '#d2691e',
                  fontWeight: '500'
                }}
              >
                ⚙️ Manage Products
              </button>
            )}
          </div>
        </div>

        {/* User Tiempo Info */}
        {tiempoEarningRate > 0 && (
          <div style={{
            backgroundColor: 'rgba(210, 105, 30, 0.1)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(210, 105, 30, 0.2)'
          }}>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#8b5a3c',
              marginBottom: '0.5rem'
            }}>
              🎯 Your Tiempo Earning Rate: {tiempoEarningRate}%
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#a0785a',
              lineHeight: '1.4'
            }}>
              You earn {tiempoEarningRate}% of profit margin as Tiempo tokens on purchases.
              {!canGetDiscounts && ' As a Swords level member, you can use Tiempo tokens to support Mexican artists.'}
              {canGetDiscounts && ' As a Cups level member, you can use Tiempo for discounts or artist support.'}
            </div>
          </div>
        )}

        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#d2691e',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          Casa de Copas Gift Store
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: '#a0785a',
          textAlign: 'center',
          marginBottom: '2rem',
          fontStyle: 'italic'
        }}>
          Claim gifts with your Palomas • Your balance: {profile?.total_palomas_collected || 0} Palomas
        </p>

        {/* Message */}
        {(message || claimMessage) && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: (message || claimMessage).includes('Error') ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)',
            color: (message || claimMessage).includes('Error') ? '#dc3545' : '#28a745',
            borderRadius: '12px',
            border: `1px solid ${(message || claimMessage).includes('Error') ? 'rgba(220, 53, 69, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`
          }}>
            {message || claimMessage}
          </div>
        )}

        {/* Product Selection Modal */}
        {selectedProduct && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#faf8f3',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              position: 'relative'
            }}>
              <button
                onClick={() => {
                  setSelectedProduct(null)
                  setQuantity(1)
                }}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#8b5a3c'
                }}
              >
                ×
              </button>

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                {selectedProduct.image_url && (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      marginBottom: '1rem'
                    }}
                  />
                )}
                <h2 style={{ color: '#8b5a3c', marginBottom: '0.5rem' }}>
                  {selectedProduct.name}
                </h2>
                <p style={{ color: '#a0785a', marginBottom: '1rem' }}>
                  {selectedProduct.description}
                </p>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#d2691e',
                  marginBottom: '1rem'
                }}>
                  {selectedProduct.price} Palomas each
                </div>
              </div>

              {/* Quantity Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1px solid rgba(210, 105, 30, 0.3)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#d2691e'
                  }}
                >
                  -
                </button>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#8b5a3c',
                  minWidth: '60px',
                  textAlign: 'center'
                }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1px solid rgba(210, 105, 30, 0.3)',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#d2691e'
                  }}
                >
                  +
                </button>
              </div>

              {/* Total Cost and Tiempo Earning */}
              <div style={{
                backgroundColor: 'rgba(210, 105, 30, 0.1)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#8b5a3c',
                  marginBottom: '0.5rem'
                }}>
                  Total: {selectedProduct.price * quantity} Palomas
                </div>
                
                {/* Show Tiempo earning if applicable */}
                {tiempoEarningRate > 0 && selectedProduct.cost_price && (
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#d2691e',
                    fontWeight: '500'
                  }}>
                    🎯 You'll earn {calculateTiempoEarning(selectedProduct)} Tiempo tokens
                  </div>
                )}
              </div>

              <button
                onClick={() => handleClaimGift(selectedProduct)}
                disabled={profile?.total_palomas_collected < (selectedProduct.price * quantity)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: profile?.total_palomas_collected >= (selectedProduct.price * quantity) ? '#d2691e' : '#cccccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: profile?.total_palomas_collected >= (selectedProduct.price * quantity) ? 'pointer' : 'not-allowed'
                }}
              >
                {profile?.total_palomas_collected >= (selectedProduct.price * quantity) 
                  ? 'Claim Gift' 
                  : 'Insufficient Palomas'}
              </button>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {['all', 'beverages', 'food', 'merchandise', 'experiences', 'other'].map((category) => (
            <button
              key={category}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: '1px solid rgba(210, 105, 30, 0.3)',
                backgroundColor: 'white',
                color: '#d2691e',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textTransform: 'capitalize'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#a0785a' }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#a0785a', fontStyle: 'italic' }}>No products available yet</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(210, 105, 30, 0.2)',
                  boxShadow: '0 4px 12px rgba(139, 90, 60, 0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onClick={() => setSelectedProduct(product)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 90, 60, 0.15)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 90, 60, 0.1)'
                }}
              >
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      marginBottom: '1rem'
                    }}
                  />
                )}
                
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#8b5a3c',
                  marginBottom: '0.5rem'
                }}>
                  {product.name}
                </h3>
                
                <p style={{
                  fontSize: '0.9rem',
                  color: '#a0785a',
                  marginBottom: '1rem',
                  lineHeight: '1.4'
                }}>
                  {product.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#d2691e'
                  }}>
                    {product.price} Palomas
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    color: '#a0785a',
                    textTransform: 'capitalize',
                    backgroundColor: 'rgba(210, 105, 30, 0.1)',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '12px'
                  }}>
                    {product.category}
                  </span>
                </div>

                {/* Show potential Tiempo earning on card */}
                {tiempoEarningRate > 0 && product.cost_price && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#d2691e',
                    fontWeight: '500'
                  }}>
                    🎯 Earn {Math.floor((product.price - product.cost_price) * tiempoEarningRate / 100)} Tiempo
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReleaseForm
