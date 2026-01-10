import React, { useState, useEffect } from 'react'
import { Upload, Plus, Edit, Trash2, Save, X, Coffee, ArrowLeft, Receipt, Calendar, Package } from 'lucide-react'
import WalletInput from './WalletInput'
import ProfilePicture from './ProfilePicture'
import SendPalomas from './SendPalomas'
import RequestCashout from './RequestCashout'
import PalomasHistory from './PalomasHistory'
import ExpirationWarning from './ExpirationWarning'
import StorePage from './StorePage'
import { useLanguage } from '../contexts/LanguageContext'

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0)
}

// Love History Component (renamed from Purchase History)
const LoveHistory = ({ user, profile, supabase, onBack }) => {
  console.log('LoveHistory component rendered with user:', user?.id, 'profile:', profile?.username)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  
  // Get background image URL based on screen size
  const getBackgroundImage = () => {
    if (!supabase) return null
    
    const isMobile = window.innerWidth <= 768
    const filename = isMobile ? 'backgroundmobile.png' : 'backgrounddesktop.png'
    
    const { data: { publicUrl } } = supabase.storage
      .from('tarot-cards')
      .getPublicUrl(filename)
    
    return publicUrl
  }

  const [backgroundUrl, setBackgroundUrl] = useState(getBackgroundImage())

  // Update background on resize
  useEffect(() => {
    const handleResize = () => {
      setBackgroundUrl(getBackgroundImage())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [supabase])

  useEffect(() => {
    if (user && supabase) {
      loadLoveHistory()
    }
  }, [user, supabase])

  const loadLoveHistory = async () => {
    console.log('Loading love history for user:', user.id)
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('love_transactions')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading love history:', error)
        // Continue even with error to show the UI
      }

      console.log('Love history loaded:', data)
      
      // Calculate running balance
      let runningBalance = profile?.lov_balance || 0
      const transactionsWithBalance = (data || []).map((transaction, index) => {
        // For the first transaction, the balance is the current balance
        if (index === 0) {
          return { ...transaction, running_balance: runningBalance }
        }
        
        // Work backwards to calculate what the balance was at this transaction
        const prevTransaction = data[index - 1]
        if (prevTransaction.sender_id === user.id) {
          runningBalance += prevTransaction.amount // Add back what was sent
        } else {
          runningBalance -= prevTransaction.amount // Remove what was received
        }
        
        return { ...transaction, running_balance: runningBalance }
      })
      
      setTransactions(transactionsWithBalance)
    } catch (error) {
      console.error('Error loading love history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'purchased': return '#f59e0b'
      case 'fulfilled': return '#10b981'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'purchased': return 'Ready for Pickup'
      case 'fulfilled': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'beverages': return '☕'
      case 'food': return '🍕'
      case 'merchandise': return '👕'
      case 'experiences': return '🎨'
      default: return '🎁'
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        padding: '2rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #d2691e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <span>Loading love history...</span>
        </div>
      </div>
    )
  }

  // Transaction Detail Modal
  if (selectedTransaction) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        padding: '2rem 1rem'
      }}>
        <div style={{
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <button
              onClick={() => setSelectedTransaction(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          {/* Receipt */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)',
            border: '2px solid #d2691e'
          }}>
            {/* Transaction Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem',
              borderBottom: '2px dashed #d2691e',
              paddingBottom: '1rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💝</div>
              <h2 style={{
                margin: '0 0 0.5rem',
                color: '#8b4513',
                fontSize: '1.5rem'
              }}>
                Casa de Copas
              </h2>
              <p style={{
                margin: 0,
                color: '#666',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                Love Transaction Receipt
              </p>
            </div>

            {/* Transaction Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#666' }}>Transaction #:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {selectedTransaction.id?.slice(-8) || 'N/A'}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#666' }}>Date:</span>
                <span>{formatDate(selectedTransaction.created_at)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#666' }}>Type:</span>
                <span>{selectedTransaction.sender_id === user.id ? 'Love Sent' : 'Love Received'}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#666' }}>Other Party:</span>
                <span>
                  {selectedTransaction.sender_id === user.id 
                    ? selectedTransaction.recipient_username 
                    : selectedTransaction.sender_username}
                </span>
              </div>
            </div>

            {/* Love Details */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>
                  {selectedTransaction.sender_id === user.id ? '💝' : '💖'}
                </span>
                <h3 style={{
                  margin: 0,
                  color: '#8b4513',
                  fontSize: '1.1rem'
                }}>
                  Love Transaction
                </h3>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  {selectedTransaction.description || 'Love transaction'}
                </span>
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: selectedTransaction.sender_id === user.id ? '#dc3545' : '#28a745',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {selectedTransaction.sender_id === user.id ? '-' : '+'}{selectedTransaction.amount}
                  <img 
                    src={supabase ? 
                      supabase.storage.from('tarot-cards').getPublicUrl('LOV.png').data.publicUrl 
                      : '/placeholder-love.png'
                    }
                    alt="Love"
                    style={{
                      width: '16px',
                      height: '16px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.outerHTML = '❤️'
                    }}
                  />
                </span>
              </div>
            </div>

            {/* Status */}
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: selectedTransaction.sender_id === user.id ? '#fff5f5' : '#f0fff4',
              border: `2px solid ${selectedTransaction.sender_id === user.id ? '#fed7d7' : '#c6f6d5'}`
            }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: selectedTransaction.sender_id === user.id ? '#c53030' : '#2f855a',
                marginBottom: '0.25rem'
              }}>
                {selectedTransaction.sender_id === user.id ? 'Love Sent' : 'Love Received'}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#666',
                fontStyle: 'italic'
              }}>
                Transaction completed successfully
              </div>
            </div>

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '2px dashed #d2691e',
              color: '#666',
              fontSize: '0.8rem',
              fontStyle: 'italic'
            }}>
              Thank you for supporting Casa de Copas! 🎨
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '20px',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
          
          <h1 style={{
            fontSize: '2rem',
            color: '#d2691e',
            margin: 0,
            fontWeight: 'normal'
          }}>
            Transaction History
          </h1>
          
          <div style={{ width: '80px' }} />
        </div>

        {/* Transaction List - Table Format */}
        {transactions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            border: '2px solid #d2691e'
          }}>
            <Package size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
            <h3 style={{ color: '#8b4513', marginBottom: '0.5rem' }}>No Love Sent Yet</h3>
            <p style={{ color: '#666', margin: 0 }}>
              Your love transactions will appear here
            </p>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(145deg, rgba(255, 248, 220, 0.95), rgba(250, 235, 215, 0.95))',
            borderRadius: '20px',
            border: '2px solid #d2691e',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(210, 105, 30, 0.2)'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 120px 120px 80px 100px',
              gap: '0.5rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #d2691e, #cd853f, #daa520)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              <div>Date</div>
              <div>From</div>
              <div>To</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
              <div style={{ textAlign: 'right' }}>Balance</div>
            </div>
            
            {/* Transaction Rows */}
            {transactions.map((transaction, index) => {
              const isSent = transaction.sender_id === user.id
              return (
                <div
                  key={transaction.id}
                  onClick={() => setSelectedTransaction(transaction)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 120px 120px 80px 100px',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderBottom: index < transactions.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    fontSize: '0.9rem'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 248, 220, 0.8), rgba(245, 222, 179, 0.8))'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {/* Date */}
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#666'
                  }}>
                    {new Date(transaction.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  
                  {/* From */}
                  <div style={{
                    fontWeight: transaction.sender_id === user.id ? '600' : '400',
                    color: transaction.sender_id === user.id ? '#8b4513' : '#666',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {transaction.sender_username}
                    {transaction.sender_id === user.id && ' (You)'}
                  </div>
                  
                  {/* To */}
                  <div style={{
                    fontWeight: transaction.recipient_id === user.id ? '600' : '400',
                    color: transaction.recipient_id === user.id ? '#8b4513' : '#666',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {transaction.recipient_username}
                    {transaction.recipient_id === user.id && ' (You)'}
                  </div>
                  
                  {/* Amount */}
                  <div style={{
                    textAlign: 'right',
                    fontWeight: '600',
                    color: isSent ? '#dc3545' : '#28a745',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.25rem'
                  }}>
                    {isSent ? '-' : '+'}{transaction.amount}
                    <img 
                      src={supabase ? 
                        supabase.storage.from('tarot-cards').getPublicUrl('LOV.png').data.publicUrl 
                        : '/placeholder-love.png'
                      }
                      alt="Love"
                      style={{
                        width: '14px',
                        height: '14px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.outerHTML = '❤️'
                      }}
                    />
                  </div>
                  
                  {/* Running Balance */}
                  <div style={{
                    textAlign: 'right',
                    fontWeight: '500',
                    color: '#e91e63',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.25rem'
                  }}>
                    {transaction.running_balance || profile?.lov_balance || 0}
                    <img 
                      src={supabase ? 
                        supabase.storage.from('tarot-cards').getPublicUrl('LOV.png').data.publicUrl 
                        : '/placeholder-love.png'
                      }
                      alt="Love"
                      style={{
                        width: '12px',
                        height: '12px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.outerHTML = '❤️'
                      }}
                    />
                  </div>
                </div>
              )
            })}
            
            {/* Current Balance Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 120px 120px 80px 100px',
              gap: '0.5rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(255, 248, 220, 0.9), rgba(255, 228, 196, 0.9))',
              borderTop: '2px solid #d2691e',
              fontWeight: '600'
            }}>
              <div></div>
              <div></div>
              <div></div>
              <div style={{ textAlign: 'right', color: '#8b4513' }}>Current:</div>
              <div style={{
                textAlign: 'right',
                color: '#e91e63',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.25rem'
              }}>
                {profile?.lov_balance || 0}
                <img 
                  src={supabase ? 
                    supabase.storage.from('tarot-cards').getPublicUrl('LOV.png').data.publicUrl 
                    : '/placeholder-love.png'
                  }
                  alt="Love"
                  style={{
                    width: '14px',
                    height: '14px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.outerHTML = '❤️'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Admin Product Manager Component
const AdminProductManager = ({ profile, supabase, onBack }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'beverages',
    price: '',
    image_url: '',
    image_file: null
  });

  const categories = [
    'beverages',
    'food',
    'merchandise',
    'experiences',
    'other'
  ];

  // Check if user is admin
  const isAdmin = profile?.username === 'JPR333';

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('casa_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image_file: file
      }));
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let imageUrl = formData.image_url;
      
      if (formData.image_file) {
        imageUrl = await uploadImage(formData.image_file);
        if (!imageUrl) return;
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseInt(formData.price),
        image_url: imageUrl
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('casa_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('casa_products')
          .insert([productData]);

        if (error) throw error;
      }

      resetForm();
      fetchProducts();
      
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price.toString(),
      image_url: product.image_url || '',
      image_file: null
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('casa_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'beverages',
      price: '',
      image_url: '',
      image_file: null
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
        padding: '1rem'
      }}>
        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '15px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#721c24', marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ color: '#721c24' }}>You don't have permission to access the admin panel.</p>
          <button onClick={onBack} style={{
            background: '#d2691e',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.5rem 1rem',
            marginTop: '1rem',
            cursor: 'pointer'
          }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #d2691e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <span>Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={onBack}
          style={{
            background: '#8b4513',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.5rem 1rem',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '1.5rem', color: '#d2691e', margin: 0 }}>Product Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            background: '#d2691e',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{
          background: 'white',
          border: '2px solid #d2691e',
          borderRadius: '15px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h2 style={{ margin: 0, color: '#8b4513' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={resetForm}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Price (Palomas) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="1"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
              <p style={{ fontSize: '0.7rem', color: '#666', margin: '0.25rem 0 0' }}>
                Max 5MB, JPG/PNG recommended
              </p>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
                placeholder="Optional product description..."
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSubmit}
                disabled={uploadingImage}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: uploadingImage ? 0.7 : 1
                }}
              >
                {uploadingImage ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </>
                )}
              </button>
              <button
                onClick={resetForm}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div style={{
        background: 'white',
        border: '2px solid #d2691e',
        borderRadius: '15px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #ddd',
          background: '#f8f9fa'
        }}>
          <h3 style={{ margin: 0, color: '#8b4513' }}>
            Current Products ({products.length})
          </h3>
        </div>

        {products.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Coffee size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
            <p style={{ color: '#666', marginBottom: '1rem' }}>No products in the store yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                background: '#d2691e',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '0.5rem 1rem',
                cursor: 'pointer'
              }}
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div>
            {products.map((product, index) => (
              <div 
                key={product.id} 
                style={{
                  padding: '1rem',
                  borderBottom: index < products.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Coffee size={24} style={{ color: '#999' }} />
                    )}
                  </div>
                  
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#333' }}>{product.name}</h4>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: '#666', textTransform: 'capitalize' }}>
                      {product.category}
                    </p>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: '500', color: '#28a745' }}>
                      {product.price} Palomas
                    </p>
                    {product.description && (
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.8rem', 
                        color: '#666',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Edit product"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Delete product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Main Dashboard Component
function Dashboard({
  profile,
  user,
  supabase,
  isAdmin,
  showSettings,
  setShowSettings,
  onShowNotifications,
  onShowSendMeritsForm,
  onWalletSave,
  onLogout,
  onProfileUpdate,
  message,
  onShowPalomasMenu,
  onShowTickets
}) {
  const [showProductManager, setShowProductManager] = useState(false);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showPalomasHistory, setShowPalomasHistory] = useState(false);
  const [showSendPalomas, setShowSendPalomas] = useState(false);
  const [showRequestCashout, setShowRequestCashout] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { language, toggleLanguage, t } = useLanguage();

  // Get background image URL based on screen size
  const getBackgroundImage = () => {
    if (!supabase) return null
    
    const isMobile = window.innerWidth <= 768
    const filename = isMobile ? 'backgroundmobile.png' : 'backgrounddesktop.png'
    
    const { data: { publicUrl } } = supabase.storage
      .from('tarot-cards')
      .getPublicUrl(filename)
    
    return publicUrl
  }

  const [backgroundUrl, setBackgroundUrl] = useState(getBackgroundImage())

  // Update background on resize
  useEffect(() => {
    const handleResize = () => {
      setBackgroundUrl(getBackgroundImage())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [supabase])

  // If showing love history, render that instead
  if (showPurchaseHistory) {
    return (
      <LoveHistory
        user={user}
        profile={profile}
        supabase={supabase}
        onBack={() => setShowPurchaseHistory(false)}
      />
    );
  }

  // If showing Palomas history, render that instead
  if (showPalomasHistory) {
    return (
      <PalomasHistory
        profile={profile}
        supabase={supabase}
        onClose={() => setShowPalomasHistory(false)}
      />
    );
  }

  // If showing product manager, render that instead
  if (showProductManager) {
    return (
      <AdminProductManager
        profile={profile}
        supabase={supabase}
        onBack={() => setShowProductManager(false)}
      />
    );
  }

  // Handle success messages from modals
  const handleSuccess = (msg) => {
    setSuccessMessage(msg)
    // Clear the message after 5 seconds
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '1rem',
      position: 'relative',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Top Navigation - Three evenly spaced sections */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '0 0.5rem',
          gap: '0.5rem'
        }}>
          {/* Left - Profile Section */}
          <div 
            onClick={() => setShowSettings(!showSettings)}
            style={{
              cursor: 'pointer',
              width: '70px',
              height: '70px',
              position: 'relative'
            }}
          >
            <ProfilePicture
              supabase={supabase}
              user={user}
              profile={profile}
              onProfileUpdate={onProfileUpdate}
              size="small"
              showUpload={false}
            />
            {/* Username overlay */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontSize: '0.6rem',
              fontWeight: '600',
              textAlign: 'center',
              padding: '0.2rem',
              borderBottomLeftRadius: '50%',
              borderBottomRightRadius: '50%',
              lineHeight: '1'
            }}>
              {(profile?.username || 'User').length > 8 
                ? (profile?.username || 'User').substring(0, 8) + '...'
                : (profile?.username || 'User')}
            </div>
            
            {/* Admin indicators */}
            {isAdmin && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                display: 'flex',
                gap: '2px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowNotifications()
                  }}
                  style={{
                    background: '#d2691e',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  🔔
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowSendMeritsForm()
                  }}
                  style={{
                    background: '#d2691e',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                  title="Send Merits"
                >
                  ⭐
                </button>
              </div>
            )}
          </div>

          {/* Center - Spacer (Cup Game hidden for now) */}
          <div style={{ width: '70px' }} />

          {/* Right - Store/Power-Ups button */}
          <button
            onClick={() => setShowStore(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '2rem',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.1)'
              e.target.style.filter = 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
            }}
            title="Power-Ups Store"
          >
            ✨
          </button>

          {/* Settings Panel */}
          {showSettings && (
            <div style={{
              position: 'absolute',
              top: '4rem',
              left: '0.5rem',
              right: '0.5rem',
              background: 'white',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              padding: '1rem',
              zIndex: 1000
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <ProfilePicture
                  supabase={supabase}
                  user={user}
                  profile={profile}
                  onProfileUpdate={onProfileUpdate}
                  size="large"
                  showUpload={true}
                />
              </div>

              <WalletInput 
                onWalletSave={onWalletSave}
                currentWallet={profile?.wallet_address}
              />

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #8b0000, #dc143c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  boxShadow: '0 2px 8px rgba(139, 0, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>
                  {language === 'en' ? '🇲🇽' : '🇺🇸'}
                </span>
                {language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
              </button>

              {/* Palomas History Button */}
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowPalomasHistory(true);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #8b4513, #a0522d)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)'
                }}
              >
                Palomas History
              </button>

              {/* Admin Product Management Button */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowProductManager(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #b8860b, #daa520)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      boxShadow: '0 2px 8px rgba(184, 134, 11, 0.3)'
                    }}
                  >
                    Manage Products
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      onShowTickets(true); // Pass true to indicate admin view
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #cd853f, #f4a460)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      boxShadow: '0 2px 8px rgba(205, 133, 63, 0.3)'
                    }}
                  >
                    Manage Tickets
                  </button>
                </>
              )}
              
              {/* Logout Button */}
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #8b4513, #a0522d)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)',
                  opacity: 0.8
                }}
              >
                {t('dashboard.logout')}
              </button>
            </div>
          )}
        </div>

        {/* Message Display */}
        {(message || successMessage) && (
          <div style={{
            padding: '0.8rem',
            marginBottom: '1.5rem',
            backgroundColor: (message || successMessage).includes('successful') || (message || successMessage).includes('Sent') || (message || successMessage).includes('Released') || (message || successMessage).includes('connected') ? '#d4edda' : 
                           (message || successMessage).includes('failed') ? '#f8d7da' : '#fff3cd',
            color: (message || successMessage).includes('successful') || (message || successMessage).includes('Sent') || (message || successMessage).includes('Released') || (message || successMessage).includes('connected') ? '#155724' : 
                   (message || successMessage).includes('failed') ? '#721c24' : '#856404',
            borderRadius: '15px',
            fontSize: '0.8rem',
            fontStyle: 'italic'
          }}>
            {successMessage || message}
          </div>
        )}

        {/* Main Palomas Display - Center focal point */}
        <div style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Large tappable dove section */}
          <div
            onClick={() => onShowPalomasMenu && onShowPalomasMenu()}
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {/* DOV image */}
            <div style={{
              textAlign: 'center',
              marginBottom: '0rem',
              filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.2))'
            }}>
              <img 
                src={supabase ? 
                  supabase.storage.from('tarot-cards').getPublicUrl('DOV.png').data.publicUrl 
                  : '/placeholder-dove.png'
                }
                alt="Palomas"
                style={{
                  width: 'clamp(12rem, 30vw, 20rem)',
                  height: 'auto',
                  maxWidth: '100%'
                }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div style={{
                fontSize: 'clamp(12rem, 30vw, 20rem)',
                fontWeight: '700',
                display: 'none',
                textAlign: 'center',
                lineHeight: '0.9'
              }}>
                🕊️
              </div>
            </div>
            
            {/* Palomas count - big */}
            <div style={{
              fontSize: 'clamp(4rem, 12vw, 7rem)', // Large responsive size
              fontWeight: '700',
              color: '#f5f5dc', // Cream/ivory color
              fontStyle: 'italic',
              textAlign: 'center',
              lineHeight: '1',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.6)' // Stronger shadow for better contrast
            }}>
              {formatNumber(profile?.dov_balance || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Expiration Warning */}
      <ExpirationWarning supabase={supabase} userId={user?.id} />

      {/* SendPalomas Modal */}
      {showSendPalomas && (
        <SendPalomas
          profile={profile}
          supabase={supabase}
          onClose={() => setShowSendPalomas(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* RequestCashout Modal */}
      {showRequestCashout && (
        <RequestCashout
          profile={profile}
          supabase={supabase}
          onClose={() => setShowRequestCashout(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Store/Power-Ups Modal */}
      {showStore && (
        <StorePage
          supabase={supabase}
          onClose={() => setShowStore(false)}
        />
      )}
    </div>
  )
}

export default Dashboard
