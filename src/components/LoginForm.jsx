import React from 'react'

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

function LoginForm({ 
  activeTab, 
  setActiveTab, 
  formData, 
  setFormData, 
  message, 
  loading, 
  supabase, 
  onLogin, 
  onRegister 
}) {
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
            backgroundColor: message.includes('successful') ? '#d4edda' : 
                           message.includes('failed') ? '#f8d7da' : '#fff3cd',
            color: message.includes('successful') ? '#155724' : 
                   message.includes('failed') ? '#721c24' : '#856404',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

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

        {activeTab === 'register' && (
          <>
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
            
            {/* New Username Component */}
            <UsernameInput 
              username={formData.username || ''}
              onUsernameChange={(newUsername) => setFormData({ ...formData, username: newUsername })}
            />
          </>
        )}

        <button 
          onClick={activeTab === 'login' ? onLogin : onRegister}
          disabled={loading || !supabase || (activeTab === 'register' && (!formData.username || formData.username.length !== 6))}
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
            opacity: (loading || !supabase || (activeTab === 'register' && (!formData.username || formData.username.length !== 6))) ? 0.5 : 1,
            boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)'
          }}
        >
          {loading ? 'Loading...' : (activeTab === 'login' ? 'Login' : 'Register')}
        </button>
      </div>
    </div>
  )
}

export default LoginForm
