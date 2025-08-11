import React, { useState } from 'react'

function WalletInput({ onWalletSave, currentWallet }) {
  const [walletAddress, setWalletAddress] = useState(currentWallet || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    onWalletSave(walletAddress.trim() || null)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setWalletAddress(currentWallet || '')
    setIsEditing(false)
  }

  const formatWalletAddress = (address) => {
    if (!address) return 'No wallet connected'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isEditing) {
    return (
      <div style={{
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
              Wallet Address
            </div>
            <div style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
              {formatWalletAddress(currentWallet)}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              background: 'none',
              border: '1px solid #d2691e',
              borderRadius: '5px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              color: '#d2691e'
            }}
          >
            {currentWallet ? 'Edit' : 'Add'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      marginBottom: '1rem',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px'
    }}>
      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
        Wallet Address
      </div>
      <input
        type="text"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder="Enter wallet address..."
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #ddd',
          borderRadius: '5px',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          marginBottom: '0.5rem',
          boxSizing: 'border-box'
        }}
      />
      <div style={{
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: '#d2691e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default WalletInput
