import React, { useState } from 'react'

function ProfilePicture({ 
  supabase, 
  user, 
  profile, 
  onProfileUpdate, 
  size = 'medium', 
  showUpload = true,
  className = '' 
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const sizeClasses = {
    small: { width: '40px', height: '40px', fontSize: '16px' },
    medium: { width: '60px', height: '60px', fontSize: '20px' },
    large: { width: '100px', height: '100px', fontSize: '32px' },
    xlarge: { width: '150px', height: '150px', fontSize: '48px' }
  }

  const currentSize = sizeClasses[size] || sizeClasses.medium

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !user || !supabase) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/profile.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          upsert: true // Replace existing file
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: publicUrl,
          profile_picture_updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate({ 
          ...profile, 
          profile_picture_url: publicUrl,
          profile_picture_updated_at: new Date().toISOString()
        })
      }

      setShowUploadModal(false)
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      alert('Failed to upload profile picture. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePicture = async () => {
    if (!user || !supabase || !profile?.profile_picture_url) return

    setIsUploading(true)

    try {
      // Remove from storage
      const fileName = `${user.id}/profile.jpg` // Try common extensions
      await supabase.storage
        .from('profile-pictures')
        .remove([fileName])

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_picture_url: null,
          profile_picture_updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          profile_picture_url: null,
          profile_picture_updated_at: new Date().toISOString()
        })
      }

      setShowUploadModal(false)
    } catch (error) {
      console.error('Error removing profile picture:', error)
      alert('Failed to remove profile picture. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveGoldRing = async () => {
    if (!user || !supabase || !profile?.gold_ring) return

    setIsUploading(true)

    try {
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          gold_ring: false
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          gold_ring: false
        })
      }

      setShowUploadModal(false)
    } catch (error) {
      console.error('Error removing gold ring:', error)
      alert('Failed to remove gold ring. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <div 
        className={className}
        style={{
          position: 'relative',
          display: 'inline-block'
        }}
      >
        {/* Profile Picture Display */}
        <div
          style={{
            width: currentSize.width,
            height: currentSize.height,
            borderRadius: '50%',
            backgroundColor: profile?.profile_picture_url ? 'transparent' : '#f0f0f0',
            backgroundImage: profile?.profile_picture_url ? `url(${profile.profile_picture_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: showUpload ? 'pointer' : 'default',
            border: profile?.gold_ring ? '4px solid gold' : '3px solid #d2691e',
            boxShadow: profile?.gold_ring
              ? '0 0 15px rgba(255, 215, 0, 0.6), 0 2px 8px rgba(0,0,0,0.1)'
              : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            overflow: 'hidden'
          }}
          onClick={() => showUpload && setShowUploadModal(true)}
          onMouseOver={(e) => showUpload && (e.target.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => showUpload && (e.target.style.transform = 'scale(1)')}
        >
          {!profile?.profile_picture_url && (
            <div style={{
              fontSize: currentSize.fontSize,
              color: '#8b4513',
              fontWeight: 'bold'
            }}>
              {profile?.username ? profile.username.charAt(0).toUpperCase() : '👤'}
            </div>
          )}
        </div>

        {/* Upload Button Overlay */}
        {showUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#d2691e',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              fontSize: '12px'
            }}
          >
            📷
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowUploadModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ❌
            </button>

            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#8b4513' 
            }}>
              Profile Picture
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="profile-upload"
                style={{
                  display: 'inline-block',
                  padding: '1rem 1.5rem',
                  backgroundColor: '#d2691e',
                  color: 'white',
                  borderRadius: '15px',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.5 : 1,
                  marginBottom: '1rem',
                  fontSize: '16px'
                }}
              >
                📤 {isUploading ? 'Uploading...' : 'Choose Photo'}
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {profile?.profile_picture_url && (
                <button
                  onClick={handleRemovePicture}
                  disabled={isUploading}
                  style={{
                    padding: '0.8rem 1.2rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    opacity: isUploading ? 0.5 : 1,
                    fontSize: '16px'
                  }}
                >
                  🗑️ Remove Photo
                </button>
              )}

              {profile?.gold_ring && (
                <button
                  onClick={handleRemoveGoldRing}
                  disabled={isUploading}
                  style={{
                    padding: '0.8rem 1.2rem',
                    backgroundColor: '#8b4513',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    opacity: isUploading ? 0.5 : 1,
                    fontSize: '16px'
                  }}
                >
                  👑 Remove Gold Ring
                </button>
              )}
            </div>

            <p style={{
              fontSize: '0.8rem',
              color: '#666',
              margin: '1rem 0 0 0'
            }}>
              Max file size: 5MB. Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default ProfilePicture
