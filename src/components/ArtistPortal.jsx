import React, { useState, useEffect } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function ArtistPortal({ user, profile, supabase, application, onBack }) {
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

        {/* Portal card */}
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

          <p style={{
            color: '#8b4513',
            fontSize: '1rem',
            lineHeight: '1.6',
            margin: '0 0 1rem'
          }}>
            {t('artist.portalWelcome')}
          </p>

          <p style={{
            color: '#a0522d',
            fontSize: '0.9rem',
            fontStyle: 'italic'
          }}>
            {t('artist.portalComingSoon')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ArtistPortal
