import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Calendar, MapPin, Ticket } from 'lucide-react'

function AdminTicketManager({ profile, supabase, onBack }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    event_name: '',
    description: '',
    event_date: '',
    location: '',
    price_palomas: '',
    max_tickets: '',
    event_image: '',
    is_active: true,
    partner_username: '',
    partner_palomas_per_ticket: '',
    image_file: null,
  })

  // Check if user is admin (allow all users on localhost for development)
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isAdmin = isDevelopment ? true : profile?.username === 'JPR333'

  useEffect(() => {
    if (isAdmin) {
      fetchTickets()
    }
  }, [isAdmin])

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .order('event_date', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    switch (name) {
      case ('event_date'):
        const utcDate = new Date(value)
        const localDateString = utcDate.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM format
        console.log(localDateString)
        setFormData(prev => ({
          ...prev,
          [name]: localDateString
        }))
      default:
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB')
        return
      }

      setFormData(prev => ({
        ...prev,
        image_file: file
      }))
    }
  }

  const uploadImage = async (file) => {
    if (!file) {
      console.log('No file provided')
      return null
    }

    console.log('Starting upload for file:', file.name, 'Size:', file.size)
    setUploadingImage(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `ticket-${Date.now()}.${fileExt}`
      const filePath = fileName // Remove folder prefix for now

      console.log('Uploading to path:', filePath)

      const { data, error: uploadError } = await supabase.storage
        .from('ticket-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', data)

      const { data: { publicUrl } } = supabase.storage
        .from('ticket-images')
        .getPublicUrl(filePath)

      console.log('Public URL:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(`Failed to upload image: ${error.message}`)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.event_name.trim() || !formData.event_date || !formData.price_palomas) {
      alert('Please fill in all required fields')
      return
    }

    try {
      let imageUrl = formData.event_image

      // Upload new image if file is selected
      if (formData.image_file) {
        imageUrl = await uploadImage(formData.image_file)
        if (!imageUrl) return // Upload failed
      }

      // Add Mexico City timezone offset to the datetime
      // Mexico City is UTC-6 (or UTC-5 during DST)
      const eventDateWithTimezone = formData.event_date + '-06:00'
      
      const ticketData = {
        event_name: formData.event_name.trim(),
        description: formData.description ? formData.description.trim() : null,
        event_date: eventDateWithTimezone, // Store with Mexico City timezone offset
        location: formData.location ? formData.location.trim() : null,
        price_palomas: parseInt(formData.price_palomas),
        max_tickets: formData.max_tickets ? parseInt(formData.max_tickets) : null,
        event_image: imageUrl || null,
        is_active: formData.is_active,
        tickets_sold: editingTicket ? editingTicket.tickets_sold : 0,
        partner_username: formData.partner_username ? formData.partner_username.trim().toUpperCase() : null,
        partner_palomas_per_ticket: formData.partner_palomas_per_ticket ? parseInt(formData.partner_palomas_per_ticket) : null
      }

      if (editingTicket) {
        const { error } = await supabase
          .from('event_tickets')
          .update(ticketData)
          .eq('id', editingTicket.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('event_tickets')
          .insert([ticketData])

        if (error) throw error
      }

      resetForm()
      fetchTickets()
    } catch (error) {
      console.error('Error saving ticket:', error)
      alert('Failed to save ticket')
    }
  }

  const handleEdit = (ticket) => {
    setEditingTicket(ticket)
    setFormData({
      event_name: ticket.event_name,
      description: ticket.description || '',
      event_date: ticket.event_date, // Simple: just show stored time
      location: ticket.location || '',
      price_palomas: ticket.price_palomas.toString(),
      max_tickets: ticket.max_tickets ? ticket.max_tickets.toString() : '',
      event_image: ticket.event_image || '',
      is_active: ticket.is_active,
      partner_username: ticket.partner_username || '',
      partner_palomas_per_ticket: ticket.partner_palomas_per_ticket ? ticket.partner_palomas_per_ticket.toString() : '',
      image_file: null
    })
    setShowAddForm(true)
  }

  const handleDelete = async (ticketId) => {
    if (!confirm('Are you sure you want to delete this event? This will also delete all purchased tickets for this event.')) return

    try {
      // First delete all user tickets for this event
      await supabase
        .from('user_tickets')
        .delete()
        .eq('event_id', ticketId)

      // Then delete the event ticket
      const { error } = await supabase
        .from('event_tickets')
        .delete()
        .eq('id', ticketId)

      if (error) throw error

      fetchTickets()
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Failed to delete ticket')
    }
  }

  const resetForm = () => {
    setFormData({
      event_name: '',
      description: '',
      event_date: '',
      location: '',
      price_palomas: '',
      max_tickets: '',
      event_image: '',
      is_active: true,
      partner_username: '',
      partner_palomas_per_ticket: '',
      image_file: null
    })
    setEditingTicket(null)
    setShowAddForm(false)
  }

  const formatDate = (dateString) => {
    // Simple: just format the date as Mexico City time
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Mexico_City'
    })
  }

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
          <p style={{ color: '#721c24' }}>You don't have permission to manage tickets.</p>
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
    )
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
          <span>Loading tickets...</span>
        </div>
      </div>
    )
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
        <h1 style={{ fontSize: '1.5rem', color: '#d2691e', margin: 0 }}>Ticket Management</h1>
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
          Add Event
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
              {editingTicket ? 'Edit Event' : 'Add New Event'}
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
                Event Name *
              </label>
              <input
                type="text"
                name="event_name"
                value={formData.event_name}
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
                Event Date & Time *
              </label>
              <input
                type="datetime-local"
                name="event_date"
                value={formData.event_date}
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
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                placeholder="Casa de Copas"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Price (Palomas) *
              </label>
              <input
                type="number"
                name="price_palomas"
                value={formData.price_palomas}
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
                Max Tickets (optional)
              </label>
              <input
                type="number"
                name="max_tickets"
                value={formData.max_tickets}
                onChange={handleInputChange}
                min="1"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Event Image (for ticket verification)
              </label>

              {/* Image Upload */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}
              />
              <p style={{ fontSize: '0.7rem', color: '#666', margin: '0 0 1rem 0' }}>
                Upload an image (max 5MB, JPG/PNG) that will be shown to venue staff for ticket verification
              </p>

              {/* OR divider */}
              <div style={{
                textAlign: 'center',
                margin: '1rem 0',
                position: 'relative',
                color: '#666',
                fontSize: '0.8rem'
              }}>
                <span style={{
                  background: 'white',
                  padding: '0 1rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  OR use image URL
                </span>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: '#ddd',
                  zIndex: 0
                }}></div>
              </div>

              {/* Image URL */}
              <input
                type="url"
                name="event_image"
                value={formData.event_image}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                placeholder="https://example.com/image.jpg"
                disabled={!!formData.image_file}
              />
              {formData.image_file && (
                <p style={{ fontSize: '0.7rem', color: '#28a745', margin: '0.25rem 0 0 0' }}>
                  ✓ File selected: {formData.image_file.name}
                </p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Partner Username (optional)
              </label>
              <input
                type="text"
                name="partner_username"
                value={formData.partner_username}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                placeholder="PARTNER123"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Partner Palomas per Ticket (optional)
              </label>
              <input
                type="number"
                name="partner_palomas_per_ticket"
                value={formData.partner_palomas_per_ticket}
                onChange={handleInputChange}
                min="0"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
                placeholder="5"
              />
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
                placeholder="Event description..."
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                id="is_active"
              />
              <label htmlFor="is_active" style={{ fontWeight: '500' }}>
                Active (visible to users)
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSubmit}
                disabled={uploadingImage}
                style={{
                  background: uploadingImage ? '#6c757d' : '#28a745',
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
                    {editingTicket ? 'Update Event' : 'Add Event'}
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

      {/* Events List */}
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
            Current Events ({tickets.length})
          </h3>
        </div>

        {tickets.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Ticket size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
            <p style={{ color: '#666', marginBottom: '1rem' }}>No events created yet.</p>
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
              Create Your First Event
            </button>
          </div>
        ) : (
          <div>
            {tickets.map((ticket, index) => (
              <div
                key={ticket.id}
                style={{
                  padding: '1rem',
                  borderBottom: index < tickets.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {ticket.event_image && (
                    <img
                      src={ticket.event_image}
                      alt={ticket.event_name}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#333' }}>
                      {ticket.event_name}
                      {!ticket.is_active && (
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.2rem 0.5rem',
                          background: '#ffc107',
                          color: '#000',
                          borderRadius: '5px',
                          fontSize: '0.7rem'
                        }}>
                          Inactive
                        </span>
                      )}
                    </h4>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: '#666' }}>
                      <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                      {formatDate(ticket.event_date)}
                      {ticket.location && (
                        <>
                          <MapPin size={14} style={{ display: 'inline', marginLeft: '0.5rem', marginRight: '0.25rem' }} />
                          {ticket.location}
                        </>
                      )}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500', color: '#28a745' }}>
                      {ticket.price_palomas} Palomas •
                      {ticket.tickets_sold || 0}/{ticket.max_tickets || '∞'} sold
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(ticket)}
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
                    title="Edit event"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(ticket.id)}
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
                    title="Delete event"
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
  )
}

export default AdminTicketManager