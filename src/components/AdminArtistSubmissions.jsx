import React, { useState, useEffect } from 'react'
import { ArrowLeft, Star, Play, Pause, User, MapPin, Calendar, ChevronDown, Trophy, Plus, X } from 'lucide-react'

function AdminArtistSubmissions({ profile, supabase, onBack, onNotificationsRead }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [playingTrack, setPlayingTrack] = useState(null)
  const [audioRef, setAudioRef] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  // Competition state
  const [competitions, setCompetitions] = useState([])
  const [activeCompetition, setActiveCompetition] = useState(null)
  const [showCreateComp, setShowCreateComp] = useState(false)
  const [newCompTitle, setNewCompTitle] = useState('')
  const [newCompDesc, setNewCompDesc] = useState('')
  const [creatingComp, setCreatingComp] = useState(false)

  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isAdmin = isDevelopment ? true : profile?.username === 'JPR333'

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions()
      fetchCompetitions()
      markNotificationsRead()
    }
  }, [isAdmin])

  const markNotificationsRead = async () => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false)
      if (onNotificationsRead) onNotificationsRead()
    } catch (err) {
      console.warn('Could not mark notifications as read:', err)
    }
  }

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

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompetitions(data || [])
      // Set active competition (most recent non-closed)
      const active = (data || []).find(c => c.status !== 'closed')
      setActiveCompetition(active || null)
    } catch (error) {
      console.error('Error fetching competitions:', error)
    }
  }

  const createCompetition = async () => {
    if (!newCompTitle.trim()) return
    setCreatingComp(true)
    try {
      const { data, error } = await supabase
        .from('competitions')
        .insert([{
          title: newCompTitle.trim(),
          description: newCompDesc.trim() || null,
          status: 'open'
        }])
        .select()
        .single()

      if (error) throw error
      setCompetitions(prev => [data, ...prev])
      setActiveCompetition(data)
      setNewCompTitle('')
      setNewCompDesc('')
      setShowCreateComp(false)
    } catch (error) {
      console.error('Error creating competition:', error)
      alert('Failed to create competition')
    } finally {
      setCreatingComp(false)
    }
  }

  const updateCompetitionStatus = async (compId, newStatus) => {
    try {
      const { error } = await supabase
        .from('competitions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', compId)

      if (error) throw error
      setCompetitions(prev =>
        prev.map(c => c.id === compId ? { ...c, status: newStatus } : c)
      )
      if (activeCompetition?.id === compId) {
        setActiveCompetition(prev => ({ ...prev, status: newStatus }))
      }
    } catch (error) {
      console.error('Error updating competition:', error)
      alert('Failed to update competition status')
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

  const toggleFinalist = async (submissionId, currentIsFinalist) => {
    if (!activeCompetition) {
      alert('Create a competition first before selecting finalists')
      return
    }
    setUpdatingId(submissionId)
    try {
      const updates = {
        is_finalist: !currentIsFinalist,
        competition_id: !currentIsFinalist ? activeCompetition.id : null,
        updated_at: new Date().toISOString()
      }
      // Also approve the artist if making them a finalist
      if (!currentIsFinalist) {
        updates.status = 'approved'
      }

      const { error } = await supabase
        .from('artist_applications')
        .update(updates)
        .eq('id', submissionId)

      if (error) throw error

      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, ...updates } : s)
      )
    } catch (error) {
      console.error('Error toggling finalist:', error)
      alert('Failed to update finalist status')
    } finally {
      setUpdatingId(null)
    }
  }

  const selectWinner = async (submissionId) => {
    if (!activeCompetition) return
    if (!confirm('Select this artist as the competition winner?')) return

    setUpdatingId(submissionId)
    try {
      // Clear any previous winner in this competition
      await supabase
        .from('artist_applications')
        .update({ is_winner: false })
        .eq('competition_id', activeCompetition.id)
        .eq('is_winner', true)

      // Set new winner
      const { error: winnerError } = await supabase
        .from('artist_applications')
        .update({
          is_winner: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (winnerError) throw winnerError

      // Update competition
      const { error: compError } = await supabase
        .from('competitions')
        .update({
          winner_id: submissionId,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeCompetition.id)

      if (compError) throw compError

      setSubmissions(prev =>
        prev.map(s => ({
          ...s,
          is_winner: s.id === submissionId ? true :
            (s.competition_id === activeCompetition.id ? false : s.is_winner)
        }))
      )
      setActiveCompetition(prev => ({ ...prev, status: 'completed', winner_id: submissionId }))
    } catch (error) {
      console.error('Error selecting winner:', error)
      alert('Failed to select winner')
    } finally {
      setUpdatingId(null)
    }
  }

  const togglePlayTrack = (trackUrl, submissionId) => {
    if (playingTrack === submissionId) {
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ''
      }
      setPlayingTrack(null)
      setAudioRef(null)
    } else {
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ''
      }
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
    : filter === 'finalists'
      ? submissions.filter(s => s.is_finalist)
      : submissions.filter(s => s.status === filter)

  const counts = {
    all: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    finalists: submissions.filter(s => s.is_finalist).length
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

      {/* Competition Management */}
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '1rem',
        marginBottom: '1.5rem',
        border: '2px solid rgba(210, 105, 30, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: activeCompetition ? '0.75rem' : 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={18} color="#d2691e" />
            <span style={{ fontWeight: '600', color: '#8b4513', fontSize: '0.95rem' }}>
              Competition
            </span>
          </div>
          {!showCreateComp && (
            <button
              onClick={() => setShowCreateComp(true)}
              style={{
                background: 'linear-gradient(135deg, #d2691e, #cd853f)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.3rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Plus size={14} /> New
            </button>
          )}
        </div>

        {/* Create competition form */}
        {showCreateComp && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(210, 105, 30, 0.06)',
            borderRadius: '10px',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontWeight: '600', color: '#8b4513', fontSize: '0.85rem' }}>
                Create Competition
              </span>
              <button
                onClick={() => setShowCreateComp(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={16} color="#999" />
              </button>
            </div>
            <input
              type="text"
              value={newCompTitle}
              onChange={(e) => setNewCompTitle(e.target.value)}
              placeholder="Competition title (e.g., 'Grant Round 1')"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(210, 105, 30, 0.3)',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                boxSizing: 'border-box',
                fontSize: '0.85rem'
              }}
            />
            <textarea
              value={newCompDesc}
              onChange={(e) => setNewCompDesc(e.target.value)}
              placeholder="Description (optional)"
              rows="2"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(210, 105, 30, 0.3)',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                boxSizing: 'border-box',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <button
              onClick={createCompetition}
              disabled={creatingComp || !newCompTitle.trim()}
              style={{
                padding: '0.4rem 1rem',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: creatingComp ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.85rem',
                opacity: creatingComp || !newCompTitle.trim() ? 0.6 : 1
              }}
            >
              {creatingComp ? 'Creating...' : 'Create Competition'}
            </button>
          </div>
        )}

        {/* Active competition info */}
        {activeCompetition && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <div>
                <span style={{ fontWeight: '600', color: '#8b4513', fontSize: '0.9rem' }}>
                  {activeCompetition.title}
                </span>
                <span style={{
                  display: 'inline-block',
                  marginLeft: '0.5rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  backgroundColor: activeCompetition.status === 'open' ? 'rgba(16, 185, 129, 0.15)' :
                    activeCompetition.status === 'voting' ? 'rgba(245, 158, 11, 0.15)' :
                    activeCompetition.status === 'completed' ? 'rgba(59, 130, 246, 0.15)' :
                    'rgba(107, 114, 128, 0.15)',
                  color: activeCompetition.status === 'open' ? '#059669' :
                    activeCompetition.status === 'voting' ? '#d97706' :
                    activeCompetition.status === 'completed' ? '#3b82f6' :
                    '#6b7280'
                }}>
                  {activeCompetition.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {activeCompetition.status === 'open' && (
                  <button
                    onClick={() => updateCompetitionStatus(activeCompetition.id, 'voting')}
                    style={{
                      padding: '0.25rem 0.6rem',
                      background: '#d97706',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    Open Voting
                  </button>
                )}
                {activeCompetition.status === 'voting' && (
                  <button
                    onClick={() => updateCompetitionStatus(activeCompetition.id, 'open')}
                    style={{
                      padding: '0.25rem 0.6rem',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    Close Voting
                  </button>
                )}
                {(activeCompetition.status === 'completed' || activeCompetition.status === 'voting') && (
                  <button
                    onClick={() => updateCompetitionStatus(activeCompetition.id, 'closed')}
                    style={{
                      padding: '0.25rem 0.6rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a0522d', marginTop: '0.25rem' }}>
              {counts.finalists} finalist{counts.finalists !== 1 ? 's' : ''} selected
            </div>
          </div>
        )}

        {!activeCompetition && !showCreateComp && (
          <p style={{ color: '#a0522d', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
            No active competition. Create one to start selecting finalists.
          </p>
        )}
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
          { key: 'finalists', label: 'Finalists' },
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
            {filter === 'all' ? 'No artist submissions yet.' :
             filter === 'finalists' ? 'No finalists selected yet.' :
             `No ${filter} submissions.`}
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
                border: submission.is_winner ? '3px solid #f59e0b' :
                  submission.is_finalist ? '3px solid #d2691e' :
                  '2px solid rgba(210, 105, 30, 0.3)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Finalist / Winner badge */}
              {(submission.is_finalist || submission.is_winner) && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: submission.is_winner ? '#f59e0b' : '#d2691e',
                  color: 'white',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '0 13px 0 10px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  zIndex: 1
                }}>
                  <Trophy size={10} />
                  {submission.is_winner ? 'WINNER' : 'FINALIST'}
                </div>
              )}

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

                {/* Vote count (if finalist) */}
                {submission.is_finalist && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    padding: '0.4rem 0.75rem',
                    backgroundColor: 'rgba(210, 105, 30, 0.06)',
                    borderRadius: '8px',
                    width: 'fit-content'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#8b4513', fontWeight: '500' }}>
                      Votes:
                    </span>
                    <span style={{ fontSize: '1rem', color: '#d2691e', fontWeight: '700' }}>
                      {submission.vote_count || 0}
                    </span>
                  </div>
                )}

                {/* Agent Review */}
                {submission.agent_reviewed_at && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    borderRadius: '10px',
                    marginBottom: '0.75rem',
                    border: '1px solid rgba(59, 130, 246, 0.15)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.4rem'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600' }}>
                        Agent Review
                      </span>
                      <div style={{ display: 'flex', gap: '0.1rem' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={`agent-${star}`}
                            size={14}
                            fill={submission.agent_rating >= star ? '#3b82f6' : 'none'}
                            color={submission.agent_rating >= star ? '#3b82f6' : '#ccc'}
                          />
                        ))}
                      </div>
                      {submission.agent_rating && (
                        <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>
                          {submission.agent_rating}/5
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: '#4b5563',
                      lineHeight: '1.4'
                    }}>
                      {submission.agent_notes}
                    </p>
                    <span style={{
                      fontSize: '0.7rem',
                      color: '#9ca3af',
                      marginTop: '0.25rem',
                      display: 'block'
                    }}>
                      Reviewed {new Date(submission.agent_reviewed_at).toLocaleString()}
                    </span>
                  </div>
                )}

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

                  {/* Finalist toggle */}
                  {activeCompetition && submission.status !== 'rejected' && (
                    <button
                      onClick={() => toggleFinalist(submission.id, submission.is_finalist)}
                      disabled={updatingId === submission.id}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        border: submission.is_finalist ? '2px solid #d2691e' : '2px solid #d2691e',
                        background: submission.is_finalist ? '#d2691e' : 'white',
                        color: submission.is_finalist ? 'white' : '#d2691e',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        cursor: updatingId === submission.id ? 'not-allowed' : 'pointer',
                        opacity: updatingId === submission.id ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Trophy size={12} />
                      {submission.is_finalist ? 'Remove Finalist' : 'Make Finalist'}
                    </button>
                  )}

                  {/* Select Winner */}
                  {submission.is_finalist && !submission.is_winner && activeCompetition?.status === 'voting' && (
                    <button
                      onClick={() => selectWinner(submission.id)}
                      disabled={updatingId === submission.id}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: updatingId === submission.id ? 'not-allowed' : 'pointer',
                        opacity: updatingId === submission.id ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Trophy size={12} /> Select Winner
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
