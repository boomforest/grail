import React from 'react'
import LoginForm from './LoginForm'
import ResetPassword from './ResetPassword'
import Dashboard from './Dashboard'
import SendForm from './SendForm'
import ReleaseForm from './ReleaseForm'
import SendMeritsForm from './SendMeritsForm'
import NotificationsFeed from './NotificationsFeed'
import TarotCupsPage from './cupgame'
import WelcomeModal from './WelcomeModal'
import PayPalButton from './PayPalButton'
import FloatingGrailButton from './FloatingGrailButton'
import ManifestoPopup from './ManifestoPopup'
import GPTChatWindow from './GPTChatWindow'

const ViewRouter = ({
  // Auth state
  user,
  profile,
  supabase,
  isAdmin,
  
  // UI state
  showSendForm,
  showReleaseForm,
  showSendMeritsForm,
  showNotifications,
  showSettings,
  showManifesto,
  showCupGame,
  showGPTChat,
  showPayPal,
  showResetPassword,
  showWelcome,
  
  // UI setters
  setShowSendForm,
  setShowReleaseForm,
  setShowSendMeritsForm,
  setShowNotifications,
  setShowSettings,
  setShowManifesto,
  setShowCupGame,
  setShowPayPal,
  setShowWelcome,
  
  // Data
  notifications,
  allProfiles,
  message,
  transferData,
  setTransferData,
  releaseData,
  setReleaseData,
  isTransferring,
  isReleasing,
  
  // Actions
  onLogin,
  onRegister,
  onPasswordReset,
  onLogout,
  onWalletSave,
  onProfileUpdate,
  onSend,
  onRelease,
  onPayPalSuccess,
  onPayPalError,
  syncCupsFromPalomas,
  loadNotifications,
  toggleGPTChat,
  closeWelcome,
  handlePayPalClick,
  handlePalomasTransfer,
  handleAdminTransfer
}) => {
  // Common components that appear in multiple views
  const renderCommonComponents = () => (
    <>
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      <GPTChatWindow 
        isOpen={showGPTChat} 
        onToggle={toggleGPTChat} 
        profile={profile} 
      />
    </>
  )

  // Reset Password View - Show this first if we're on a reset URL
  if (showResetPassword) {
    return (
      <>
        <ResetPassword
          supabase={supabase}
          onPasswordReset={onPasswordReset}
        />
        {renderCommonComponents()}
      </>
    )
  }

  // Not logged in - show login form
  if (!user) {
    return (
      <>
        <LoginForm
          supabase={supabase}
          onLogin={onLogin}
          onRegister={onRegister}
        />
        <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
        {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      </>
    )
  }

  // Welcome Modal - Show if user has 0 palomas and hasn't seen it
  if (showWelcome) {
    return (
      <>
        <WelcomeModal
          onClose={closeWelcome}
          onBuyPalomas={() => {
            closeWelcome()
            setShowPayPal(true)
          }}
        />
        <Dashboard
          profile={profile}
          user={user}
          supabase={supabase}
          isAdmin={isAdmin}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onShowNotifications={() => setShowNotifications(true)}
          onShowCupGame={() => {
            setShowCupGame(true)
            syncCupsFromPalomas(user.id)
          }}
          onWalletSave={onWalletSave}
          onLogout={onLogout}
          onProfileUpdate={onProfileUpdate}
          message={message}
          onShowSendMeritsForm={() => setShowSendMeritsForm(true)}
          onShowSendForm={setShowSendForm}
          onShowReleaseForm={setShowReleaseForm}
          onPayPalClick={handlePayPalClick}
        />
        {renderCommonComponents()}
      </>
    )
  }

  // PayPal Modal View
  if (showPayPal) {
    return (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowPayPal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ×
            </button>
            
            <PayPalButton
              user={user}
              profile={profile}
              syncCupsFromPalomas={syncCupsFromPalomas}
              onSuccess={onPayPalSuccess}
              onError={onPayPalError}
            />
          </div>
        </div>

        <Dashboard
          profile={profile}
          user={user}
          supabase={supabase}
          isAdmin={isAdmin}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onShowNotifications={() => setShowNotifications(true)}
          onShowCupGame={() => {
            setShowCupGame(true)
            syncCupsFromPalomas(user.id)
          }}
          onWalletSave={onWalletSave}
          onLogout={onLogout}
          onProfileUpdate={onProfileUpdate}
          message={message}
          onShowSendMeritsForm={() => setShowSendMeritsForm(true)}
          onShowSendForm={setShowSendForm}
          onShowReleaseForm={setShowReleaseForm}
          onPayPalClick={handlePayPalClick}
        />
        {renderCommonComponents()}
      </>
    )
  }

  // Send Merits Form (Admin only)
  if (showSendMeritsForm && isAdmin) {
    return (
      <>
        <SendMeritsForm
          onBack={() => setShowSendMeritsForm(false)}
          message={message}
          supabase={supabase}
          user={user}
          allProfiles={allProfiles}
        />
        {renderCommonComponents()}
      </>
    )
  }

  // Cup Game View
  if (showCupGame) {
    return (
      <>
        <TarotCupsPage
          profile={profile}
          onBack={() => setShowCupGame(false)}
          supabase={supabase}
          user={user}
          onProfileUpdate={(updatedProfile) => {
            onProfileUpdate(updatedProfile)
            syncCupsFromPalomas(user.id)
          }}
        />
        {renderCommonComponents()}
      </>
    )
  }

  // Notifications Feed (Admin only)
  if (showNotifications && isAdmin) {
    return (
      <>
        <NotificationsFeed
          onBack={() => setShowNotifications(false)}
          notifications={notifications}
          onRefresh={loadNotifications}
        />
        {renderCommonComponents()}
      </>
    )
  }

  // Send Form
  if (showSendForm) {
    return (
      <>
        <SendForm
          tokenType={showSendForm}
          onBack={() => setShowSendForm(null)}
          message={message}
          transferData={transferData}
          setTransferData={setTransferData}
          isTransferring={isTransferring}
          onSend={showSendForm === 'DOV' ? handlePalomasTransfer : handleAdminTransfer}
        />
        {renderCommonComponents()}
      </>
    )
  }

  // Release Form
  if (showReleaseForm) {
    return (
      <>
        <ReleaseForm
          tokenType={showReleaseForm}
          onBack={() => setShowReleaseForm(null)}
          message={message}
          releaseData={releaseData}
          setReleaseData={setReleaseData}
          isReleasing={isReleasing}
          onRelease={onRelease}
          user={user}
          profile={profile}
          supabase={supabase}
        />
        {renderCommonComponents()}
      </>
    )
  }

  // Default view - Dashboard
  return (
    <>
      <Dashboard
        profile={profile}
        user={user}
        supabase={supabase}
        isAdmin={isAdmin}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        onShowNotifications={() => setShowNotifications(true)}
        onShowCupGame={() => {
          setShowCupGame(true)
          syncCupsFromPalomas(user.id)
        }}
        onWalletSave={onWalletSave}
        onLogout={onLogout}
        onProfileUpdate={onProfileUpdate}
        message={message}
        onShowSendMeritsForm={() => setShowSendMeritsForm(true)}
        onShowSendForm={setShowSendForm}
        onShowReleaseForm={setShowReleaseForm}
        onPayPalClick={handlePayPalClick}
      />
      {renderCommonComponents()}
    </>
  )
}

export default ViewRouter