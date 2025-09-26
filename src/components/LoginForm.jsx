import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

// Username component with two separate fields
function UsernameInput({ username, onUsernameChange }) {
  const { t, translations } = useLanguage()
  
  // Helper function to display Spanish first with English in italics
  const dualText = (translationKey) => {
    const spanishText = translations?.es ? translations.es : {}
    const englishText = translations?.en ? translations.en : {}
    
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }
    
    const spanish = getNestedValue(spanishText, translationKey)
    const english = getNestedValue(englishText, translationKey)
    
    if (!spanish || !english) return t(translationKey)
    
    return (
      <span>
        {spanish}
        <span style={{ 
          marginLeft: '0.5rem', 
          fontStyle: 'italic', 
          opacity: 0.6, 
          fontSize: '0.9em' 
        }}>
          ({english})
        </span>
      </span>
    )
  }
  const letters = username.replace(/[^A-Za-z]/g, '').slice(0, 3);
  const numbers = username.replace(/[^0-9]/g, '').slice(0, 3);

  const handleLettersChange = (e) => {
    const value = e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
    const newUsername = value + numbers;
    onUsernameChange(newUsername);
  };

  const handleNumbersChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
    const newUsername = letters + value;
    onUsernameChange(newUsername);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <p style={{ 
          fontSize: '0.9rem', 
          color: '#8b4513', 
          margin: '0 0 0.5rem 0',
          textAlign: 'left'
        }}>
          {dualText('login.usernameWillBe')}: <span style={{ 
            fontFamily: 'monospace', 
            fontWeight: 'bold', 
            color: '#d2691e',
            fontSize: '1.1rem'
          }}>
            {letters || 'ABC'}{numbers || '123'}
          </span>
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.8rem', 
            fontWeight: '500', 
            color: '#8b4513', 
            marginBottom: '0.25rem',
            textAlign: 'left'
          }}>
            {dualText('login.threeLetters')}
          </label>
          <input
            type="text"
            value={letters}
            onChange={handleLettersChange}
            placeholder="ABC"
            maxLength={3}
            style={{
              width: '100%',
              padding: '1rem',
              border: '2px solid rgba(210, 105, 30, 0.3)',
              borderRadius: '15px',
              boxSizing: 'border-box',
              fontSize: '1.2rem',
              outline: 'none',
              textAlign: 'center',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              backgroundColor: letters.length === 3 ? 'rgba(254, 247, 237, 0.9)' : 'rgba(255, 255, 255, 0.8)',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)'
            }}
          />
        </div>
        
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#d2691e', 
          padding: '0 0.5rem',
          marginBottom: '1rem'
        }}>
          +
        </div>
        
        <div style={{ flex: 1 }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.8rem', 
            fontWeight: '500', 
            color: '#8b4513', 
            marginBottom: '0.25rem',
            textAlign: 'left'
          }}>
            {dualText('login.threeNumbers')}
          </label>
          <input
            type="text"
            value={numbers}
            onChange={handleNumbersChange}
            placeholder="123"
            maxLength={3}
            style={{
              width: '100%',
              padding: '1rem',
              border: '2px solid rgba(210, 105, 30, 0.3)',
              borderRadius: '15px',
              boxSizing: 'border-box',
              fontSize: '1.2rem',
              outline: 'none',
              textAlign: 'center',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              backgroundColor: numbers.length === 3 ? 'rgba(254, 247, 237, 0.9)' : 'rgba(255, 255, 255, 0.8)',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)'
            }}
          />
        </div>
      </div>
      
      <div style={{ 
        fontSize: '0.75rem', 
        color: '#8b4513', 
        marginTop: '0.5rem',
        textAlign: 'left'
      }}>
        {dualText('login.usernameRules')}
      </div>
    </div>
  );
}

function LoginForm({ supabase, onLogin, onRegister }) {
  const { t, translations } = useLanguage()
  
  // Helper function to display Spanish first with English in italics
  const dualText = (translationKey) => {
    const spanishText = translations?.es ? translations.es : {}
    const englishText = translations?.en ? translations.en : {}
    
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }
    
    const spanish = getNestedValue(spanishText, translationKey)
    const english = getNestedValue(englishText, translationKey)
    
    if (!spanish || !english) return t(translationKey)
    
    return (
      <span>
        {spanish}
        <span style={{ 
          marginLeft: '0.5rem', 
          fontStyle: 'italic', 
          opacity: 0.6, 
          fontSize: '0.9em' 
        }}>
          ({english})
        </span>
      </span>
    )
  }
  
  // Helper for placeholder text (plain text version)
  const dualTextPlain = (translationKey) => {
    const spanishText = translations?.es ? translations.es : {}
    const englishText = translations?.en ? translations.en : {}
    
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }
    
    const spanish = getNestedValue(spanishText, translationKey)
    const english = getNestedValue(englishText, translationKey)
    
    if (!spanish || !english) return t(translationKey)
    
    return `${spanish} (${english})`
  }
  // All state managed internally
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle forgot password functionality
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setMessage(t('login.pleaseEnterEmail'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}?type=recovery`
      });

      if (error) {
        setMessage(t('login.resetFailed', { error: error.message }));
      } else {
        setMessage(t('login.resetEmailSent'));
        // Start slide animation after 2 seconds
        setTimeout(() => {
          setIsSliding(true);
          // Clear message and switch tab after animation completes
          setTimeout(() => {
            setMessage('');
            setIsSliding(false);
            setActiveTab('login');
          }, 300); // Animation duration
        }, 2000);
      }
    } catch (error) {
      setMessage(t('login.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setMessage(t('login.pleaseFillFields'));
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setMessage(t('login.loginFailed', { error: error.message }));
      } else {
        if (onLogin) onLogin(data);
      }
    } catch (error) {
      setMessage(t('login.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.username || formData.username.length !== 6) {
      setMessage(t('login.fillRequiredFields'));
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.name || null,
            username: formData.username
          }
        }
      });

      if (error) {
        setMessage(t('login.registrationFailed', { error: error.message }));
      } else {
        if (onRegister) onRegister(data);
      }
    } catch (error) {
      setMessage(t('login.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundImage = () => {
    if (!supabase) return null
    
    const { data: { publicUrl } } = supabase.storage
      .from('tarot-cards')
      .getPublicUrl('BackgroundLogin.png')
    
    return publicUrl
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: getBackgroundImage() ? `url(${getBackgroundImage()})` : 'linear-gradient(135deg, #fef7ed, #fed7aa)',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#fef7ed',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        padding: '3rem 2rem',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center'
      }}>

        <div style={{ display: 'flex', marginBottom: '2rem', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'login' ? 'rgba(210, 105, 30, 0.8)' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === 'login' ? 'white' : 'rgba(139, 69, 19, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            {dualText('login.signIn')}
          </button>
          <button
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === 'register' ? 'rgba(210, 105, 30, 0.8)' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === 'register' ? 'white' : 'rgba(139, 69, 19, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            {dualText('login.signUp')}
          </button>
        </div>

        {message && message.includes('failed') && (
          <div style={{
            padding: '1rem',
            borderRadius: '15px',
            marginBottom: '1rem',
            backgroundColor: 'rgba(248, 215, 218, 0.9)',
            color: '#721c24',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        {/* Forgot Password Tab */}
        {activeTab === 'forgot' && (
          <>
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#8b4513', margin: '0 0 0.5rem 0' }}>
                {dualText('login.resetPassword')}
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#8b4513', margin: 0 }}>
                {dualText('login.resetPasswordInstructions')}
              </p>
            </div>

            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={dualTextPlain('login.enterEmail')}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)'
              }}
            />

            <button 
              onClick={handleForgotPassword}
              disabled={loading || !supabase || !formData.email}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'rgba(210, 105, 30, 0.8)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
                opacity: (loading || !supabase || !formData.email) ? 0.5 : 1,
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                marginBottom: '1rem'
              }}
            >
              {loading ? dualText('login.sending') : dualText('login.sendResetLink')}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#d2691e',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              ← {dualText('login.backToLogin')}
            </button>
          </>
        )}

        {/* Login Tab */}
        {activeTab === 'login' && (
          <>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={dualTextPlain('login.email')}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)'
              }}
            />

            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={dualTextPlain('login.password')}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                marginBottom: '0.5rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)'
              }}
            />

            {/* Forgot Password Link */}
            <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setActiveTab('forgot')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#d2691e',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                {dualText('login.forgotPassword')}
              </button>
            </div>

            <button 
              onClick={handleLogin}
              disabled={loading || !supabase}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'rgba(210, 105, 30, 0.8)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
                opacity: (loading || !supabase) ? 0.5 : 1,
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? dualText('login.loading') : dualText('login.signIn')}
            </button>
          </>
        )}

        {/* Register Tab */}
        {activeTab === 'register' && (
          <>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={dualTextPlain('login.email')}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)'
              }}
            />

            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={dualTextPlain('login.password')}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)'
              }}
            />

            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={dualTextPlain('login.displayNameOptional')}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.1)'
              }}
            />
            
            {/* Username Component */}
            <UsernameInput 
              username={formData.username || ''}
              onUsernameChange={(newUsername) => setFormData({ ...formData, username: newUsername })}
            />

            <button 
              onClick={handleRegister}
              disabled={loading || !supabase || (!formData.username || formData.username.length !== 6)}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'rgba(210, 105, 30, 0.8)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem',
                opacity: (loading || !supabase || (!formData.username || formData.username.length !== 6)) ? 0.5 : 1,
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? dualText('login.loading') : dualText('login.signUp')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default LoginForm
