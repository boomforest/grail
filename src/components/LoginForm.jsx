import React, { useState } from 'react'

// Username component with two separate fields
function UsernameInput({ username, onUsernameChange }) {
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
          Your username will be: <span style={{ 
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
            3 Letters
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
              border: '2px solid #e0e0e0',
              borderRadius: '15px',
              boxSizing: 'border-box',
              fontSize: '1.2rem',
              outline: 'none',
              textAlign: 'center',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              backgroundColor: letters.length === 3 ? '#f0f8f0' : 'white'
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
            3 Numbers
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
              border: '2px solid #e0e0e0',
              borderRadius: '15px',
              boxSizing: 'border-box',
              fontSize: '1.2rem',
              outline: 'none',
              textAlign: 'center',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              backgroundColor: numbers.length === 3 ? '#f0f8f0' : 'white'
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
        ✓ Letters only (A-Z) • ✓ Numbers only (0-9) • ✓ Exactly 3 of each
      </div>
    </div>
  );
}

function LoginForm({ supabase, onLogin, onRegister }) {
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
      setMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);

      if (error) {
        setMessage(`Reset failed: ${error.message}`);
      } else {
        setMessage('Password reset email sent! Check your inbox.');
        // Switch back to login tab after successful email send
        setTimeout(() => {
          setActiveTab('login');
        }, 2000);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setMessage('Please fill in all fields.');
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
        setMessage(`Login failed: ${error.message}`);
      } else {
        setMessage('Login successful!');
        if (onLogin) onLogin(data);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.username || formData.username.length !== 6) {
      setMessage('Please fill in all required fields and ensure username is 6 characters.');
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
        setMessage(`Registration failed: ${error.message}`);
      } else {
        setMessage('Registration successful! Please check your email to verify your account.');
        if (onRegister) onRegister(data);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

        <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: '20px', overflow: 'hidden' }}>
          <button
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: activeTab === 'login' ? '#d2691e' : '#f0f0f0',
              color: activeTab === 'login' ? 'white' : '#8b4513',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: activeTab === 'register' ? '#d2691e' : '#f0f0f0',
              color: activeTab === 'register' ? 'white' : '#8b4513',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Register
          </button>
        </div>

        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '15px',
            marginBottom: '1rem',
            backgroundColor: message.includes('successful') || message.includes('sent') ? '#d4edda' : 
                           message.includes('failed') ? '#f8d7da' : '#fff3cd',
            color: message.includes('successful') || message.includes('sent') ? '#155724' : 
                   message.includes('failed') ? '#721c24' : '#856404',
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
                Reset Password
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#8b4513', margin: 0 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email address"
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

            <button 
              onClick={handleForgotPassword}
              disabled={loading || !supabase || !formData.email}
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
                opacity: (loading || !supabase || !formData.email) ? 0.5 : 1,
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                marginBottom: '1rem'
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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
              ← Back to Login
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
              placeholder="Email"
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
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '15px',
                marginBottom: '0.5rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
                outline: 'none'
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
                Forgot Password?
              </button>
            </div>

            <button 
              onClick={handleLogin}
              disabled={loading || !supabase}
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
                opacity: (loading || !supabase) ? 0.5 : 1,
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)'
              }}
            >
              {loading ? 'Loading...' : 'Login'}
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
              placeholder="Email"
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
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
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
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Display Name (optional)"
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
                padding: '1rem',
                background: 'linear-gradient(45deg, #d2691e, #cd853f)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: (loading || !supabase || (!formData.username || formData.username.length !== 6)) ? 0.5 : 1,
                boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)'
              }}
            >
              {loading ? 'Loading...' : 'Register'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default LoginForm
