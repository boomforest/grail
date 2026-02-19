import React, { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Music } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ArtistGuidelines from './ArtistGuidelines'

const COUNTRIES = [
  'Mexico', 'Colombia', 'Argentina', 'Peru', 'Chile',
  'Ecuador', 'Guatemala', 'Cuba', 'Bolivia', 'Dominican Republic',
  'Honduras', 'Paraguay', 'El Salvador', 'Nicaragua', 'Costa Rica',
  'Panama', 'Uruguay', 'Venezuela', 'Puerto Rico', 'Brazil',
  'United States', 'Canada', 'Spain', 'Portugal',
  'France', 'Germany', 'Italy', 'United Kingdom',
  'Japan', 'South Korea', 'Australia',
  'Other'
]

function ArtistApply({ user, profile, supabase, existingApplication, onSubmitted, onBack }) {
  const { language, setLanguage, t } = useLanguage()

  // Default to Spanish on mount
  useEffect(() => {
    setLanguage('es')
  }, [])

  const [formData, setFormData] = useState({
    artistName: existingApplication?.artist_name || '',
    country: existingApplication?.country || '',
    customCountry: '',
    confirmed18Plus: false,
    acceptedTerms: false
  })
  const [trackFile, setTrackFile] = useState(null)
  const [trackFileName, setTrackFileName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [showGuidelines, setShowGuidelines] = useState(false)

  // If existing application has a country not in the list, set it as custom
  useEffect(() => {
    if (existingApplication?.country && !COUNTRIES.includes(existingApplication.country)) {
      setFormData(prev => ({
        ...prev,
        country: 'Other',
        customCountry: existingApplication.country
      }))
    }
  }, [existingApplication])

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

  const handleTrackSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      setMessage('Please select an audio file (MP3, WAV, M4A)')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setMessage('File size must be less than 20MB')
      return
    }

    setTrackFile(file)
    setTrackFileName(file.name)
    setMessage('')
  }

  const uploadTrack = async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/track-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('artist-tracks')
      .upload(fileName, file, { upsert: true })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('artist-tracks')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const handleSubmit = async () => {
    if (!formData.artistName.trim()) {
      setMessage(t('artist.errors.nameRequired'))
      return
    }
    if (!formData.country || (formData.country === 'Other' && !formData.customCountry.trim())) {
      setMessage(t('artist.errors.countryRequired'))
      return
    }
    if (!formData.confirmed18Plus) {
      setMessage(t('artist.errors.must18Plus'))
      return
    }
    if (!formData.acceptedTerms) {
      setMessage(t('artist.errors.mustAcceptTerms'))
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      let trackUrl = existingApplication?.track_url || null

      if (trackFile) {
        setIsUploading(true)
        trackUrl = await uploadTrack(trackFile)
        setIsUploading(false)
      }

      const country = formData.country === 'Other'
        ? formData.customCountry.trim()
        : formData.country

      const applicationData = {
        user_id: user.id,
        artist_name: formData.artistName.trim(),
        country,
        track_url: trackUrl,
        confirmed_18plus: formData.confirmed18Plus,
        accepted_terms_at: new Date().toISOString(),
        status: 'submitted'
      }

      let result
      if (existingApplication && (existingApplication.status === 'draft' || existingApplication.status === 'rejected')) {
        const { data, error } = await supabase
          .from('artist_applications')
          .update({ ...applicationData, updated_at: new Date().toISOString() })
          .eq('id', existingApplication.id)
          .select()
          .single()
        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('artist_applications')
          .insert([applicationData])
          .select()
          .single()
        if (error) throw error
        result = data
      }

      onSubmitted(result)
    } catch (error) {
      console.error('Error submitting application:', error)
      setMessage(t('artist.errors.submitFailed') + ': ' + error.message)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
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
        {/* Top bar: Back + Language toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          {onBack ? (
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <ArrowLeft size={16} />
              {t('common.back')}
            </button>
          ) : <div />}

          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #8b0000, #dc143c)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(139, 0, 0, 0.3)'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>
              {language === 'es' ? '🇺🇸' : '🇲🇽'}
            </span>
            {language === 'es' ? 'English' : 'Español'}
          </button>
        </div>

        {/* Application form card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            color: '#8b4513',
            margin: '0 0 0.25rem',
            fontSize: '1.5rem',
            textAlign: 'center'
          }}>
            {t('artist.applyTitle')}
          </h2>
          <p style={{
            color: '#a0522d',
            margin: '0 0 1.5rem',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {t('artist.applySubtitle')}
          </p>

          {/* Error message */}
          {message && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              backgroundColor: 'rgba(248, 215, 218, 0.9)',
              color: '#721c24',
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}

          {/* Artist Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#8b4513',
              marginBottom: '0.5rem'
            }}>
              {t('artist.artistName')}
            </label>
            <input
              type="text"
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
              placeholder={t('artist.artistNamePlaceholder')}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(210, 105, 30, 0.3)',
                borderRadius: '12px',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>

          {/* Country */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#8b4513',
              marginBottom: '0.5rem'
            }}>
              {t('artist.country')}
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value, customCountry: '' })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid rgba(210, 105, 30, 0.3)',
                borderRadius: '12px',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: formData.country ? '#333' : '#999',
                cursor: 'pointer'
              }}
            >
              <option value="">{t('artist.selectCountry')}</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {formData.country === 'Other' && (
              <input
                type="text"
                value={formData.customCountry}
                onChange={(e) => setFormData({ ...formData, customCountry: e.target.value })}
                placeholder={t('artist.otherCountry')}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid rgba(210, 105, 30, 0.3)',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  marginTop: '0.5rem'
                }}
              />
            )}
          </div>

          {/* Track Upload */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#8b4513',
              marginBottom: '0.25rem'
            }}>
              {t('artist.uploadTrack')}
            </label>
            <p style={{
              fontSize: '0.8rem',
              color: '#a0522d',
              margin: '0 0 0.5rem'
            }}>
              {t('artist.uploadTrackDesc')}
            </p>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1rem',
              border: '2px dashed rgba(210, 105, 30, 0.4)',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: trackFileName ? 'rgba(210, 105, 30, 0.08)' : 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.3s ease'
            }}>
              <input
                type="file"
                accept="audio/*"
                onChange={handleTrackSelect}
                style={{ display: 'none' }}
              />
              {trackFileName ? (
                <>
                  <Music size={20} color="#d2691e" />
                  <span style={{ color: '#8b4513', fontSize: '0.9rem' }}>
                    {trackFileName}
                  </span>
                </>
              ) : existingApplication?.track_url ? (
                <>
                  <Music size={20} color="#d2691e" />
                  <span style={{ color: '#8b4513', fontSize: '0.9rem' }}>
                    {t('artist.fileSelected')} - {t('artist.chooseFile')}
                  </span>
                </>
              ) : (
                <>
                  <Upload size={20} color="#a0522d" />
                  <span style={{ color: '#a0522d', fontSize: '0.9rem' }}>
                    {t('artist.chooseFile')}
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Age confirmation */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '12px',
              backgroundColor: formData.confirmed18Plus ? 'rgba(210, 105, 30, 0.08)' : 'transparent',
              transition: 'background-color 0.3s ease'
            }}>
              <input
                type="checkbox"
                checked={formData.confirmed18Plus}
                onChange={(e) => setFormData({ ...formData, confirmed18Plus: e.target.checked })}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: '#d2691e',
                  marginTop: '2px',
                  flexShrink: 0
                }}
              />
              <span style={{
                fontSize: '0.9rem',
                color: '#8b4513',
                lineHeight: '1.4'
              }}>
                {t('artist.confirm18Plus')}
              </span>
            </label>
          </div>

          {/* Program Guidelines Link */}
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowGuidelines(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#d2691e',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0.5rem'
              }}
            >
              {t('artist.readGuidelines')}
            </button>
          </div>

          {/* Terms acceptance */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '12px',
              backgroundColor: formData.acceptedTerms ? 'rgba(210, 105, 30, 0.08)' : 'transparent',
              transition: 'background-color 0.3s ease'
            }}>
              <input
                type="checkbox"
                checked={formData.acceptedTerms}
                onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: '#d2691e',
                  marginTop: '2px',
                  flexShrink: 0
                }}
              />
              <span style={{
                fontSize: '0.85rem',
                color: '#8b4513',
                lineHeight: '1.4'
              }}>
                {t('artist.acceptTerms')}
              </span>
            </label>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              background: 'rgba(210, 105, 30, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              opacity: isSubmitting ? 0.6 : 1,
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            {isUploading
              ? t('artist.uploading')
              : isSubmitting
                ? t('artist.submitting')
                : t('artist.submit')}
          </button>
        </div>
      </div>

      {/* Guidelines Modal */}
      {showGuidelines && (
        <ArtistGuidelines onClose={() => setShowGuidelines(false)} />
      )}
    </div>
  )
}

export default ArtistApply
