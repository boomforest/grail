import React, { useState, useEffect } from 'react'
import { ArrowLeft, Play, Pause, Trophy, Vote, Music, User, MapPin, Check } from 'lucide-react'

function CompetitionPage({ user, profile, supabase, onBack, onApply }) {
  const [competition, setCompetition] = useState(null)
  const [finalists, setFinalists] = useState([])
  const [loading, setLoading] = useState(true)
  const [playingTrack, setPlayingTrack] = useState(null)
  const [audioRef, setAudioRef] = useState(null)
  const [userVote, setUserVote] = useState(null)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    fetchCompetition()
    return () => {
      if (audioRef) {
        audioRef.pause()
        audioRef.src = ''
      }
    }
  }, [])

  const fetchCompetition = async () => {
    try {
      // Get the latest active competition (open or voting)
      const { data: comp, error: compError } = await supabase
        .from('competitions')
        .select('*')
        .in('status', ['open', 'voting', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (compError) throw compError
      if (!comp) {
        setLoading(false)
        return
      }

      setCompetition(comp)

      // Get finalists for this competition
      const { data: apps, error: appsError } = await supabase
        .from('artist_applications')
        .select('*')
        .eq('competition_id', comp.id)
        .eq('is_finalist', true)
        .order('vote_count', { ascending: false })

      if (appsError) throw appsError
      setFinalists(apps || [])

      // Check if user already voted
      if (user) {
        const { data: vote } = await supabase
          .from('competition_votes')
          .select('artist_application_id')
          .eq('competition_id', comp.id)
          .eq('voter_user_id', user.id)
          .maybeSingle()

        if (vote) setUserVote(vote.artist_application_id)
      }
    } catch (error) {
      console.error('Error fetching competition:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (applicationId) => {
    if (!user || !competition || voting || userVote) return
    if (competition.status !== 'voting') return

    setVoting(true)
    try {
      // Insert vote
      const { error: voteError } = await supabase
        .from('competition_votes')
        .insert([{
          competition_id: competition.id,
          voter_user_id: user.id,
          artist_application_id: applicationId
        }])

      if (voteError) throw voteError

      // Increment vote count on application
      const artist = finalists.find(f => f.id === applicationId)
      if (artist) {
        await supabase
          .from('artist_applications')
          .update({ vote_count: (artist.vote_count || 0) + 1 })
          .eq('id', applicationId)
      }

      setUserVote(applicationId)
      setFinalists(prev =>
        prev.map(f => f.id === applicationId
          ? { ...f, vote_count: (f.vote_count || 0) + 1 }
          : f
        )
      )
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to submit vote. You may have already voted.')
    } finally {
      setVoting(false)
    }
  }

  const togglePlay = (trackUrl, id) => {
    if (playingTrack === id) {
      if (audioRef) { audioRef.pause(); audioRef.src = '' }
      setPlayingTrack(null)
      setAudioRef(null)
    } else {
      if (audioRef) { audioRef.pause(); audioRef.src = '' }
      const audio = new Audio(trackUrl)
      audio.play().catch(err => console.error('Playback error:', err))
      audio.addEventListener('ended', () => {
        setPlayingTrack(null)
        setAudioRef(null)
      })
      setAudioRef(audio)
      setPlayingTrack(id)
    }
  }

  const winner = competition?.status === 'completed'
    ? finalists.find(f => f.is_winner)
    : null

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #d2691e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
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
        </div>

        {/* No competition */}
        {!competition && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
          }}>
            <Music size={48} style={{ color: '#d2691e', marginBottom: '1rem' }} />
            <h2 style={{ color: '#8b4513', margin: '0 0 0.5rem' }}>
              No Active Competition
            </h2>
            <p style={{ color: '#a0522d', margin: '0 0 1.5rem', lineHeight: '1.6' }}>
              The next artist grant competition hasn't started yet. Apply now to be considered when submissions open.
            </p>
            {onApply && (
              <button
                onClick={onApply}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #d2691e, #cd853f)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                Apply as Artist
              </button>
            )}
          </div>
        )}

        {/* Active competition */}
        {competition && (
          <>
            {/* Competition banner */}
            <div style={{
              background: 'linear-gradient(135deg, #8b4513, #d2691e)',
              borderRadius: '20px',
              padding: '2rem',
              color: 'white',
              textAlign: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)'
            }}>
              <Trophy size={36} style={{ marginBottom: '0.75rem' }} />
              <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>
                {competition.title}
              </h1>
              {competition.description && (
                <p style={{ margin: '0 0 1rem', opacity: 0.9, lineHeight: '1.5' }}>
                  {competition.description}
                </p>
              )}
              <span style={{
                display: 'inline-block',
                padding: '0.3rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor: competition.status === 'open' ? 'rgba(16, 185, 129, 0.3)' :
                  competition.status === 'voting' ? 'rgba(245, 158, 11, 0.3)' :
                  'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                {competition.status === 'open' ? 'Accepting Submissions' :
                 competition.status === 'voting' ? 'Voting Open' :
                 'Competition Complete'}
              </span>
            </div>

            {/* Winner announcement */}
            {winner && (
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '20px',
                padding: '2rem',
                color: 'white',
                textAlign: 'center',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
              }}>
                <Trophy size={48} style={{ marginBottom: '0.5rem' }} />
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem' }}>Winner</h2>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem' }}>
                  {winner.artist_name}
                </h3>
                {winner.country && (
                  <p style={{ margin: '0 0 1rem', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} /> {winner.country}
                  </p>
                )}
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>
                  {winner.vote_count || 0} votes
                </p>
              </div>
            )}

            {/* Finalists */}
            {finalists.length > 0 && (
              <>
                <h2 style={{
                  color: '#8b4513',
                  fontSize: '1.2rem',
                  margin: '0 0 1rem',
                  textAlign: 'center'
                }}>
                  {competition.status === 'completed' ? 'Finalists' : 'Vote for Your Favorite'}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {finalists.map((artist, index) => (
                    <div
                      key={artist.id}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: artist.is_winner ? '3px solid #f59e0b' :
                          userVote === artist.id ? '3px solid #d2691e' :
                          '2px solid rgba(210, 105, 30, 0.2)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        transition: 'transform 0.2s',
                        position: 'relative'
                      }}
                    >
                      {/* Winner badge */}
                      {artist.is_winner && (
                        <div style={{
                          position: 'absolute',
                          top: '-1px',
                          right: '-1px',
                          background: '#f59e0b',
                          color: 'white',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '0 14px 0 12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <Trophy size={12} /> WINNER
                        </div>
                      )}

                      <div style={{ padding: '1.25rem' }}>
                        {/* Artist info row */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.75rem'
                        }}>
                          {/* Photo */}
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: '#f5f5dc',
                            backgroundImage: artist.artist_photo_url ? `url(${artist.artist_photo_url})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '2px solid #d2691e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {!artist.artist_photo_url && <User size={20} color="#d2691e" />}
                          </div>

                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              margin: '0 0 0.2rem',
                              color: '#8b4513',
                              fontSize: '1.1rem'
                            }}>
                              {artist.artist_name}
                            </h3>
                            {artist.country && (
                              <span style={{
                                fontSize: '0.8rem',
                                color: '#a0522d',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}>
                                <MapPin size={12} /> {artist.country}
                              </span>
                            )}
                          </div>

                          {/* Vote count */}
                          <div style={{
                            textAlign: 'center',
                            padding: '0.4rem 0.75rem',
                            backgroundColor: 'rgba(210, 105, 30, 0.08)',
                            borderRadius: '12px'
                          }}>
                            <div style={{
                              fontSize: '1.3rem',
                              fontWeight: '700',
                              color: '#d2691e'
                            }}>
                              {artist.vote_count || 0}
                            </div>
                            <div style={{
                              fontSize: '0.65rem',
                              color: '#a0522d',
                              textTransform: 'uppercase',
                              fontWeight: '600'
                            }}>
                              votes
                            </div>
                          </div>
                        </div>

                        {/* Bio */}
                        {artist.bio && (
                          <p style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            margin: '0 0 0.75rem',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {artist.bio}
                          </p>
                        )}

                        {/* Audio player */}
                        {artist.track_url && (
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
                              onClick={() => togglePlay(artist.track_url, artist.id)}
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
                              {playingTrack === artist.id ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <span style={{
                              fontSize: '0.8rem',
                              color: '#8b4513',
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              Listen to submission
                            </span>
                          </div>
                        )}

                        {/* Social links */}
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: competition.status === 'voting' && !userVote ? '0.75rem' : 0
                        }}>
                          {artist.spotify_url && (
                            <a href={artist.spotify_url} target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: '0.75rem',
                                color: '#1DB954',
                                textDecoration: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(29, 185, 84, 0.1)'
                              }}>
                              Spotify
                            </a>
                          )}
                          {artist.instagram_url && (
                            <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: '0.75rem',
                                color: '#E4405F',
                                textDecoration: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(228, 64, 95, 0.1)'
                              }}>
                              Instagram
                            </a>
                          )}
                          {artist.tiktok_url && (
                            <a href={artist.tiktok_url} target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: '0.75rem',
                                color: '#000',
                                textDecoration: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(0, 0, 0, 0.06)'
                              }}>
                              TikTok
                            </a>
                          )}
                        </div>

                        {/* Vote button */}
                        {competition.status === 'voting' && user && !userVote && (
                          <button
                            onClick={() => handleVote(artist.id)}
                            disabled={voting}
                            style={{
                              width: '100%',
                              padding: '0.7rem',
                              background: 'linear-gradient(135deg, #d2691e, #cd853f)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              cursor: voting ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              opacity: voting ? 0.6 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Vote size={16} /> Vote for {artist.artist_name}
                          </button>
                        )}

                        {/* Already voted indicator */}
                        {userVote === artist.id && (
                          <div style={{
                            width: '100%',
                            padding: '0.7rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            border: '2px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}>
                            <Check size={16} /> Your Vote
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* No finalists yet */}
            {finalists.length === 0 && competition.status === 'open' && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
              }}>
                <Music size={36} style={{ color: '#d2691e', marginBottom: '0.75rem' }} />
                <h3 style={{ color: '#8b4513', margin: '0 0 0.5rem' }}>
                  Submissions Open
                </h3>
                <p style={{ color: '#a0522d', margin: '0 0 1rem', lineHeight: '1.5' }}>
                  Artists are submitting their tracks. Finalists will be announced soon.
                </p>
                {onApply && (
                  <button
                    onClick={onApply}
                    style={{
                      padding: '0.6rem 1.5rem',
                      background: 'linear-gradient(135deg, #d2691e, #cd853f)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Submit Your Music
                  </button>
                )}
              </div>
            )}

            {/* Not logged in voting prompt */}
            {competition.status === 'voting' && !user && (
              <div style={{
                background: 'rgba(210, 105, 30, 0.08)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center',
                marginTop: '1rem',
                border: '1px solid rgba(210, 105, 30, 0.2)'
              }}>
                <p style={{ color: '#8b4513', margin: 0, fontSize: '0.9rem' }}>
                  Log in to vote for your favorite artist
                </p>
              </div>
            )}
          </>
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

export default CompetitionPage
