// Transaction utility functions for the unified transaction system

// Get user's current cup level name
export const getTarotCardName = (level, username = '') => {
  // Special case for JPR333 - Knight of the Grail
  if (username === 'JPR333' || username === 'jpr333') {
    return 'Knight of the Grail'
  }
  
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
  
  if (level <= 14) return swordCards[level - 1]
  if (level <= 26) return cupCards[level - 15]
  return 'Knight of Cups'
}

// Calculate progressive cash-out tax rate based on cup level
export const getCashOutTaxRate = (tarotLevel, username = '') => {
  // Special case for JPR333 - minimum tax rate
  if (username === 'JPR333' || username === 'jpr333') {
    return 0.05 // 5% tax rate for admin
  }
  
  // Starting tax rate: 20%
  // Target tax rate at Page of Cups (level 25): 7%
  // Progressive reduction: each cup level reduces tax by ~1.08%
  
  const startingTax = 0.20 // 20%
  const minimumTax = 0.07 // 7%
  
  // Only cup levels (15+) get tax reduction
  if (tarotLevel < 15) {
    return startingTax
  }
  
  // Calculate reduction: 13% spread across 10 levels (15-25)
  const cupLevel = tarotLevel - 14 // Cup levels start at 1
  const taxReduction = (cupLevel - 1) * 0.013 // 1.3% per level
  const currentTax = Math.max(minimumTax, startingTax - taxReduction)
  
  return currentTax
}

// Create a new transaction record
export const createTransaction = async (supabase, transactionData) => {
  const {
    user_id,
    username,
    transaction_type,
    paloma_amount = 0,
    love_amount = 0,
    recipient_id = null,
    recipient_username = null,
    tax_rate = null,
    user_cup_level = null,
    description = ''
  } = transactionData

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id,
        username,
        transaction_type,
        paloma_amount,
        love_amount,
        recipient_id,
        recipient_username,
        tax_rate,
        user_cup_level,
        description,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) {
      console.error('Error creating transaction:', error)
      return { success: false, error }
    }

    return { success: true, data: data[0] }
  } catch (err) {
    console.error('Transaction creation failed:', err)
    return { success: false, error: err }
  }
}

// Process 33% Love bonus for Paloma donations to admin account
export const processLoveBonus = async (supabase, donorProfile, palomaAmount, adminUserId) => {
  const loveBonus = Math.floor(palomaAmount * 0.33)
  
  if (loveBonus > 0) {
    try {
      // Update donor's Love balance
      const newLovBalance = (donorProfile.lov_balance || 0) + loveBonus
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ lov_balance: newLovBalance })
        .eq('id', donorProfile.id)

      if (updateError) {
        console.error('Error updating Love balance:', updateError)
        return { success: false, error: updateError }
      }

      // Create Love bonus transaction
      const bonusTransaction = await createTransaction(supabase, {
        user_id: donorProfile.id,
        username: donorProfile.username,
        transaction_type: 'love_bonus',
        love_amount: loveBonus,
        description: `33% Love bonus for ${palomaAmount} Paloma donation`,
        user_cup_level: getTarotCardName(donorProfile.tarot_level || 1, donorProfile.username)
      })

      return { success: true, loveBonus, transaction: bonusTransaction.data }
    } catch (err) {
      console.error('Love bonus processing failed:', err)
      return { success: false, error: err }
    }
  }
  
  return { success: true, loveBonus: 0 }
}

// Calculate cash-out amount after tax
export const calculateCashOut = (palomaAmount, tarotLevel, username = '') => {
  const taxRate = getCashOutTaxRate(tarotLevel, username)
  const taxAmount = palomaAmount * taxRate
  const cashAmount = palomaAmount - taxAmount
  
  return {
    taxRate,
    taxAmount: Math.floor(taxAmount),
    cashAmount: Math.floor(cashAmount),
    payoutPercentage: (1 - taxRate) * 100
  }
}