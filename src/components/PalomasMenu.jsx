import { useLanguage } from '../contexts/LanguageContext'

function PalomasMenu({
  isAdmin,
  onPayPalClick,
  onShowSendLove,
  onClose,
  onShowSendDovesEggs
}) {
  const { t } = useLanguage()

  return (
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
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fef7ed, #fed7aa)',
        borderRadius: '25px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(210, 105, 30, 0.3)',
        border: '3px solid #d2691e',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#8b4513',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '1'}
          onMouseOut={(e) => e.target.style.opacity = '0.7'}
        >
          ×
        </button>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Get Button */}
          <button
            onClick={() => {
              onPayPalClick()
              onClose()
            }}
            style={{
              background: 'linear-gradient(135deg, #4682b4, #5f9ea0)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '1rem 1.5rem',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(70, 130, 180, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(70, 130, 180, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(70, 130, 180, 0.3)'
            }}
          >
            {t('palomasMenu.get')}
          </button>

          {/* Instant Send Button (Doves) */}
          <button
            onClick={() => {
              onShowSendDovesEggs('DOVES')
              onClose()
            }}
            style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              color: '#1976d2',
              border: '2px solid #2196f3',
              borderRadius: '15px',
              padding: '1rem 1.5rem',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🕊️</span>
            Instant
          </button>

          {/* Half Now Half Later Button (Eggs) */}
          <button
            onClick={() => {
              onShowSendDovesEggs('EGGS')
              onClose()
            }}
            style={{
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              color: '#f57c00',
              border: '2px solid #ff9800',
              borderRadius: '15px',
              padding: '1rem 1.5rem',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 152, 0, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(255, 152, 0, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(255, 152, 0, 0.3)'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🐣</span>
            Half now, half later
          </button>

          {/* Send Love Button - Admin Only */}
          {isAdmin && (
            <button
              onClick={() => {
                onShowSendLove()
                onClose()
              }}
              style={{
                background: 'linear-gradient(135deg, #e91e63, #f06292)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                padding: '1rem 1.5rem',
                fontSize: '1.2rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(233, 30, 99, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 15px rgba(233, 30, 99, 0.3)'
              }}
            >
              Send Love
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PalomasMenu