import React, { useState, useEffect } from 'react'
import { ArrowLeft, Check, Trophy, Music, ExternalLink, Play, Pause } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function ArtistPortal({ user, profile, supabase, application, onBack }) {
  const { t } = useLanguage()
  const [competition, setCompetition] = useState(null)
  const [playingTrack, setPlayingTrack] = useState(false)
  const [audioRef, setAudioRef] = useState(null)

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

  useEffect(() => {
    const handleResize = () => setBackgroundUrl(getBackgroundImage())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [supabase])

  useEffect(() => {
    if (application?.competition_id) {
      fetchCompetition()
    }
    return () => {
      if (audioRef) { audioRef.pause(); audioRef.src = '' }
    }
  }, [application])

  const fetchCompetition = async () => {
    if (!application?.competition_id) return
    const { data } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', application.competition_id)
      .maybeSingle()
    if (data) setCompetition(data)
  }

  const togglePlay = () => {
    if (!application?.track_url) return
    if (playingTrack) {
      if (audioRef) { audioRef.pause(); audioRef.src = '' }
      setPlayingTrack(false)
      setAudioRef(null)
    } else {
      const audio = new Audio(application.track_url)
      audio.play().catch(err => console.error('Playback error:', err))
      audio.addEventListener('ended', () => {
        setPlayingTrack(false)
        setAudioRef(null)
      })
      setAudioRef(audio)
      setPlayingTrack(true)
    }
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
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#8b4513',
              marginBottom: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <ArrowLeft size={16} />
            {t('common.back')}
          </button>
        )}

        {/* Winner badge */}
        {application?.is_winner && (
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: 'white',
            textAlign: 'center',
            marginBottom: '1rem',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
          }}>
            <Trophy size={40} style={{ marginBottom: '0.5rem' }} />
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem' }}>
              Grant Winner
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              {competition?.title || 'Artist Competition'}
            </p>
          </div>
        )}

        {/* Finalist badge (not winner) */}
        {application?.is_finalist && !application?.is_winner && (
          <div style={{
            background: 'linear-gradient(135deg, #8b4513, #d2691e)',
            borderRadius: '20px',
            padding: '1.25rem',
            color: 'white',
            textAlign: 'center',
            marginBottom: '1rem',
            boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)'
          }}>
            <Trophy size={32} style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>
              Competition Finalist
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
              {competition?.title || 'Artist Competition'}
            </p>
            {application?.vote_count > 0 && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: '700' }}>
                {application.vote_count} vote{application.vote_count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Main portal card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Check size={32} color="#10b981" />
          </div>

          <h2 style={{
            color: '#8b4513',
            margin: '0 0 0.5rem',
            fontSize: '1.5rem'
          }}>
            {t('artist.portalTitle')}
          </h2>

          <p style={{
            color: '#d2691e',
            fontWeight: '500',
            margin: '0 0 1rem',
            fontSize: '1.1rem'
          }}>
            {application?.artist_name || profile?.username}
          </p>

          {/* Your track */}
          {application?.track_url && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(210, 105, 30, 0.06)',
              borderRadius: '12px',
              marginBottom: '1rem'
            }}>
              <button
                onClick={togglePlay}
                style={{
                  width: '40px',
                  height: '40px',
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
                {playingTrack ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', color: '#8b4513', fontWeight: '500' }}>
                  Your Submission
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a0522d' }}>
                  {application.artist_name}
                </div>
              </div>
            </div>
          )}

          {/* Social links */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '1rem'
          }}>
            {application?.spotify_url && (
              <a href={application.spotify_url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: '0.8rem',
                  color: '#1DB954',
                  textDecoration: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(29, 185, 84, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                Spotify <ExternalLink size={12} />
              </a>
            )}
            {application?.instagram_url && (
              <a href={application.instagram_url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: '0.8rem',
                  color: '#E4405F',
                  textDecoration: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(228, 64, 95, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                Instagram <ExternalLink size={12} />
              </a>
            )}
            {application?.tiktok_url && (
              <a href={application.tiktok_url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: '0.8rem',
                  color: '#000',
                  textDecoration: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                TikTok <ExternalLink size={12} />
              </a>
            )}
          </div>

          <p style={{
            color: '#8b4513',
            fontSize: '1rem',
            lineHeight: '1.6',
            margin: '0 0 1rem'
          }}>
            {t('artist.portalWelcome')}
          </p>

          {/* Palomas info */}
          {profile?.dov_balance > 0 && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(210, 105, 30, 0.08)',
              borderRadius: '12px',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#a0522d', marginBottom: '0.25rem' }}>
                Your Palomas Balance
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d2691e' }}>
                {profile.dov_balance}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a0522d' }}>
                Use Palomas to book studio time
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArtistPortal
