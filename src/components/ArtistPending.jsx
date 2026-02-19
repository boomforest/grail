import React, { useState, useEffect } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function ArtistPending({ profile, application, supabase, onBack }) {
  const { t } = useLanguage()

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

  const prepareItems = t('artist.pendingPrepareItems')

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

        {/* Confirmation card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(210, 105, 30, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Clock size={32} color="#d2691e" />
          </div>

          <h2 style={{
            color: '#8b4513',
            margin: '0 0 0.75rem',
            fontSize: '1.5rem'
          }}>
            {t('artist.pendingTitle')}
          </h2>

          <p style={{
            color: '#8b4513',
            fontSize: '1rem',
            lineHeight: '1.6',
            margin: '0 0 1.5rem'
          }}>
            {t('artist.pendingMessage')}
          </p>

          {/* Application details */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(210, 105, 30, 0.08)',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              color: '#d2691e',
              fontWeight: '600',
              margin: '0 0 0.25rem',
              fontSize: '1.05rem'
            }}>
              {application?.artist_name}
            </p>
            <p style={{
              color: '#8b4513',
              margin: 0,
              fontSize: '0.85rem'
            }}>
              {t('artist.submittedOn')}: {application?.created_at
                ? new Date(application.created_at).toLocaleDateString()
                : '—'}
            </p>
          </div>

          {/* Preparation instructions */}
          <div style={{ textAlign: 'left' }}>
            <p style={{
              color: '#8b4513',
              fontWeight: '500',
              margin: '0 0 0.5rem',
              fontSize: '0.9rem'
            }}>
              {t('artist.pendingPrepare')}
            </p>
            <ul style={{
              margin: 0,
              paddingLeft: '1.25rem',
              color: '#a0522d',
              fontSize: '0.85rem',
              lineHeight: '1.8'
            }}>
              {Array.isArray(prepareItems) && prepareItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArtistPending
