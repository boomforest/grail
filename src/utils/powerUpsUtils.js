/**
 * Power-Ups utility functions
 * CRUD operations and image handling for the Store feature
 */

/**
 * List power-ups by category
 * @param {object} supabase - Supabase client
 * @param {string} category - 'studios', 'pros', or 'health'
 * @returns {Promise<Array>} List of power-ups
 */
export async function listPowerUps(supabase, category = null) {
  try {
    let query = supabase
      .from('power_ups')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error listing power-ups:', error)
    throw error
  }
}

/**
 * List ALL power-ups (admin view, includes inactive)
 * @param {object} supabase - Supabase client
 * @returns {Promise<Array>} List of all power-ups
 */
export async function listAllPowerUps(supabase) {
  try {
    const { data, error } = await supabase
      .from('power_ups')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error listing all power-ups:', error)
    throw error
  }
}

/**
 * Create a new power-up
 * @param {object} supabase - Supabase client
 * @param {object} powerUpData - Power-up data
 * @returns {Promise<object>} Created power-up
 */
export async function createPowerUp(supabase, powerUpData) {
  try {
    const { data, error } = await supabase
      .from('power_ups')
      .insert([{
        category: powerUpData.category,
        title: powerUpData.title,
        description: powerUpData.description,
        title_es: powerUpData.title_es || null,
        description_es: powerUpData.description_es || null,
        price_doves: powerUpData.price_doves,
        image_path: powerUpData.image_path || null,
        is_active: powerUpData.is_active !== undefined ? powerUpData.is_active : true,
        sort_order: powerUpData.sort_order || 0,
        created_by: powerUpData.created_by || null
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating power-up:', error)
    throw error
  }
}

/**
 * Update an existing power-up
 * @param {object} supabase - Supabase client
 * @param {string} id - Power-up ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated power-up
 */
export async function updatePowerUp(supabase, id, updates) {
  try {
    const { data, error } = await supabase
      .from('power_ups')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating power-up:', error)
    throw error
  }
}

/**
 * Delete a power-up
 * @param {object} supabase - Supabase client
 * @param {string} id - Power-up ID
 * @returns {Promise<void>}
 */
export async function deletePowerUp(supabase, id) {
  try {
    // First get the power-up to find its image
    const { data: powerUp } = await supabase
      .from('power_ups')
      .select('image_path')
      .eq('id', id)
      .single()

    // Delete the database record
    const { error } = await supabase
      .from('power_ups')
      .delete()
      .eq('id', id)

    if (error) throw error

    // If there was an image, try to delete it from storage
    if (powerUp?.image_path) {
      await deletePowerUpImage(supabase, powerUp.image_path)
    }
  } catch (error) {
    console.error('Error deleting power-up:', error)
    throw error
  }
}

/**
 * Upload a power-up image to storage
 * @param {object} supabase - Supabase client
 * @param {string} powerUpId - Power-up ID
 * @param {File} file - Image file
 * @returns {Promise<string>} Image path
 */
export async function uploadPowerUpImage(supabase, powerUpId, file) {
  try {
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const filePath = `${powerUpId}/${timestamp}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('power-ups')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    return filePath
  } catch (error) {
    console.error('Error uploading power-up image:', error)
    throw error
  }
}

/**
 * Delete a power-up image from storage
 * @param {object} supabase - Supabase client
 * @param {string} imagePath - Image path in storage
 * @returns {Promise<void>}
 */
export async function deletePowerUpImage(supabase, imagePath) {
  try {
    const { error } = await supabase.storage
      .from('power-ups')
      .remove([imagePath])

    if (error) {
      console.error('Error deleting image (non-fatal):', error)
      // Don't throw - image deletion is not critical
    }
  } catch (error) {
    console.error('Error deleting power-up image:', error)
    // Don't throw - image deletion is not critical
  }
}

/**
 * Get public URL for a power-up image
 * @param {object} supabase - Supabase client
 * @param {string} imagePath - Image path in storage
 * @returns {string} Public URL
 */
export function getPowerUpImageUrl(supabase, imagePath) {
  if (!imagePath) return null

  const { data } = supabase.storage
    .from('power-ups')
    .getPublicUrl(imagePath)

  return data?.publicUrl || null
}

/**
 * Validate description length (max 250 words)
 * @param {string} description - Description text
 * @returns {object} { valid: boolean, wordCount: number }
 */
export function validateDescription(description) {
  const words = description.trim().split(/\s+/)
  const wordCount = words.length
  return {
    valid: wordCount <= 250,
    wordCount
  }
}
