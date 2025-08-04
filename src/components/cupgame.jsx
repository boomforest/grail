import React, { useState, useEffect } from 'react'
import { Copy, Users, Gift, Star, Trophy, Crown } from 'lucide-react'

// Helper functions for tarot system
const getTarotCardName = (level) => {
  const swordCards = [
    'King of Swords', 'Queen of Swords', 'Knight of Swords', 'Page of Swords',
    'Ten of Swords', 'Nine of Swords', 'Eight of Swords', 'Seven of Swords',
    'Six of Swords', 'Five of Swords', 'Four of Swords', 'Three of Swords',
    'Two of Swords', 'Ace of Swords'
  ]
  const cupCards = [
    'Ace of Cups', 'Two of Cups', 'Three of Cups', 'Four of Cups',
    'Five of Cups', 'Six of Cups', 'Seven of Cups', 'Eight of Cups',
    'Nine of Cups', 'Ten of Cups', 'Page of Cups', 'Knight of Cups'
  ]
  
  if (level <= 14) return swordCards[level - 1]      // Levels 1-14
  if (level <= 26) return cupCards[level - 15]       // Levels 15-26
  return 'Knight of Cups' // Max level
}

const getCardImage = (level, supabaseInstance = null) => {
  // Map levels to your card naming convention
  const cardNames = {
    1: 'KingS.png',      // King of Swords
    2: 'QueenS.png',     // Queen of Swords  
    3: 'KnightS.png',    // Knight of Swords
    4: 'PageS.png',      // Page of Swords
    5: 'TenS.png',       // Ten of Swords
    6: 'NineS.png',      // Nine of Swords
    7: 'EightS.png',     // Eight of Swords
    8: 'SevenS.png',     // Seven of Swords
    9: 'SixS.png',       // Six of Swords
    10: 'FiveS.png',     // Five of Swords
    11: 'FourS.png',     // Four of Swords
    12: 'ThreeS.png',    // Three of Swords
    13: 'TwoS.png',      // Two of Swords
    14: 'AceS.png',      // Ace of Swords
    15: 'AceC.png',      // Ace of Cups
    16: 'TwoC.png',      // Two of Cups
    17: 'ThreeC.png',    // Three of Cups
    18: 'FourC.png',     // Four of Cups
    19: 'FiveC.png',     // Five of Cups
    20: 'SixC.png',      // Six of Cups
    21: 'SevenC.png',    // Seven of Cups
    22: 'EightC.png',    // Eight of Cups
    23: 'NineC.png',     // Nine of Cups
    24: 'TenC.png',      // Ten of Cups
    25: 'PageC.png',     // Page of Cups
    26: 'KnightC.png'    // Knight of Cups
  }
  
  if (!supabaseInstance) {
    // Fallback placeholder if Supabase not available
    return `https://via.placeholder.com/200x350/D2691E/FFFFFF?text=Level+${level}`
  }
  
  const cardName = cardNames[level] || 'KingS.png'
  
  const { data: { publicUrl } } = supabaseInstance.storage
    .from('tarot-cards')
    .getPublicUrl(cardName)
  
  return publicUrl
}

const getCardMeaning = (level) => {
  if (level <= 14) {
    // Swords - The Path of Shame and Recognition
    const meanings = [
      "The pinnacle of extractive success - wealth built on others' suffering, yet haunted by the knowledge of what it cost.",
      "Power wielded through manipulation and extraction, with growing awareness of the hollow victory.",
      "The warrior of a corrupted system, fighting battles that serve only to perpetuate harm.",
      "The student of extraction, learning to take without giving, yet sensing something is wrong.",
      "Ten wounds of realization - the full weight of participating in systems of harm.",
      "Nine sleepless nights, tortured by the knowledge of complicity in suffering.",
      "Eight chains of the system that binds both oppressor and oppressed.",
      "Seven stolen victories, each one leaving a deeper mark on the soul.",
      "Six crossings toward truth, beginning to see the damage done.",
      "Five defeats that teach - losses that crack open the hardened heart.",
      "Four meditations on harm - stillness that allows guilt to surface.",
      "Three heartbreaks of recognition - seeing clearly what you've become.",
      "Two choices before you - continue the harm or choose transformation.",
      "One moment of surrender - laying down the sword of extraction forever."
    ]
    return meanings[level - 1]
  } else {
    // Cups - The Path of Pride and Compassionate Transformation
    const meanings = [
      "First overflow of grace - the moment you choose to give rather than take.",
      "Two hearts connecting - learning that joy multiplies when shared.",
      "Three celebrations of community - finding family in fellow givers.",
      "Four offerings received - abundance flows to those who serve others.",
      "Five sources of renewal - discovering infinite wells of compassion.",
      "Six gifts freely given - the joy of generosity without expectation.",
      "Seven visions of possibility - seeing the world that could be.",
      "Eight depths of understanding - wisdom that comes from serving others.",
      "Nine fulfillments complete - the near-perfect satisfaction of a giving heart.",
      "Ten blessings overflowing - a life so full it cannot help but spill over.",
      "The student of love - humble in service, eager to learn compassion.",
      "The master of giving - one who has reversed the heart completely, finding pride in service to others."
    ]
    return meanings[level - 15]
  }
}

// Referral bonus calculator
const calculateReferralBonus = (referralLevel, currentUserLevel) => {
  // More bonus for referring higher level users
  const levelDifference = Math.max(0, referralLevel - currentUserLevel)
  const baseBonus = referralLevel >= 15 ? 10 : 5 // Cups worth more than Swords
  return baseBonus + (levelDifference * 2)
}

function TarotCupsPage({ profile, onBack, supabase, user, onProfileUpdate }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [allProfiles, setAllProfiles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showReferrals, setShowReferrals] = useState(false)
  const [currentTransformationCost, setCurrentTransformationCost] = useState(50)
  const [leaderboardData, setLeaderboardData] = useState({ tarotLeaders: [], cupLeaders: [] })
  const [referralData, setReferralData] = useState({ referred: [], referredBy: null, totalEarned: 0 })
  const [userReferralCode, setUserReferralCode] = useState('')
  const [showEraModal, setShowEraModal] = useState(null) // 'swords' or 'cups'

  // Generate user's referral code
  useEffect(() => {
    if (user?.id) {
      // Create a simple referral code from user ID
      setUserReferralCode(`CASA${user.id.slice(-6).toUpperCase()}`)
    }
  }, [user])

  // Check if user should see welcome window
  useEffect(() => {
    setShowWelcome((profile?.tarot_level || 1) === 1 && (profile?.merit_count || 0) === 0)
  }, [profile])

  // Load referral data
  const loadReferralData = async () => {
    if (!supabase || !user) return
    
    try {
      // Get users this person referred
      const { data: referredUsers, error: referredError } = await supabase
        .from('profiles')
        .select('id, username, tarot_level, created_at, referral_earnings')
        .eq('referred_by', user.id)
        .order('tarot_level', { ascending: false })

      if (referredError) throw referredError

      // Get who referred this user
      const { data: referrerData, error: referrerError } = await supabase
        .from('profiles')
        .select('username, tarot_level')
        .eq('id', profile?.referred_by)
        .single()

      // Calculate total earnings from referrals
      const totalEarned = (referredUsers || []).reduce((sum, user) => {
        return sum + (user.referral_earnings || 0)
      }, 0)

      setReferralData({
        referred: referredUsers || [],
        referredBy: referrerData || null,
        totalEarned
      })
    } catch (error) {
      console.error('Error loading referral data:', error)
    }
  }

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    const referralLink = `https://casadecopas.com/join?ref=${userReferralCode}`
    try {
      await navigator.clipboard.writeText(referralLink)
      setMessage('Referral link copied to clipboard! 📋')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setMessage('Failed to copy referral link')
    }
  }

  // Load current transformation cost
  useEffect(() => {
    const loadTransformationCost = async () => {
      if (!supabase || !profile) return
      
      try {
        const nextLevel = (profile.tarot_level || 1) + 1
        if (nextLevel > 26) {
          setCurrentTransformationCost(0)
          return
        }

        const isAceTransformation = (profile.tarot_level || 1) === 14 && nextLevel === 15
        
        const { data, error } = await supabase
          .from('tarot_transformations')
          .select('current_cost')
          .eq('card_level', nextLevel)
          .single()
        
        if (error) {
          const baseCost = isAceTransformation ? 500 : 50
          const { error: insertError } = await supabase
            .from('tarot_transformations')
            .insert([{ 
              card_level: nextLevel, 
              transformation_count: 0, 
              current_cost: baseCost 
            }])
          
          if (!insertError) {
            setCurrentTransformationCost(baseCost)
          }
        } else {
          setCurrentTransformationCost(data.current_cost)
        }
      } catch (error) {
        console.error('Error loading transformation cost:', error)
        const isAceTransformation = (profile.tarot_level || 1) === 14
        setCurrentTransformationCost(isAceTransformation ? 500 : 50)
      }
    }
    
    loadTransformationCost()
  }, [supabase, profile?.tarot_level])

  // Load all profiles for search
  useEffect(() => {
    const loadProfiles = async () => {
      if (!supabase) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, cup_count, tarot_level, merit_count, palomas_purchased')
          .order('username')
        
        if (error) throw error
        setAllProfiles(data || [])
      } catch (error) {
        console.error('Error loading profiles:', error)
      }
    }
    
    loadProfiles()
  }, [supabase])

  // Load leaderboard data
  const loadLeaderboard = async () => {
    if (!supabase) return
    
    try {
      const { data: tarotData, error: tarotError } = await supabase
        .from('profiles')
        .select('username, tarot_level, transformation_numbers, cup_count')
        .order('tarot_level', { ascending: false })
        .limit(10)
      
      if (tarotError) throw tarotError

      const { data: cupData, error: cupError } = await supabase
        .from('profiles')
        .select('username, cup_count, tarot_level')
        .order('cup_count', { ascending: false })
        .limit(10)
      
      if (cupError) throw cupError

      setLeaderboardData({
        tarotLeaders: tarotData || [],
        cupLeaders: cupData || []
      })
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  // Load leaderboard and referral data when showing respective modals
  useEffect(() => {
    if (showLeaderboard) loadLeaderboard()
  }, [showLeaderboard, supabase])

  useEffect(() => {
    if (showReferrals) loadReferralData()
  }, [showReferrals, supabase, user])

  // Calculate merit percentage
  const calculateMeritPercentage = () => {
    if (!profile || currentTransformationCost === 0) return 0
    
    const palomasNeeded = currentTransformationCost
    const palomasPurchased = profile.palomas_purchased || 0
    const percentage = Math.min((palomasPurchased / palomasNeeded) * 100, 100)
    
    return Math.round(percentage * 10) / 10
  }

  // Calculate merit circle states
  const getMeritCircleStates = () => {
    const totalPercentage = calculateMeritPercentage()
    
    const circles = []
    for (let i = 0; i < 3; i++) {
      const circleStartPercent = i * 33.33
      const circleEndPercent = (i + 1) * 33.33
      
      let circlePercent = 0
      if (totalPercentage > circleStartPercent) {
        circlePercent = Math.min(totalPercentage - circleStartPercent, 33.33)
      }
      
      circles.push({
        filled: circlePercent >= 33.33,
        percentage: Math.round((circlePercent / 33.33) * 100)
      })
    }
    
    return circles
  }

  // Search functionality
  const handleSearchChange = (value) => {
    setSearchTerm(value)
    
    if (value.length > 0) {
      const filtered = allProfiles.filter(profile => 
        profile.username.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }

  const selectUser = (profile) => {
    setSelectedUser(profile)
    setSearchTerm(profile.username)
    setSearchResults([])
  }

  // Award merit function with referral bonuses
  const awardMerit = async (userId, reason = 'Good community contribution') => {
    if (!supabase || !user) return

    try {
      setLoading(true)
      
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('merit_count, tarot_level, cup_count, username, palomas_purchased, transformation_numbers, referred_by')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      const nextLevel = (currentProfile.tarot_level || 1) + 1
      if (nextLevel > 26) {
        setMessage('This user has reached maximum level (Knight of Cups)!')
        return
      }

      const { data: transformData, error: transformError } = await supabase
        .from('tarot_transformations')
        .select('current_cost, transformation_count')
        .eq('card_level', nextLevel)
        .single()

      if (transformError) {
        const isAceTransformation = nextLevel === 15
        const baseCost = isAceTransformation ? 500 : 50
        
        const { data: newTransform, error: insertError } = await supabase
          .from('tarot_transformations')
          .insert([{ 
            card_level: nextLevel, 
            transformation_count: 0, 
            current_cost: baseCost 
          }])
          .select()
          .single()
        
        if (insertError) throw insertError
        transformData = newTransform
      }

      const requiredPalomas = transformData.current_cost
      const currentPalomas = currentProfile.palomas_purchased || 0
      const progressPercentage = (currentPalomas / requiredPalomas) * 100

      if (progressPercentage >= 100) {
        // Level up logic
        const newTransformationNumbers = {
          ...(currentProfile.transformation_numbers || {}),
          [nextLevel]: (transformData.transformation_count || 0) + 1
        }

        const { error: updateUserError } = await supabase
          .from('profiles')
          .update({
            tarot_level: nextLevel,
            palomas_purchased: currentPalomas - requiredPalomas,
            transformation_numbers: newTransformationNumbers,
            last_status_update: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateUserError) throw updateUserError

        const { error: updateTransformError } = await supabase
          .from('tarot_transformations')
          .update({ 
            transformation_count: (transformData.transformation_count || 0) + 1,
            current_cost: requiredPalomas + (nextLevel === 15 ? 10 : 1)
          })
          .eq('card_level', nextLevel)

        if (updateTransformError) throw updateTransformError

        // Referral bonus for level up
        if (currentProfile.referred_by) {
          const bonus = calculateReferralBonus(nextLevel, currentProfile.tarot_level || 1)
          
          const { error: bonusError } = await supabase
            .from('profiles')
            .update({
              referral_earnings: supabase.raw(`referral_earnings + ${bonus}`),
              total_palomas_collected: supabase.raw(`total_palomas_collected + ${bonus}`)
            })
            .eq('id', currentProfile.referred_by)

          if (!bonusError) {
            // Log referral bonus
            await supabase
              .from('referral_bonuses')
              .insert([{
                referrer_id: currentProfile.referred_by,
                referred_user_id: userId,
                bonus_amount: bonus,
                reason: `Level up to ${getTarotCardName(nextLevel)}`,
                level_achieved: nextLevel
              }])
          }
        }

        await supabase
          .from('merit_logs')
          .insert([{
            user_id: userId,
            awarded_by: user.id,
            reason: `Level up to ${getTarotCardName(nextLevel)}`,
            merit_count_after: 0,
            leveled_up: true,
            new_tarot_level: nextLevel
          }])

        if (userId === user.id && onProfileUpdate) {
          const updatedProfile = {
            ...profile,
            tarot_level: nextLevel,
            palomas_purchased: currentPalomas - requiredPalomas,
            transformation_numbers: newTransformationNumbers
          }
          onProfileUpdate(updatedProfile)
        }

        const recipientName = userId === user.id ? 'You' : currentProfile.username
        const transformationNumber = (transformData.transformation_count || 0) + 1
        setMessage(`🎉 ${recipientName} leveled up to ${getTarotCardName(nextLevel)} #${transformationNumber}!`)
      } else {
        // Just award merit
        const newMeritCount = (currentProfile.merit_count || 0) + 1

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            merit_count: newMeritCount,
            last_status_update: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) throw updateError

        await supabase
          .from('merit_logs')
          .insert([{
            user_id: userId,
            awarded_by: user.id,
            reason: reason,
            merit_count_after: newMeritCount,
            leveled_up: false,
            new_tarot_level: currentProfile.tarot_level || 1
          }])

        const recipientName = userId === user.id ? 'You' : currentProfile.username
        const progressNeeded = Math.max(0, 100 - progressPercentage)
        setMessage(`Merit awarded to ${recipientName}! 🌟 (${progressNeeded.toFixed(1)}% more progress needed)`)
      }

      if (userId !== user.id) {
        setSearchTerm('')
        setSelectedUser(null)
        setSearchResults([])
      }
      
    } catch (error) {
      console.error('Error awarding merit:', error)
      setMessage('Error awarding merit: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = profile?.username === 'JPR333' || user?.email === 'jproney@gmail.com'
  const meritCircles = getMeritCircleStates()
  const overallProgress = calculateMeritPercentage()
  const isMaxLevel = (profile?.tarot_level || 1) >= 26

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 font-sans p-4 text-amber-900 relative">
      {/* Era Modal */}
      {showEraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl p-8 max-w-lg w-full shadow-2xl border-2 relative ${
            showEraModal === 'swords' 
              ? 'bg-gradient-to-br from-gray-100 to-slate-200 border-gray-300' 
              : 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-200'
          }`}>
            <button
              onClick={() => setShowEraModal(null)}
              className="absolute top-4 right-4 text-2xl opacity-60 hover:opacity-100 p-2"
            >
              ×
            </button>

            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                showEraModal === 'swords'
                  ? 'bg-gray-600 text-white'
                  : 'bg-purple-500 text-white'
              }`}>
                {showEraModal === 'swords' ? '⚔️ Era of Swords' : '🏆 Era of Cups'}
              </div>
            </div>

            {showEraModal === 'swords' ? (
              <div className="space-y-4 text-gray-800">
                <div className="text-lg font-medium text-center">
                  "When Arthur pulled the sword from the stone..."
                </div>
                
                <div className="text-gray-700 italic leading-relaxed">
                  A dark era began where man used intellect to defend attacks and gain as much as possible. For centuries, no remedy existed for this endless cycle of extraction and pain.
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-300">
                  <p className="text-sm text-gray-600 italic text-center">
                    <strong>The age of taking.</strong> Sword-holders defend what they've seized, trapped in endless cycles of fear and accumulation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-purple-800">
                <div className="text-lg font-medium text-center">
                  "Learn the power of unclenching the sword and holding the cup."
                </div>
                
                <div className="text-purple-700 italic leading-relaxed">
                  The game of cups teaches the joy of giving for the sake of giving. Break free from the endless cycle. Entry grows more difficult as early participants become exponentially rare.
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-600 italic text-center">
                    <strong>The cup holders shape tomorrow.</strong> Position yourself while the path remains open.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referrals Modal */}
      {showReferrals && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-auto shadow-2xl border-2 border-orange-200">
            <button
              onClick={() => setShowReferrals(false)}
              className="absolute top-4 right-4 text-2xl text-amber-700 opacity-60 hover:opacity-100 p-2"
            >
              ×
            </button>

            <div className="text-center mb-6">
              <Users className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-orange-600 mb-2">Referral System</h2>
              <p className="text-amber-700 text-sm italic">Grow the Casa community and earn rewards</p>
            </div>

            {/* User's Referral Code */}
            <div className="bg-white bg-opacity-60 rounded-2xl p-4 mb-6 border border-orange-200">
              <h3 className="font-semibold text-amber-800 mb-2 text-center">Your Referral Code</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gradient-to-r from-orange-200 to-amber-200 rounded-lg p-3 text-center font-mono font-bold text-orange-700">
                  {userReferralCode}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-2 text-center italic">
                Share your code with friends to earn bonuses when they level up!
              </p>
            </div>

            {/* Referral Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-4 text-center border border-green-200">
                <Gift className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{referralData.referred.length}</div>
                <div className="text-sm text-green-600">Referred</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl p-4 text-center border border-yellow-200">
                <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-700">{referralData.totalEarned}</div>
                <div className="text-sm text-yellow-600">Palomas Earned</div>
              </div>
            </div>

            {/* Referred Users */}
            <div className="mb-6">
              <h4 className="font-semibold text-amber-800 mb-3">Users You've Referred</h4>
              {referralData.referred.length === 0 ? (
                <div className="text-center text-amber-600 italic py-4">
                  No referrals yet. Share your code to start earning!
                </div>
              ) : (
                <div className="space-y-2">
                  {referralData.referred.map((user) => (
                    <div key={user.id} className="bg-white bg-opacity-60 rounded-lg p-3 flex justify-between items-center border border-orange-200">
                      <div>
                        <div className="font-medium text-amber-800">{user.username}</div>
                        <div className="text-sm text-amber-600">{getTarotCardName(user.tarot_level || 1)}</div>
                      </div>
                      <div className="text-orange-600 font-semibold">
                        L{user.tarot_level || 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Who referred this user */}
            {referralData.referredBy && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Referred By</h4>
                <div className="text-blue-700">
                  <strong>{referralData.referredBy.username}</strong> • {getTarotCardName(referralData.referredBy.tarot_level || 1)}
                </div>
              </div>
            )}

            {/* Referral Rules */}
            <div className="mt-6 bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">Referral Rewards</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• 5+ Palomas for each Sword level-up</li>
                <li>• 10+ Palomas for each Cup level-up</li>
                <li>• Higher level achievements = bigger bonuses</li>
                <li>• Bonuses added to your total Paloma balance</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl border-2 border-orange-200">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="absolute top-4 right-4 text-2xl text-amber-700 opacity-60 hover:opacity-100 p-2"
            >
              ×
            </button>

            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-orange-600 mb-2">Casa de Copas Leaderboard</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tarot Hierarchy */}
              <div>
                <h3 className="text-xl font-bold text-amber-800 mb-3 text-center flex items-center justify-center gap-2">
                  🎴 Tarot Hierarchy
                </h3>
                <div className="text-sm text-amber-600 text-center mb-4 italic">Spiritual Leadership</div>
                
                {leaderboardData.tarotLeaders.map((player, index) => {
                  const transformationNumber = player.transformation_numbers?.[player.tarot_level] || '';
                  return (
                    <div
                      key={player.username}
                      className={`p-3 mb-2 rounded-xl border flex justify-between items-center ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-200 to-amber-200 border-yellow-300' :
                        index === 1 ? 'bg-gradient-to-r from-gray-200 to-slate-300 border-gray-300' :
                        index === 2 ? 'bg-gradient-to-r from-orange-200 to-red-200 border-orange-300' :
                        'bg-white bg-opacity-60 border-orange-200'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-amber-800">
                          {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`} {player.username}
                        </div>
                        <div className="text-sm text-amber-600">
                          {getTarotCardName(player.tarot_level || 1)}
                          {transformationNumber && ` #${transformationNumber}`}
                        </div>
                      </div>
                      <div className="text-orange-600 font-bold">L{player.tarot_level || 1}</div>
                    </div>
                  );
                })}
              </div>

              {/* Cup Leaders */}
              <div>
                <h3 className="text-xl font-bold text-amber-800 mb-3 text-center flex items-center justify-center gap-2">
                  🏆 Grail Keepers
                </h3>
                <div className="text-sm text-amber-600 text-center mb-4 italic">Commitment & Support</div>
                
                {leaderboardData.cupLeaders.map((player, index) => (
                  <div
                    key={player.username}
                    className={`p-3 mb-2 rounded-xl border flex justify-between items-center ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-200 to-amber-200 border-yellow-300' :
                      index === 1 ? 'bg-gradient-to-r from-gray-200 to-slate-300 border-gray-300' :
                      index === 2 ? 'bg-gradient-to-r from-orange-200 to-red-200 border-orange-300' :
                      'bg-white bg-opacity-60 border-orange-200'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-amber-800">
                        {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`} {player.username}
                      </div>
                      <div className="text-sm text-amber-600">
                        {getTarotCardName(player.tarot_level || 1)}
                      </div>
                    </div>
                    <div className="text-orange-600 font-bold">
                      {player.cup_count || 0} {(player.tarot_level || 1) >= 15 ? 'grails' : 'cups'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-orange-50 rounded-xl p-4 border border-orange-200 text-center">
              <p className="text-sm text-amber-700 italic">
                <strong>Tarot Hierarchy</strong> shows spiritual progression through the cards.
                <br />
                <strong>Grail Keepers</strong> shows ongoing commitment and support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-8 max-w-lg w-full shadow-2xl border-2 border-orange-200 text-center">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-2xl text-amber-700 opacity-60 hover:opacity-100 p-2"
            >
              ×
            </button>

            <Crown className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            
            <h2 className="text-2xl font-bold text-orange-600 mb-4 italic">
              Welcome to the Game of Cups
            </h2>

            <div className="text-left text-amber-800 space-y-4 mb-6">
              <p className="italic">
                <em>The game of belonging to Casa de Copas...</em>
              </p>
              
              <p className="italic">
                <em>Purchase Palomas to progress through your Tarot journey. Earn merits through community contributions and volunteering to unlock your next card transformation.</em>
              </p>
              
              <p className="italic">
                <em>Your journey: King of Swords → ... → Ace of Swords → Ace of Cups → ... → Knight of Cups (the ultimate achievement).</em>
              </p>
              
              <p className="italic">
                <em>The earlier you begin your journey, the more meaningful your contributions become to the House.</em>
              </p>
            </div>

            <button
              onClick={() => setShowWelcome(false)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Begin Your Journey
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="bg-orange-100 border border-orange-300 rounded-2xl px-6 py-3 text-orange-600 font-medium hover:bg-orange-200 transition-colors"
        >
          ← Back
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => setShowReferrals(true)}
            className="bg-orange-100 border border-orange-300 rounded-2xl px-6 py-3 text-orange-600 font-medium hover:bg-orange-200 transition-colors flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Referrals
          </button>
          
          <button
            onClick={() => setShowLeaderboard(true)}
            className="bg-orange-100 border border-orange-300 rounded-2xl px-6 py-3 text-orange-600 font-medium hover:bg-orange-200 transition-colors flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            Leaderboard
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto text-center">
        {/* Main Display - Card and Cost Side by Side */}
        <div className="flex flex-col lg:flex-row justify-center items-center gap-6 mb-8">
          {/* Tarot Card */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src={getCardImage(profile?.tarot_level || 1, supabase)}
                alt={getTarotCardName(profile?.tarot_level || 1)}
                className="w-32 h-48 lg:w-40 lg:h-60 rounded-xl shadow-lg border-2 border-orange-200 transform hover:scale-105 transition-transform duration-300"
                style={{
                  filter: 'drop-shadow(0 4px 15px rgba(139, 90, 60, 0.2))',
                  imageRendering: 'pixelated'
                }}
              />
              
              {/* Transformation number overlay */}
              {profile?.transformation_numbers && profile.transformation_numbers[profile.tarot_level] && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center font-bold text-xs shadow-lg">
                  #{profile.transformation_numbers[profile.tarot_level]}
                </div>
              )}
            </div>
            
            <h1 className="text-lg lg:text-2xl font-bold text-amber-800 mb-1 text-center">
              {getTarotCardName(profile?.tarot_level || 1)}
            </h1>
            <div className="text-sm lg:text-lg text-amber-600 mb-3 text-center">
              Level {profile?.tarot_level || 1} {isMaxLevel && '• COMPLETE'}
            </div>
            
            {/* Card Meaning */}
            <details className="bg-white bg-opacity-60 rounded-xl p-3 border border-orange-200 cursor-pointer w-full max-w-sm">
              <summary className="font-semibold text-orange-600 mb-2 text-sm">
                Card Meaning
              </summary>
              <p className="text-xs text-amber-700 italic leading-relaxed">
                {getCardMeaning(profile?.tarot_level || 1)}
              </p>
            </details>
          </div>

          {/* Next Transformation Cost */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-amber-600 font-medium text-sm text-center">
              Next Transformation
            </div>
            
            {isMaxLevel ? (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl p-4 text-center shadow-lg">
                <div className="text-xl mb-1">👑</div>
                <div className="font-bold text-sm">Journey Complete!</div>
                <div className="text-xs opacity-90">Knight of Cups Achieved</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-white bg-opacity-80 rounded-xl p-4 border-2 border-orange-200 shadow-lg">
                  <div className="text-xs text-amber-600 mb-1">Cost to reach</div>
                  <div className="text-sm font-bold text-amber-800 mb-1">
                    {getTarotCardName((profile?.tarot_level || 1) + 1)}
                  </div>
                  <div className="text-xl font-bold text-orange-600 mb-1">
                    {currentTransformationCost} 🕊️
                  </div>
                  <div className="text-xs text-amber-600">
                    Palomas needed
                  </div>
                </div>
                
                {overallProgress >= 100 && (
                  <div className="mt-2 bg-green-100 border-2 border-green-300 rounded-lg p-2">
                    <div className="text-green-700 font-bold text-xs">
                      ✅ Ready to Transform!
                    </div>
                    <div className="text-green-600 text-xs">
                      Visit Casa to complete
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Era Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setShowEraModal('swords')}
            className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
          >
            ⚔️ Era of Swords
          </button>
          
          <button
            onClick={() => setShowEraModal('cups')}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
          >
            🏆 Era of Cups
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 mb-6 rounded-2xl border-2 ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border-red-200' 
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <div className="bg-white bg-opacity-60 rounded-3xl p-6 border-2 border-orange-200">
            <h3 className="text-xl font-bold text-amber-800 mb-4">Admin Controls</h3>
            
            <div className="flex justify-center mb-4">
              <button
                onClick={() => awardMerit(user?.id)}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Award Merit to Self
              </button>
            </div>

            <div className="relative">
              <label className="block mb-2 text-amber-800 font-medium">Award Merit to User</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search username..."
                className="w-full p-3 rounded-2xl border-2 border-orange-200 bg-white text-amber-800 mb-4"
              />
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 border-orange-200 rounded-2xl mt-1 shadow-lg z-10">
                  {searchResults.map((profile, index) => (
                    <div
                      key={profile.id}
                      onClick={() => selectUser(profile)}
                      className="p-3 cursor-pointer hover:bg-orange-50 border-b border-orange-100 last:border-b-0"
                    >
                      <div className="font-medium text-amber-800">{profile.username}</div>
                      <div className="text-sm text-amber-600">
                        {profile.cup_count || 0} cups • {getTarotCardName(profile.tarot_level || 1)} • {profile.merit_count || 0} merits
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => selectedUser && awardMerit(selectedUser.id)}
                disabled={loading || !selectedUser}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                {loading ? 'Processing...' : 
                 selectedUser ? `Award Merit to ${selectedUser.username}` : 
                 'Select a user to award merit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TarotCupsPage
