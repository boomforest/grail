import React, { useState, useEffect } from 'react'
import { X, Upload, Check, MessageCircle, Clock, AlertCircle } from 'lucide-react'

function EggsInFlight({ profile, supabase, onClose, onSuccess }) {
  const [eggsAsRecipient, setEggsAsRecipient] = useState([])
  const [eggsAsSender, setEggsAsSender] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('received') // 'received' or 'sent'
  const [selectedEgg, setSelectedEgg] = useState(null)
  const [workUrl, setWorkUrl] = useState('')
  const [disputeNotes, setDisputeNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get background image
  const getBackgroundImage = () => {
    if (!supabase) return null
    const isMobile = window.innerWidth <= 768
    const filename = isMobile ? 'backgroundmobile.png' : 'backgrounddesktop.png'
    const { data: { publicUrl } } = supabase.storage
      .from('tarot-cards')
      .getPublicUrl(filename)
    return publicUrl
  }

  const backgroundUrl = getBackgroundImage()

  useEffect(() => {
    if (profile && supabase) {
      loadEggs()
    }
  }, [profile, supabase])

  const loadEggs = async () => {
    setLoading(true)
    try {
      // Get eggs where user is recipient
      const { data: asRecipient, error: recipientError } = await supabase
        .from('eggs_transactions')
        .select(`
          *,
          sender:profiles!eggs_transactions_sender_id_fkey(username, profile_picture_url)
        `)
        .eq('recipient_id', profile.id)
        .in('status', ['pending', 'work_uploaded', 'disputed'])
        .order('created_at', { ascending: false })

      if (recipientError) console.error('Error fetching recipient eggs:', recipientError)

      // Get eggs where user is sender
      const { data: asSender, error: senderError } = await supabase
        .from('eggs_transactions')
        .select(`
          *,
          recipient:profiles!eggs_transactions_recipient_id_fkey(username, profile_picture_url)
        `)
        .eq('sender_id', profile.id)
        .in('status', ['pending', 'work_uploaded', 'disputed'])
        .order('created_at', { ascending: false })

      if (senderError) console.error('Error fetching sender eggs:', senderError)

      setEggsAsRecipient(asRecipient || [])
      setEggsAsSender(asSender || [])
    } catch (error) {
      console.error('Error loading eggs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadWork = async (eggId) => {
    if (!workUrl.trim()) {
      alert('Please enter a URL for your completed work')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('eggs_transactions')
        .update({
          status: 'work_uploaded',
          work_delivery_url: workUrl,
          work_uploaded_at: new Date().toISOString()
        })
        .eq('id', eggId)

      if (error) throw error

      onSuccess('Work uploaded! Waiting for sender approval.')
      setSelectedEgg(null)
      setWorkUrl('')
      await loadEggs()
    } catch (error) {
      console.error('Error uploading work:', error)
      alert('Failed to upload work: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (egg) => {
    setIsSubmitting(true)
    try {
      // Release pending Palomas to recipient
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)

      await supabase
        .from('paloma_transactions')
        .insert([{
          user_id: egg.recipient_id,
          amount: egg.pending_amount,
          transaction_type: 'received',
          source: `eggs_approved_from_${egg.sender?.username || 'sender'}`,
          received_at: new Date().toISOString(),
          expires_at: expirationDate.toISOString(),
          metadata: {
            egg_transaction_id: egg.id,
            sender_id: egg.sender_id,
            work_description: egg.work_description
          }
        }])

      // Update recipient's balance
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('dov_balance, eggs_pending_received')
        .eq('id', egg.recipient_id)
        .single()

      await supabase
        .from('profiles')
        .update({
          dov_balance: (recipientProfile.dov_balance || 0) + egg.pending_amount,
          eggs_pending_received: Math.max(0, (recipientProfile.eggs_pending_received || 0) - egg.pending_amount)
        })
        .eq('id', egg.recipient_id)

      // Update sender's pending sent
      await supabase
        .from('profiles')
        .update({
          eggs_pending_sent: Math.max(0, (profile.eggs_pending_sent || 0) - egg.pending_amount)
        })
        .eq('id', profile.id)

      // Mark egg as approved
      await supabase
        .from('eggs_transactions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          resolved_at: new Date().toISOString()
        })
        .eq('id', egg.id)

      onSuccess(`Approved! ${egg.pending_amount} Palomas released to ${egg.recipient?.username}`)
      setSelectedEgg(null)
      await loadEggs()
    } catch (error) {
      console.error('Error approving work:', error)
      alert('Failed to approve: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDispute = async (eggId) => {
    if (!disputeNotes.trim()) {
      alert('Please describe the issue')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('eggs_transactions')
        .update({
          status: 'disputed',
          dispute_opened_at: new Date().toISOString(),
          dispute_notes: disputeNotes
        })
        .eq('id', eggId)

      if (error) throw error

      onSuccess('Dispute opened. Casa de Copas will facilitate resolution.')
      setSelectedEgg(null)
      setDisputeNotes('')
      await loadEggs()
    } catch (error) {
      console.error('Error opening dispute:', error)
      alert('Failed to open dispute: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDaysRemaining = (expectedDate) => {
    const now = new Date()
    const expected = new Date(expectedDate)
    const diffTime = expected - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const renderEggCard = (egg, isRecipient) => {
    const daysRemaining = getDaysRemaining(egg.expected_delivery_date)
    const isOverdue = daysRemaining < 0
    const otherParty = isRecipient ? egg.sender : egg.recipient

    return (
      <div
        key={egg.id}
        onClick={() => setSelectedEgg(egg)}
        style={{
          background: 'white',
          borderRadius: '15px',
          padding: '1.25rem',
          marginBottom: '1rem',
          cursor: 'pointer',
          border: '2px solid',
          borderColor: egg.status === 'disputed' ? '#f44336' : egg.status === 'work_uploaded' ? '#ff9800' : '#e0e0e0',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#777', marginBottom: '0.25rem' }}>
              {isRecipient ? 'From' : 'To'}: <strong>{otherParty?.username || 'Unknown'}</strong>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#2c3e50' }}>
              {egg.total_amount} Palomas 🥚
            </div>
          </div>
          <div style={{
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: egg.status === 'disputed' ? '#ffebee' : egg.status === 'work_uploaded' ? '#fff3e0' : '#e3f2fd',
            color: egg.status === 'disputed' ? '#c62828' : egg.status === 'work_uploaded' ? '#f57c00' : '#1976d2'
          }}>
            {egg.status === 'work_uploaded' ? 'Work Uploaded' : egg.status === 'disputed' ? 'Disputed' : 'Pending'}
          </div>
        </div>

        <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.75rem', lineHeight: '1.4' }}>
          {egg.work_description}
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#777' }}>
          <div>
            ✅ {egg.hatched_amount} hatched
          </div>
          <div>
            ⏳ {egg.pending_amount} pending
          </div>
        </div>

        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: isOverdue ? '#f44336' : '#777'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {isOverdue ? <AlertCircle size={14} /> : <Clock size={14} />}
            {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
          </div>
          <div>{formatDate(egg.created_at)}</div>
        </div>
      </div>
    )
  }

  const renderDetailModal = () => {
    if (!selectedEgg) return null

    const isRecipient = selectedEgg.recipient_id === profile.id
    const otherParty = isRecipient ? selectedEgg.sender : selectedEgg.recipient

    return (
      <div
        onClick={() => {
          setSelectedEgg(null)
          setWorkUrl('')
          setDisputeNotes('')
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '2rem'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2c3e50' }}>
              Egg Details
            </h3>
            <button
              onClick={() => setSelectedEgg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="#7f8c8d" />
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#777', marginBottom: '0.5rem' }}>
              {isRecipient ? 'From' : 'To'}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
              {otherParty?.username || 'Unknown'}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#777', marginBottom: '0.5rem' }}>
              Work Description
            </div>
            <div style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.5' }}>
              {selectedEgg.work_description}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '10px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#777', marginBottom: '0.25rem' }}>Hatched</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#4caf50' }}>
                {selectedEgg.hatched_amount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#777', marginBottom: '0.25rem' }}>Pending</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ff9800' }}>
                {selectedEgg.pending_amount}
              </div>
            </div>
          </div>

          {/* Recipient View - Upload Work */}
          {isRecipient && selectedEgg.status === 'pending' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#555', marginBottom: '0.75rem' }}>
                Upload Completed Work
              </div>
              <input
                type="text"
                value={workUrl}
                onChange={(e) => setWorkUrl(e.target.value)}
                placeholder="https://... (Dropbox, Drive, etc.)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  marginBottom: '1rem'
                }}
              />
              <button
                onClick={() => handleUploadWork(selectedEgg.id)}
                disabled={isSubmitting || !workUrl.trim()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: isSubmitting || !workUrl.trim() ? '#ccc' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isSubmitting || !workUrl.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Uploading...' : 'Submit Work'}
              </button>
            </div>
          )}

          {/* Work Already Uploaded */}
          {selectedEgg.work_delivery_url && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#777', marginBottom: '0.5rem' }}>
                Delivered Work
              </div>
              <a
                href={selectedEgg.work_delivery_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  background: '#e3f2fd',
                  color: '#1976d2',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all'
                }}
              >
                {selectedEgg.work_delivery_url}
              </a>
            </div>
          )}

          {/* Sender View - Approve or Dispute */}
          {!isRecipient && selectedEgg.status === 'work_uploaded' && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => handleApprove(selectedEgg)}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: isSubmitting ? '#ccc' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Check size={18} />
                  Approve
                </button>
                <button
                  onClick={() => {/* Show dispute form */}}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'white',
                    color: '#f44336',
                    border: '2px solid #f44336',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <MessageCircle size={18} />
                  Dispute
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#777', fontStyle: 'italic', textAlign: 'center' }}>
                Approving releases {selectedEgg.pending_amount} Palomas to {otherParty?.username}
              </p>
            </div>
          )}

          {/* Dispute Status */}
          {selectedEgg.status === 'disputed' && (
            <div style={{
              padding: '1rem',
              background: '#ffebee',
              borderRadius: '10px',
              border: '2px solid #f44336'
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#c62828', marginBottom: '0.5rem' }}>
                Dispute Opened
              </div>
              <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5' }}>
                {selectedEgg.dispute_notes || 'Casa de Copas will facilitate resolution.'}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: backgroundUrl ? `url(${backgroundUrl})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>
            🥚 Eggs in Flight
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem'
          }}>
            <X size={24} color="#7f8c8d" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('received')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'received' ? '#ff9800' : 'white',
              color: activeTab === 'received' ? 'white' : '#777',
              border: '2px solid',
              borderColor: activeTab === 'received' ? '#ff9800' : '#ddd',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Received ({eggsAsRecipient.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'sent' ? '#2196f3' : 'white',
              color: activeTab === 'sent' ? 'white' : '#777',
              border: '2px solid',
              borderColor: activeTab === 'sent' ? '#2196f3' : '#ddd',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sent ({eggsAsSender.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
            Loading...
          </div>
        ) : activeTab === 'received' ? (
          eggsAsRecipient.length > 0 ? (
            eggsAsRecipient.map(egg => renderEggCard(egg, true))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
              No eggs received yet
            </div>
          )
        ) : (
          eggsAsSender.length > 0 ? (
            eggsAsSender.map(egg => renderEggCard(egg, false))
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
              No eggs sent yet
            </div>
          )
        )}
      </div>

      {renderDetailModal()}
    </div>
  )
}

export default EggsInFlight
