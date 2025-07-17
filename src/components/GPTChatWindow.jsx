// 1. ADD THIS IMPORT at the top with your other imports (around line 10)
import GPTChatWindow from './components/GPTChatWindow'

// 2. ADD THIS STATE with your other UI state (around line 23)
const [showGPTChat, setShowGPTChat] = useState(false)

// 3. ADD THIS FUNCTION with your other handlers (around line 550)
const toggleGPTChat = () => {
  setShowGPTChat(prev => !prev)
}

// 4. UPDATE your handleLogout function (around line 500) - ADD the line marked with // ADD THIS
const handleLogout = async () => {
  if (supabase?.notificationSubscription) {
    supabase.notificationSubscription.unsubscribe()
  }
  
  if (supabase) {
    await supabase.auth.signOut()
  }
  setUser(null)
  setProfile(null)
  setAllProfiles([])
  setNotifications([])
  setShowSettings(false)
  setShowSendForm(null)
  setShowReleaseForm(null)
  setShowSendMeritsForm(false)
  setShowNotifications(false)
  setShowManifesto(false)
  setShowCupGame(false)
  setShowGPTChat(false) // ADD THIS LINE
  setMessage('')
  setFormData({ email: '', password: '', username: '', name: '' })
  setTransferData({ recipient: '', amount: '' })
  setReleaseData({ amount: '', reason: '' })
}

// 5. UPDATE ALL YOUR RETURN STATEMENTS - Add the GPTChatWindow component to each view

// For the SendMeritsForm view (around line 610):
if (user && showSendMeritsForm && isAdmin) {
  return (
    <>
      <SendMeritsForm
        onBack={() => setShowSendMeritsForm(false)}
        message={message}
        supabase={supabase}
        user={user}
        allProfiles={allProfiles}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      <GPTChatWindow 
        isOpen={showGPTChat} 
        onToggle={toggleGPTChat} 
        profile={profile} 
      />
    </>
  )
}

// For the TarotCupsPage view (around line 630):
if (user && showCupGame) {
  return (
    <>
      <TarotCupsPage
        profile={profile}
        onBack={() => setShowCupGame(false)}
        supabase={supabase}
        user={user}
        onProfileUpdate={(updatedProfile) => {
          setProfile(updatedProfile)
          syncCupsFromPalomas(user.id)
        }}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      <GPTChatWindow 
        isOpen={showGPTChat} 
        onToggle={toggleGPTChat} 
        profile={profile} 
      />
    </>
  )
}

// For the NotificationsFeed view (around line 650):
if (user && showNotifications && isAdmin) {
  return (
    <>
      <NotificationsFeed
        onBack={() => setShowNotifications(false)}
        notifications={notifications}
        onRefresh={() => loadNotifications()}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      <GPTChatWindow 
        isOpen={showGPTChat} 
        onToggle={toggleGPTChat} 
        profile={profile} 
      />
    </>
  )
}

// For the SendForm view (around line 670):
if (user && showSendForm) {
  return (
    <>
      <SendForm
        tokenType={showSendForm}
        onBack={() => setShowSendForm(null)}
        message={message}
        transferData={transferData}
        setTransferData={setTransferData}
        isTransferring={isTransferring}
        onSend={handleAdminTransfer}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      <GPTChatWindow 
        isOpen={showGPTChat} 
        onToggle={toggleGPTChat} 
        profile={profile} 
      />
    </>
  )
}

// For the ReleaseForm view (around line 690):
if (user && showReleaseForm) {
  return (
    <>
      <ReleaseForm
        tokenType={showReleaseForm}
        onBack={() => setShowReleaseForm(null)}
        message={message}
        releaseData={releaseData}
        setReleaseData={setReleaseData}
        isReleasing={isReleasing}
        onRelease={handleRelease}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      <GPTChatWindow 
        isOpen={showGPTChat} 
        onToggle={toggleGPTChat} 
        profile={profile} 
      />
    </>
  )
}

// For the main Dashboard view (around line 720):
if (user) {
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
        onWalletSave={handleWalletSave}
        onLogout={handleLogout}
        onProfileUpdate={setProfile}
        message={message}
        onShowSendMeritsForm={() => setShowSendMeritsForm(true)}
        onShowSendForm={setShowSendForm}
        onShowReleaseForm={setShowReleaseForm}
      />
      <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
      {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
      <GPTChatWindow 
        isOpen={showGPTChat} 
        onToggle={toggleGPTChat} 
        profile={profile} 
      />
    </>
  )
}

// For the LoginForm view (at the very end, around line 750):
return (
  <>
    <LoginForm
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      formData={formData}
      setFormData={setFormData}
      message={message}
      loading={loading}
      supabase={supabase}
      onLogin={handleLogin}
      onRegister={handleRegister}
    />
    <FloatingGrailButton onGrailClick={() => setShowManifesto(true)} />
    {showManifesto && <ManifestoPopup onClose={() => setShowManifesto(false)} />}
    {/* Optional: Add chat to login page too */}
    {user && (
      <GPTChatWindow 
        isOpen={showGPTChat} 
        onToggle={toggleGPTChat} 
        profile={profile} 
      />
    )}
  </>
)
