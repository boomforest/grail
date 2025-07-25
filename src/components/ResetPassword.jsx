import React, { useState, useEffect } from 'react';

function ResetPassword({ supabase, onPasswordReset }) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Extract tokens from URL and validate session
  useEffect(() => {
    const checkResetSession = async () => {
      if (!supabase) {
        setMessage('Connection not available. Please try again later.');
        setIsCheckingSession(false);
        return;
      }

      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        // Check if this is a password recovery link
        if (type !== 'recovery' || !accessToken || !refreshToken) {
          setMessage('Invalid or expired reset link. Please request a new password reset.');
          setIsCheckingSession(false);
          return;
        }

        // Set the session with the tokens from the email link
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          setMessage('Invalid or expired reset link. Please request a new password reset.');
        } else if (data.session) {
          setIsValidSession(true);
          setMessage('You can now set your new password.');
        }
      } catch (error) {
        setMessage('An error occurred while validating your reset link.');
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkResetSession();
  }, [supabase]);

  // Password validation
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      errors: [
        ...(password.length < minLength ? [`At least ${minLength} characters`] : []),
        ...(!hasUpperCase ? ['One uppercase letter'] : []),
        ...(!hasLowerCase ? ['One lowercase letter'] : []),
        ...(!hasNumbers ? ['One number'] : [])
      ]
    };
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    const { password, confirmPassword } = formData;
    
    // Basic validation
    if (!password || !confirmPassword) {
      setMessage('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    // Password strength validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setMessage(`Password must have: ${passwordValidation.errors.join(', ')}`);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setMessage(`Password update failed: ${error.message}`);
      } else {
        setMessage('Password updated successfully! Redirecting to login...');
        
        // Optional: Sign out the user after password reset
        await supabase.auth.signOut();
        
        // Call the callback if provided, or redirect after 2 seconds
        if (onPasswordReset) {
          setTimeout(() => {
            onPasswordReset();
          }, 2000);
        } else {
          // Fallback: redirect to home page
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (onPasswordReset) {
      onPasswordReset();
    } else {
      window.location.href = '/';
    }
  };

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5dc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '25px',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0',
            color: '#d2691e'
          }}>
            GRAIL
          </h1>
          <p style={{ color: '#8b4513', margin: '0 0 2rem 0' }}>Token Exchange</p>
          <p style={{ color: '#8b4513' }}>Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5dc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '25px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          margin: '0 0 0.5rem 0',
          color: '#d2691e'
        }}>
          GRAIL
        </h1>
        <p style={{ color: '#8b4513', margin: '0 0 2rem 0' }}>Token Exchange</p>

        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#8b4513', margin: '0 0 0.5rem 0' }}>
            Set New Password
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#8b4513', margin: 0 }}>
            Choose a strong password for your account.
          </p>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '15px',
            marginBottom: '1rem',
            backgroundColor: message.includes('successfully') ? '#d4edda' : 
                           message.includes('failed') || message.includes('Invalid') || message.includes('error') ? '#f8d7da' : '#fff3cd',
            color: message.includes('successfully') ? '#155724' : 
                   message.includes('failed') || message.includes('Invalid') || message.includes('error') ? '#721c24' : '#856404',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        {isValidSession ? (
          <form onSubmit={handlePasswordReset}>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="New Password"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none'
              }}
            />

            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm New Password"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '15px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none'
              }}
            />

            <div style={{ 
              fontSize: '0.75rem', 
              color: '#8b4513', 
              marginBottom: '1rem',
              textAlign: 'left'
            }}>
              Password must have: 8+ characters, uppercase, lowercase, and number
            </div>

            <button 
              type="submit"
              disabled={loading || !formData.password || !formData.confirmPassword}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: (loading || !formData.password || !formData.confirmPassword) ? 0.5 : 1,
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                marginBottom: '1rem'
              }}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={handleBackToLogin}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(45deg, #d2691e, #cd853f)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)'
            }}
          >
            Back to Login
          </button>
        )}

        {isValidSession && (
          <button
            type="button"
            onClick={handleBackToLogin}
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
            ← Back to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
