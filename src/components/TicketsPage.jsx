import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, Ticket, ArrowLeft, Users } from 'lucide-react'

function TicketsPage({ 
  user, 
  profile, 
  supabase, 
  onBack,
  isAdmin,
  onProfileUpdate 
}) {
  const [availableTickets, setAvailableTickets] = useState([])
  const [userTickets, setUserTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available') // 'available' or 'my-tickets'
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [showTearModal, setShowTearModal] = useState(null) // For ticket tearing modal

  useEffect(() => {
    if (user && supabase) {
      loadTickets()
    }
  }, [user, supabase])

  const loadTickets = async () => {
    try {
      // Load available event tickets
      const { data: events, error: eventsError } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })

      if (eventsError) throw eventsError
      setAvailableTickets(events || [])

      // Load user's purchased tickets
      const { data: purchased, error: purchasedError } = await supabase
        .from('user_tickets')
        .select(`
          *,
          event_tickets (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (purchasedError) throw purchasedError
      setUserTickets(purchased || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseTicket = async (ticket) => {
    if (!profile || !ticket) return

    // Check if user has enough Palomas
    if ((profile.total_palomas_collected || 0) < ticket.price_palomas) {
      setPurchaseMessage('Not enough Palomas!')
      setTimeout(() => setPurchaseMessage(''), 3000)
      return
    }

    try {
      // Deduct Palomas from user
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_palomas_collected: (profile.total_palomas_collected || 0) - ticket.price_palomas
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Generate ticket code
      const ticketCode = `CASA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      // Create user ticket
      const { error: ticketError } = await supabase
        .from('user_tickets')
        .insert([{
          user_id: user.id,
          event_id: ticket.id,
          ticket_code: ticketCode,
          purchase_price: ticket.price_palomas,
          status: 'valid'
        }])

      if (ticketError) throw ticketError

      // Update available tickets count
      const { error: countError } = await supabase
        .from('event_tickets')
        .update({
          tickets_sold: (ticket.tickets_sold || 0) + 1
        })
        .eq('id', ticket.id)

      if (countError) throw countError

      // Handle partner payout if specified
      if (ticket.partner_username && ticket.partner_palomas_per_ticket) {
        try {
          // Find partner by username
          const { data: partner, error: partnerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', ticket.partner_username.toUpperCase())
            .single()

          if (!partnerError && partner) {
            // Credit partner with palomas
            const { error: partnerUpdateError } = await supabase
              .from('profiles')
              .update({
                total_palomas_collected: (partner.total_palomas_collected || 0) + ticket.partner_palomas_per_ticket
              })
              .eq('id', partner.id)

            if (partnerUpdateError) {
              console.error('Partner payout failed:', partnerUpdateError)
            } else {
              console.log(`Paid ${ticket.partner_palomas_per_ticket} Palomas to partner ${ticket.partner_username}`)
            }
          } else {
            console.warn(`Partner ${ticket.partner_username} not found`)
          }
        } catch (partnerError) {
          console.error('Partner payout error:', partnerError)
          // Don't fail the whole purchase if partner payout fails
        }
      }

      // Refresh data
      await loadTickets()
      
      // Update profile
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          total_palomas_collected: (profile.total_palomas_collected || 0) - ticket.price_palomas
        })
      }

      setPurchaseMessage('Ticket purchased successfully!')
      setActiveTab('my-tickets')
      setTimeout(() => setPurchaseMessage(''), 3000)
    } catch (error) {
      console.error('Error purchasing ticket:', error)
      setPurchaseMessage('Purchase failed. Please try again.')
      setTimeout(() => setPurchaseMessage(''), 3000)
    }
  }

  const handleTearTicket = async (userTicket) => {
    if (!userTicket || userTicket.status !== 'valid') return

    try {
      // Mark ticket as used
      const { error: updateError } = await supabase
        .from('user_tickets')
        .update({ status: 'used' })
        .eq('id', userTicket.id)

      if (updateError) throw updateError

      // Increment torn tickets count for the event
      const { error: countError } = await supabase
        .from('event_tickets')
        .update({
          tickets_torn: (userTicket.event_tickets.tickets_torn || 0) + 1
        })
        .eq('id', userTicket.event_id)

      if (countError) {
        console.warn('Failed to update torn tickets count:', countError)
        // Don't fail the whole operation if count update fails
      }

      // Refresh tickets
      await loadTickets()
      
      setPurchaseMessage('Ticket torn successfully!')
      setTimeout(() => setPurchaseMessage(''), 3000)
      
      // Keep modal open but update the data
      // Find the updated ticket data
      const updatedTickets = await supabase
        .from('user_tickets')
        .select(`
          *,
          event_tickets (*)
        `)
        .eq('id', userTicket.id)
        .single()
        
      if (updatedTickets.data) {
        setShowTearModal(updatedTickets.data)
      }
    } catch (error) {
      console.error('Error tearing ticket:', error)
      setPurchaseMessage('Failed to tear ticket. Please try again.')
      setTimeout(() => setPurchaseMessage(''), 3000)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
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
      <div style={{
        maxWidth: '600px',
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          
          <h1 style={{
            fontSize: '2rem',
            color: '#d2691e',
            margin: 0,
            fontWeight: 'normal'
          }}>
            🎫 Tickets
          </h1>
          
          <div style={{ width: '80px' }} />
        </div>

        {/* Purchase Message */}
        {purchaseMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: purchaseMessage.includes('success') ? '#d4edda' : '#f8d7da',
            color: purchaseMessage.includes('success') ? '#155724' : '#721c24',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            {purchaseMessage}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setActiveTab('available')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'available' 
                ? 'linear-gradient(45deg, #d2691e, #cd853f)' 
                : 'rgba(255, 255, 255, 0.9)',
              color: activeTab === 'available' ? 'white' : '#8b4513',
              border: '2px solid #d2691e',
              borderRadius: '15px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            Available Events
          </button>
          <button
            onClick={() => setActiveTab('my-tickets')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'my-tickets' 
                ? 'linear-gradient(45deg, #d2691e, #cd853f)' 
                : 'rgba(255, 255, 255, 0.9)',
              color: activeTab === 'my-tickets' ? 'white' : '#8b4513',
              border: '2px solid #d2691e',
              borderRadius: '15px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            My Tickets
            {userTickets.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#dc3545',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {userTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'available' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {availableTickets.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '20px',
                border: '2px solid #d2691e'
              }}>
                <Ticket size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
                <h3 style={{ color: '#8b4513', marginBottom: '0.5rem' }}>No Events Available</h3>
                <p style={{ color: '#666', margin: 0 }}>
                  Check back soon for upcoming events!
                </p>
              </div>
            ) : (
              availableTickets.map(ticket => {
                const soldOut = ticket.max_tickets && ticket.tickets_sold >= ticket.max_tickets
                const remainingTickets = ticket.max_tickets ? ticket.max_tickets - ticket.tickets_sold : null

                return (
                  <div
                    key={ticket.id}
                    style={{
                      background: 'white',
                      borderRadius: '20px',
                      padding: '1.5rem',
                      border: '2px solid #d2691e',
                      boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)',
                      opacity: soldOut ? 0.7 : 1
                    }}
                  >
                    {/* Event Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{
                          margin: '0 0 0.5rem',
                          color: '#8b4513',
                          fontSize: '1.3rem'
                        }}>
                          {ticket.event_name}
                        </h3>
                        {ticket.description && (
                          <p style={{
                            margin: '0 0 0.5rem',
                            color: '#666',
                            fontSize: '0.9rem'
                          }}>
                            {ticket.description}
                          </p>
                        )}
                      </div>
                      {ticket.event_image && (
                        <img
                          src={ticket.event_image}
                          alt={ticket.event_name}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '10px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                    </div>

                    {/* Event Details */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} />
                        {formatDate(ticket.event_date)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} />
                        {formatTime(ticket.event_date)}
                      </div>
                      {ticket.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={16} />
                          {ticket.location}
                        </div>
                      )}
                      {remainingTickets !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={16} />
                          {remainingTickets} tickets remaining
                        </div>
                      )}
                    </div>

                    {/* Price and Purchase */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '1rem',
                      borderTop: '1px solid #eee'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: '#d2691e'
                        }}>
                          🕊️ {ticket.price_palomas}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#666'
                        }}>
                          Palomas
                        </div>
                      </div>
                      
                      {soldOut ? (
                        <div style={{
                          padding: '0.75rem 1.5rem',
                          background: '#6c757d',
                          color: 'white',
                          borderRadius: '10px',
                          fontWeight: '500'
                        }}>
                          Sold Out
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePurchaseTicket(ticket)}
                          disabled={(profile?.total_palomas_collected || 0) < ticket.price_palomas}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: (profile?.total_palomas_collected || 0) >= ticket.price_palomas
                              ? 'linear-gradient(45deg, #28a745, #20c997)'
                              : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: (profile?.total_palomas_collected || 0) >= ticket.price_palomas
                              ? 'pointer'
                              : 'not-allowed',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            if ((profile?.total_palomas_collected || 0) >= ticket.price_palomas) {
                              e.target.style.transform = 'translateY(-2px)'
                              e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)'
                            }
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = 'none'
                          }}
                        >
                          {(profile?.total_palomas_collected || 0) < ticket.price_palomas
                            ? 'Not Enough'
                            : 'Purchase'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          // My Tickets Tab
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {userTickets.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '20px',
                border: '2px solid #d2691e'
              }}>
                <Ticket size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
                <h3 style={{ color: '#8b4513', marginBottom: '0.5rem' }}>No Tickets Yet</h3>
                <p style={{ color: '#666', margin: 0 }}>
                  Purchase tickets from available events
                </p>
              </div>
            ) : (
              userTickets.map((userTicket, index) => (
                <div
                  key={userTicket.id}
                  style={{
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '2px solid #d2691e',
                    boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)',
                    backgroundImage: userTicket.event_tickets.event_image 
                      ? `url(${userTicket.event_tickets.event_image})`
                      : 'linear-gradient(135deg, #fff, #fef7ed)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '300px'
                  }}
                >
                  {/* Dark overlay for readability */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5))',
                    zIndex: 1
                  }} />
                  
                  {/* Ripped ticket counter for used tickets */}
                  {userTicket.status === 'used' && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid #dc3545',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                      zIndex: 3
                    }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#dc3545',
                        lineHeight: 1
                      }}>
                        {index + 1}
                      </div>
                      <div style={{
                        fontSize: '0.6rem',
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        RIPPED
                      </div>
                    </div>
                  )}
                  
                  {/* Content overlay */}
                  <div style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '1.5rem',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '300px'
                  }}>
                    {/* Ticket Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                      }}>
                        {userTicket.event_tickets.event_name}
                      </h3>
                      {userTicket.status === 'valid' && (
                        <div style={{
                          background: '#28a745',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                          Valid
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      marginBottom: 'auto',
                      fontSize: '0.95rem',
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} />
                        {formatDate(userTicket.event_tickets.event_date)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={18} />
                        {formatTime(userTicket.event_tickets.event_date)}
                      </div>
                      {userTicket.event_tickets.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={18} />
                          {userTicket.event_tickets.location}
                        </div>
                      )}
                    </div>

                    {/* Tear Ticket Button */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '10px',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '2px dashed #d2691e',
                      marginTop: '1rem'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666',
                        marginBottom: '0.5rem'
                      }}>
                        Venue Use Only
                      </div>
                      {userTicket.status === 'valid' ? (
                      <button
                        onClick={() => setShowTearModal(userTicket)}
                        style={{
                          background: 'linear-gradient(45deg, #dc3545, #c82333)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 1.5rem',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)'
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)'
                        }}
                      >
                        🎟️ Tear Ticket
                      </button>
                      ) : (
                        // Show torn status
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{
                            background: '#dc3545',
                            color: 'white',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            ✂️ TICKET TORN
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tear Ticket Modal */}
        {showTearModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center',
              position: 'relative'
            }}>
              {/* Close button */}
              <button
                onClick={() => setShowTearModal(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>

              {/* Event Image */}
              {showTearModal.event_tickets.event_image ? (
                <img
                  src={showTearModal.event_tickets.event_image}
                  alt={showTearModal.event_tickets.event_name}
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    height: 'auto',
                    borderRadius: '15px',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                  }}
                />
              ) : (
                <div style={{
                  width: '300px',
                  height: '200px',
                  background: 'linear-gradient(135deg, #fef7ed, #fed7aa)',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                }}>
                  <div style={{ fontSize: '4rem' }}>🎫</div>
                </div>
              )}

              {/* Event Info */}
              <h3 style={{
                margin: '0 0 1rem',
                color: '#8b4513',
                fontSize: '1.5rem'
              }}>
                {showTearModal.event_tickets.event_name}
              </h3>

              {/* Torn Counter */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '0.5rem'
                }}>
                  Tickets Torn
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#dc3545'
                }}>
                  {showTearModal.event_tickets.tickets_torn || 0}
                </div>
              </div>

              {/* Confirm Tear Button or Close Button */}
              {showTearModal.status === 'valid' ? (
                <button
                  onClick={() => handleTearTicket(showTearModal)}
                  style={{
                    background: 'linear-gradient(45deg, #dc3545, #c82333)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
                    width: '100%'
                  }}
                >
                  ✂️ Confirm Tear Ticket
                </button>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: '#28a745',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    width: '100%'
                  }}>
                    ✅ TICKET TORN
                  </div>
                  <button
                    onClick={() => setShowTearModal(null)}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
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

export default TicketsPage