import React, { useState, useEffect } from 'react'
import { Upload, Plus, Edit, Trash2, Save, X, Coffee } from 'lucide-react'
import WalletInput from './WalletInput'
import ProfilePicture from './ProfilePicture'

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num || 0)
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
  onShowCupGame,
  onShowSendMeritsForm,
  onWalletSave,
  onLogout,
  onProfileUpdate,
  message,
  onShowSendForm,
  onShowReleaseForm,
  onPayPalClick
}) {
  const [showProductManager, setShowProductManager] = useState(false);

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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
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
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #d2691e',
              borderRadius: '50%',
              padding: '0.4rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
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
            <div style={{
              fontSize: '0.7rem',
              fontWeight: '500',
              color: '#8b4513',
              fontStyle: 'italic',
              marginTop: '0.2rem',
              textAlign: 'center',
              lineHeight: '1'
            }}>
              {(profile?.username || 'User').length > 6 
                ? (profile?.username || 'User').substring(0, 6) + '...'
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

          {/* Center - Cup Game */}
          <button
            onClick={onShowCupGame}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #d2691e',
              borderRadius: '50%',
              width: '70px',
              height: '70px',
              fontSize: '1.8rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
              transition: 'all 0.3s ease',
              color: '#d2691e'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)'
              e.target.style.boxShadow = '0 6px 20px rgba(210, 105, 30, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.boxShadow = '0 4px 15px rgba(210, 105, 30, 0.3)'
            }}
            title="Cup Game"
          >
            🏆
            <div style={{
              fontSize: '0.7rem',
              fontWeight: '500',
              color: '#8b4513',
              fontStyle: 'italic',
              marginTop: '0.2rem'
            }}>
              Cups
            </div>
          </button>

          {/* Right - Hanglight */}
          <a 
            href="https://hanglight.mx" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #d2691e',
              borderRadius: '50%',
              width: '70px',
              height: '70px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)'
            }}
          >
            🟢
            <div style={{
              fontSize: '0.7rem',
              fontWeight: '500',
              color: '#8b4513',
              fontStyle: 'italic',
              marginTop: '0.2rem'
            }}>
              Hang
            </div>
          </a>

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

              {/* Admin Product Management Button */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowProductManager(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#d2691e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}
                >
                  🛍️ Manage Products
                </button>
              )}
              
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '0.8rem',
            marginBottom: '1.5rem',
            backgroundColor: message.includes('successful') || message.includes('Sent') || message.includes('Released') || message.includes('connected') ? '#d4edda' : 
                           message.includes('failed') ? '#f8d7da' : '#fff3cd',
            color: message.includes('successful') || message.includes('Sent') || message.includes('Released') || message.includes('connected') ? '#155724' : 
                   message.includes('failed') ? '#721c24' : '#856404',
            borderRadius: '15px',
            fontSize: '0.8rem',
            fontStyle: 'italic'
          }}>
            {message}
          </div>
        )}

        {/* Palomas Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🕊️</div>
          <h2 style={{
            fontSize: '2.2rem',
            color: '#d2691e',
            margin: '0 0 0.4rem 0',
            fontWeight: 'normal',
            fontStyle: 'italic'
          }}>
            Palomas
          </h2>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '0.6rem 1.2rem',
            display: 'inline-block',
            fontSize: '1.2rem',
            fontWeight: '500',
            color: '#8b4513',
            marginBottom: '1.2rem',
            fontStyle: 'italic'
          }}>
            {formatNumber(profile?.total_palomas_collected)}
          </div>
          <br />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
            {isAdmin ? (
              <button
                onClick={() => onShowSendForm('DOV')}
                style={{
                  background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.7rem 1.8rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                  width: '180px',
                  fontStyle: 'italic'
                }}
              >
                Send
              </button>
            ) : (
              <button
                onClick={() => onShowReleaseForm('DOV')}
                style={{
                  background: 'linear-gradient(45deg, #8b4513, #a0522d)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.7rem 1.8rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                  width: '180px',
                  fontStyle: 'italic'
                }}
              >
                Release
              </button>
            )}
            
            {/* Get Palomas Button */}
            <button
              onClick={onPayPalClick}
              style={{
                background: 'linear-gradient(45deg, #0070ba, #003087)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.7rem 1.8rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 112, 186, 0.3)',
                width: '180px',
                fontStyle: 'italic'
              }}
            >
              Get
            </button>
          </div>
        </div>

        {/* Tiempo Section */}
        <div>
          <h2 style={{
            fontSize: '2.2rem',
            color: '#8b4513',
            margin: '0 0 0.4rem 0',
            fontWeight: 'normal',
            fontStyle: 'italic'
          }}>
            Tiempo
          </h2>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>⏳</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '0.6rem 1.2rem',
            display: 'inline-block',
            fontSize: '1.2rem',
            fontWeight: '500',
            color: '#8b4513',
            marginBottom: '1.2rem',
            fontStyle: 'italic'
          }}>
            {formatNumber(profile?.djr_balance)}
          </div>
          <br />
          {isAdmin ? (
            <button
              onClick={() => onShowSendForm('DJR')}
              style={{
                background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.7rem 1.8rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                width: '180px',
                margin: '0 auto',
                fontStyle: 'italic'
              }}
            >
              Send
            </button>
          ) : (
            <button
              onClick={() => onShowReleaseForm('DJR')}
              style={{
                background: 'linear-gradient(45deg, #8b4513, #a0522d)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.7rem 1.8rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
                width: '180px',
                margin: '0 auto',
                display: 'block',
                fontStyle: 'italic'
              }}
            >
              Release
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
