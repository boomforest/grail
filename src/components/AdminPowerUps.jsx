import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Upload, Languages, Loader } from 'lucide-react'
import {
  listAllPowerUps,
  createPowerUp,
  updatePowerUp,
  deletePowerUp,
  uploadPowerUpImage,
  getPowerUpImageUrl,
  validateDescription
} from '../utils/powerUpsUtils'

function AdminPowerUps({ profile, supabase, onBack }) {
  const [powerUps, setPowerUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPowerUp, setEditingPowerUp] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    category: 'studios',
    title: '',
    description: '',
    title_es: '',
    description_es: '',
    price_doves: '',
    sort_order: '0',
    is_active: true,
    image_file: null
  })
  const [translating, setTranslating] = useState(false)

  // Check if user is admin
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isAdmin = isDevelopment ? true : profile?.username === 'JPR333'

  useEffect(() => {
    if (isAdmin) {
      fetchPowerUps()
    }
  }, [isAdmin])

  const fetchPowerUps = async () => {
    try {
      const data = await listAllPowerUps(supabase)
      setPowerUps(data || [])
    } catch (error) {
      console.error('Error fetching power-ups:', error)
      alert('Failed to load power-ups')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // No file size limit - removed for Netlify compatibility

      setFormData(prev => ({
        ...prev,
        image_file: file
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      category: 'studios',
      title: '',
      description: '',
      title_es: '',
      description_es: '',
      price_doves: '',
      sort_order: '0',
      is_active: true,
      image_file: null
    })
    setEditingPowerUp(null)
    setShowAddForm(false)
  }

  const handleAutoTranslate = async () => {
    if (!formData.title && !formData.description) {
      alert('Please enter a title or description to translate')
      return
    }

    setTranslating(true)
    try {
      const response = await fetch('/.netlify/functions/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description
        })
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const translations = await response.json()

      setFormData(prev => ({
        ...prev,
        title_es: translations.title_es || prev.title_es,
        description_es: translations.description_es || prev.description_es
      }))
    } catch (error) {
      console.error('Translation error:', error)
      alert('Translation failed. Please try again or enter manually.')
    } finally {
      setTranslating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate description length
    const { valid, wordCount } = validateDescription(formData.description)
    if (!valid) {
      alert(`Description is too long (${wordCount} words). Maximum is 250 words.`)
      return
    }

    try {
      if (editingPowerUp) {
        // Update existing power-up
        let imagePath = editingPowerUp.image_path

        // Upload new image if provided
        if (formData.image_file) {
          setUploadingImage(true)
          imagePath = await uploadPowerUpImage(supabase, editingPowerUp.id, formData.image_file)
        }

        await updatePowerUp(supabase, editingPowerUp.id, {
          category: formData.category,
          title: formData.title,
          description: formData.description,
          title_es: formData.title_es || null,
          description_es: formData.description_es || null,
          price_doves: parseInt(formData.price_doves),
          sort_order: parseInt(formData.sort_order),
          is_active: formData.is_active,
          image_path: imagePath
        })

        alert('Power-up updated successfully!')
      } else {
        // Create new power-up
        const newPowerUp = await createPowerUp(supabase, {
          category: formData.category,
          title: formData.title,
          description: formData.description,
          title_es: formData.title_es || null,
          description_es: formData.description_es || null,
          price_doves: parseInt(formData.price_doves),
          sort_order: parseInt(formData.sort_order),
          is_active: formData.is_active,
          created_by: profile?.id
        })

        // Upload image if provided
        if (formData.image_file) {
          setUploadingImage(true)
          const imagePath = await uploadPowerUpImage(supabase, newPowerUp.id, formData.image_file)
          await updatePowerUp(supabase, newPowerUp.id, { image_path: imagePath })
        }

        alert('Power-up created successfully!')
      }

      resetForm()
      fetchPowerUps()
    } catch (error) {
      console.error('Error saving power-up:', error)
      alert('Failed to save power-up: ' + error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEdit = (powerUp) => {
    setEditingPowerUp(powerUp)
    setFormData({
      category: powerUp.category,
      title: powerUp.title,
      description: powerUp.description,
      title_es: powerUp.title_es || '',
      description_es: powerUp.description_es || '',
      price_doves: powerUp.price_doves.toString(),
      sort_order: powerUp.sort_order.toString(),
      is_active: powerUp.is_active,
      image_file: null
    })
    setShowAddForm(true)
  }

  const handleDelete = async (powerUpId) => {
    if (!confirm('Are you sure you want to delete this power-up?')) return

    try {
      await deletePowerUp(supabase, powerUpId)
      alert('Power-up deleted successfully!')
      fetchPowerUps()
    } catch (error) {
      console.error('Error deleting power-up:', error)
      alert('Failed to delete power-up')
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <button onClick={onBack}>Go Back</button>
      </div>
    )
  }

  const descriptionValidation = validateDescription(formData.description)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef7ed, #fed7aa)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            color: '#d2691e',
            fontSize: '2rem',
            fontWeight: '700'
          }}>
            ✨ Manage Power-Ups
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#d2691e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={20} />
                Add Power-Up
              </button>
            )}
            <button
              onClick={onBack}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#d2691e',
                border: '2px solid #d2691e',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Back
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              color: '#d2691e',
              marginBottom: '1.5rem'
            }}>
              {editingPowerUp ? 'Edit Power-Up' : 'Add New Power-Up'}
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Category */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="studios">🎙️ Studios</option>
                  <option value="pros">🎵 Pros</option>
                  <option value="health">🧘 Health</option>
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  Description * (max 250 words)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${descriptionValidation.valid ? '#ddd' : '#dc3545'}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{
                  fontSize: '0.85rem',
                  color: descriptionValidation.valid ? '#666' : '#dc3545',
                  marginTop: '0.25rem'
                }}>
                  {descriptionValidation.wordCount} / 250 words
                </div>
              </div>

              {/* Spanish Translation Section */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#f8f4f0',
                borderRadius: '10px',
                border: '2px solid #d2691e'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    color: '#d2691e',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Languages size={20} />
                    Spanish Translation
                  </h3>
                  <button
                    type="button"
                    onClick={handleAutoTranslate}
                    disabled={translating || (!formData.title && !formData.description)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: translating ? '#ccc' : '#4a90e2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: translating ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {translating ? (
                      <>
                        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Languages size={16} />
                        Auto-Translate
                      </>
                    )}
                  </button>
                </div>

                {/* Spanish Title */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#333'
                  }}>
                    Título (Spanish Title)
                  </label>
                  <input
                    type="text"
                    name="title_es"
                    value={formData.title_es}
                    onChange={handleInputChange}
                    placeholder="Spanish translation of title"
                    maxLength={100}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                {/* Spanish Description */}
                <div>
                  <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#333'
                  }}>
                    Descripción (Spanish Description)
                  </label>
                  <textarea
                    name="description_es"
                    value={formData.description_es}
                    onChange={handleInputChange}
                    placeholder="Spanish translation of description"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  Price (Doves) *
                </label>
                <input
                  type="number"
                  name="price_doves"
                  value={formData.price_doves}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Sort Order */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <div style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginTop: '0.25rem'
                }}>
                  Lower numbers appear first
                </div>
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#333'
                }}>
                  Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                {editingPowerUp?.image_path && !formData.image_file && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img
                      src={getPowerUpImageUrl(supabase, editingPowerUp.image_path)}
                      alt="Current"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '150px',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                )}
                {formData.image_file && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    marginTop: '0.25rem'
                  }}>
                    Selected: {formData.image_file.name}
                  </div>
                )}
              </div>

              {/* Is Active */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span style={{ fontWeight: '600' }}>Active (visible in store)</span>
                </label>
              </div>

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage || !descriptionValidation.valid}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: uploadingImage || !descriptionValidation.valid ? '#ccc' : '#d2691e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: uploadingImage || !descriptionValidation.valid ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Save size={18} />
                  {uploadingImage ? 'Uploading...' : editingPowerUp ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Power-Ups List */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            color: '#d2691e',
            marginBottom: '1.5rem'
          }}>
            All Power-Ups ({powerUps.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Loading...
            </div>
          ) : powerUps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              No power-ups yet. Click "Add Power-Up" to create one.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {powerUps.map(powerUp => (
                <div
                  key={powerUp.id}
                  style={{
                    border: '2px solid #ddd',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    opacity: powerUp.is_active ? 1 : 0.6
                  }}
                >
                  {/* Image */}
                  {powerUp.image_path ? (
                    <img
                      src={getPowerUpImageUrl(supabase, powerUp.image_path)}
                      alt={powerUp.title}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '150px',
                      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #ffecd2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem'
                    }}>
                      ✨
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        {powerUp.title}
                      </h3>
                      <span style={{
                        background: '#d2691e',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        {powerUp.price_doves} 🕊️
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.85rem',
                      color: '#666',
                      marginBottom: '0.5rem'
                    }}>
                      Category: <strong>{powerUp.category}</strong> | Order: {powerUp.sort_order}
                    </div>

                    <p style={{
                      margin: '0 0 1rem 0',
                      fontSize: '0.9rem',
                      color: '#666',
                      lineHeight: '1.4',
                      maxHeight: '3.6em',
                      overflow: 'hidden'
                    }}>
                      {powerUp.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={() => handleEdit(powerUp)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: '#4a90e2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(powerUp.id)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
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

export default AdminPowerUps
