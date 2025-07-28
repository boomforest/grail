import React, { useState, useEffect } from 'react'

const AdminGiftClaims = ({ supabase, onBack }) => {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClaims()
  }, [])

  const loadClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('casa_gift_claims')
        .select('*')
        .order('claim_time', { ascending: false })
        .limit(50)

      if (error) throw error
      setClaims(data || [])
    } catch (error) {
      console.error('Error loading claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateClaimStatus = async (claimId, newStatus) => {
    try {
      const { error } = await supabase
        .from('casa_gift_claims')
        .update({ status: newStatus })
        .eq('id', claimId)

      if (error) throw error
      
      await loadClaims()
    } catch (error) {
      console.error('Error updating claim:', error)
    }
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading claims...</div>

  return (
    <div style={{ padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>🎁 Gift Claims</h2>
        <button onClick={loadClaims} style={{ padding: '8px 16px', borderRadius: '8px', background: '#7c3aed', color: 'white', border: 'none' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {claims.map(claim => (
          <div key={claim.id} style={{
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>{claim.gift_name}</strong> - {claim.username}
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                🪙 {claim.palomas_burned} Palomas • {new Date(claim.claim_time).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                background: claim.status === 'claimed' ? '#fef3c7' : claim.status === 'prepared' ? '#dbeafe' : '#dcfce7',
                color: claim.status === 'claimed' ? '#92400e' : claim.status === 'prepared' ? '#1e40af' : '#166534'
              }}>
                {claim.status}
              </span>
              {claim.status === 'claimed' && (
                <button onClick={() => updateClaimStatus(claim.id, 'prepared')} style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', background: '#dbeafe', border: 'none' }}>
                  Mark Prepared
                </button>
              )}
              {claim.status === 'prepared' && (
                <button onClick={() => updateClaimStatus(claim.id, 'fulfilled')} style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', background: '#dcfce7', border: 'none' }}>
                  Mark Fulfilled
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {claims.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No gift claims yet!
        </div>
      )}
    </div>
  )
}

export default AdminGiftClaims
