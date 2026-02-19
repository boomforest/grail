import React, { useState, useEffect } from 'react'
import { ArrowLeft, Star, Play, Pause, User, MapPin, Calendar, ChevronDown } from 'lucide-react'

function AdminArtistSubmissions({ profile, supabase, onBack }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [playingTrack, setPlayingTrack] = useState(null)
  const [audioRef, setAudioRef] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isAdmin = isDevelopment ? true : profile?.username === 'JPR333'

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions()
    }
  }, [isAdmin])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ''
      }
    }
  }, [audioRef])

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error fetching artist submissions:', error)
      alert('Failed to load artist submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleRating = async (submissionId, rating) => {
    setUpdatingId(submissionId)
    try {
      const { error } = await supabase
        .from('artist_applications')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', submissionId)

      if (error) throw error

      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, rating } : s)
      )
    } catch (error) {
      console.error('Error updating rating:', error)
      alert('Failed to update rating')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStatusChange = async (submissionId, newStatus) => {
    setUpdatingId(submissionId)
    try {
      const { error } = await supabase
        .from('artist_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', submissionId)

      if (error) throw error

      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, status: newStatus } : s)
      )
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const togglePlayTrack = (trackUrl, submissionId) => {
    if (playingTrack === submissionId) {
      // Stop playing
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ''
      }
      setPlayingTrack(null)
      setAudioRef(null)
    } else {
      // Stop any current playback
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ''
      }
      // Start new track
      const audio = new Audio(trackUrl)
      audio.play().catch(err => console.error('Playback error:', err))
      audio.addEventListener('ended', () => {
        setPlayingTrack(null)
        setAudioRef(null)
      })
      setAudioRef(audio)
      setPlayingTrack(submissionId)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredSubmissions = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter)

  const counts = {
    all: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length
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
          <p style={{ color: '#721c24' }}>You don't have permission to access this page.</p>
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
          }} />
          <span style={{ color: '#8b4513' }}>Loading submissions...</span>
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
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 style={{ fontSize: '1.3rem', color: '#d2691e', margin: 0 }}>
          Artist Submissions
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: filter === tab.key ? '2px solid #d2691e' : '2px solid #ddd',
              background: filter === tab.key ? '#d2691e' : 'white',
              color: filter === tab.key ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.85rem'
            }}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          background: 'white',
          borderRadius: '15px',
          border: '2px solid #d2691e'
        }}>
          <User size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
          <h3 style={{ color: '#8b4513', marginBottom: '0.5rem' }}>No Submissions</h3>
          <p style={{ color: '#666', margin: 0 }}>
            {filter === 'all' ? 'No artist submissions yet.' : `No ${filter} submissions.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredSubmissions.map(submission => (
            <div
              key={submission.id}
              style={{
                background: 'white',
                borderRadius: '15px',
                border: '2px solid rgba(210, 105, 30, 0.3)',
                overflow: 'hidden'
              }}
            >
              {/* Card Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                borderBottom: '1px solid #f0f0f0'
              }}>
                {/* Photo */}
                <div style={{
                  width: '55px',
                  height: '55px',
                  borderRadius: '50%',
                  backgroundColor: '#f5f5dc',
                  backgroundImage: submission.artist_photo_url ? `url(${submission.artist_photo_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '2px solid #d2691e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {!submission.artist_photo_url && <User size={24} color="#d2691e" />}
                </div>

                {/* Name & Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: '0 0 0.25rem',
                    color: '#8b4513',
                    fontSize: '1.05rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {submission.artist_name || 'Unnamed Artist'}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.8rem',
                    color: '#888'
                  }}>
                    {submission.country && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MapPin size={12} />
                        {submission.country}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={12} />
                      {formatDate(submission.created_at)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  flexShrink: 0,
                  backgroundColor: submission.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' :
                    submission.status === 'submitted' ? 'rgba(245, 158, 11, 0.15)' :
                    submission.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' :
                    'rgba(107, 114, 128, 0.15)',
                  color: submission.status === 'approved' ? '#059669' :
                    submission.status === 'submitted' ? '#d97706' :
                    submission.status === 'rejected' ? '#dc2626' :
                    '#6b7280'
                }}>
                  {submission.status}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1rem' }}>
                {/* Audio Player */}
                {submission.track_url && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    backgroundColor: 'rgba(210, 105, 30, 0.06)',
                    borderRadius: '10px',
                    marginBottom: '0.75rem'
                  }}>
                    <button
                      onClick={() => togglePlayTrack(submission.track_url, submission.id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #d2691e, #cd853f)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {playingTrack === submission.id ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <span style={{
                      fontSize: '0.8rem',
                      color: '#8b4513',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {decodeURIComponent(submission.track_url.split('/').pop().split('?')[0])}
                    </span>
                  </div>
                )}

                {/* Star Rating */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#8b4513', fontWeight: '500' }}>
                    Rating:
                  </span>
                  <div style={{ display: 'flex', gap: '0.15rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleRating(submission.id, star)}
                        disabled={updatingId === submission.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: updatingId === submission.id ? 'not-allowed' : 'pointer',
                          padding: '0.15rem',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: updatingId === submission.id ? 0.5 : 1,
                          transition: 'transform 0.15s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.2)' }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        <Star
                          size={22}
                          fill={submission.rating >= star ? '#f59e0b' : 'none'}
                          color={submission.rating >= star ? '#f59e0b' : '#ccc'}
                        />
                      </button>
                    ))}
                  </div>
                  {submission.rating && (
                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600' }}>
                      {submission.rating}/5
                    </span>
                  )}
                </div>

                {/* Status Actions */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {submission.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(submission.id, 'approved')}
                      disabled={updatingId === submission.id}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#059669',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: updatingId === submission.id ? 'not-allowed' : 'pointer',
                        opacity: updatingId === submission.id ? 0.6 : 1
                      }}
                    >
                      Approve
                    </button>
                  )}
                  {submission.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(submission.id, 'rejected')}
                      disabled={updatingId === submission.id}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#dc2626',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: updatingId === submission.id ? 'not-allowed' : 'pointer',
                        opacity: updatingId === submission.id ? 0.6 : 1
                      }}
                    >
                      Reject
                    </button>
                  )}
                  {submission.status !== 'submitted' && (
                    <button
                      onClick={() => handleStatusChange(submission.id, 'submitted')}
                      disabled={updatingId === submission.id}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid #d97706',
                        background: 'white',
                        color: '#d97706',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: updatingId === submission.id ? 'not-allowed' : 'pointer',
                        opacity: updatingId === submission.id ? 0.6 : 1
                      }}
                    >
                      Reset to Submitted
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default AdminArtistSubmissions
