// netlify/functions/review-submission.js
// Artist Submission Recipient Agent
// Triggered by Supabase database webhook on INSERT to artist_applications
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Verify webhook secret
    const webhookSecret = process.env.WEBHOOK_SECRET
    const incomingSecret = event.headers['x-webhook-secret']

    if (!webhookSecret || incomingSecret !== webhookSecret) {
      console.error('Webhook secret mismatch')
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }

    // Parse the payload
    const payload = JSON.parse(event.body)
    const record = payload.record

    if (!record || !record.id) {
      console.error('No record found in webhook payload')
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid payload' })
      }
    }

    console.log(`Reviewing artist submission: ${record.id} - ${record.artist_name}`)

    // Initialize Supabase with service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Check field completeness
    const completeness = {
      has_artist_name: !!record.artist_name && record.artist_name.trim().length > 0,
      has_country: !!record.country && record.country.trim().length > 0,
      has_track: !!record.track_url,
      confirmed_18plus: !!record.confirmed_18plus,
      accepted_terms: !!record.accepted_terms_at,
      has_photo: !!record.artist_photo_url
    }

    const fieldsFilled = Object.values(completeness).filter(Boolean).length
    const totalFields = Object.values(completeness).length
    const completenessScore = fieldsFilled / totalFields

    // Call Claude API for intelligent review
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      console.error('ANTHROPIC_API_KEY not configured, using fallback')
      const fallbackRating = completenessScore >= 0.8 ? 4
        : completenessScore >= 0.6 ? 3
        : completenessScore >= 0.4 ? 2 : 1

      await updateSubmissionAndNotify(supabase, record, fallbackRating,
        `Auto-review (AI unavailable): ${fieldsFilled}/${totalFields} fields complete.`)

      return { statusCode: 200, body: JSON.stringify({ success: true, fallback: true }) }
    }

    const reviewPrompt = `You are an intake reviewer for Casa de Copas, a nonprofit artist sanctuary in Mexico City that supports Mexican and Latin American musicians. Review this artist submission and provide:

1. A rating from 1-5 stars based on completeness and quality signals
2. A brief review summary (2-3 sentences) for the admin

Submission data:
- Artist Name: ${record.artist_name || 'NOT PROVIDED'}
- Country: ${record.country || 'NOT PROVIDED'}
- Track Uploaded: ${record.track_url ? 'Yes' : 'No'}
- Track File: ${record.track_url ? decodeURIComponent(record.track_url.split('/').pop().split('?')[0]) : 'None'}
- Artist Photo: ${record.artist_photo_url ? 'Yes' : 'No'}
- Confirmed 18+: ${record.confirmed_18plus ? 'Yes' : 'No'}
- Accepted Terms: ${record.accepted_terms_at ? 'Yes' : 'No'}
- Completeness: ${fieldsFilled}/${totalFields} fields filled

Rating guidelines:
- 5 stars: All fields complete, track uploaded, from target region (Latin America)
- 4 stars: All required fields complete, track uploaded
- 3 stars: Most fields complete, may be missing track or photo
- 2 stars: Significant fields missing
- 1 star: Minimal information provided

Return ONLY a JSON object with these exact fields:
{
  "rating": <number 1-5>,
  "summary": "<2-3 sentence review for the admin>"
}`

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        messages: [{ role: 'user', content: reviewPrompt }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', errorText)
      // Fallback to rule-based rating
      const fallbackRating = completenessScore >= 0.8 ? 4
        : completenessScore >= 0.6 ? 3
        : completenessScore >= 0.4 ? 2 : 1

      await updateSubmissionAndNotify(supabase, record, fallbackRating,
        `Auto-review (AI error): ${fieldsFilled}/${totalFields} fields complete. ${record.artist_name || 'Unknown'} from ${record.country || 'Unknown'}.`)

      return { statusCode: 200, body: JSON.stringify({ success: true, fallback: true }) }
    }

    const claudeData = await claudeResponse.json()
    const responseText = claudeData.content[0]?.text || ''

    // Parse Claude's JSON response
    let reviewResult
    try {
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      reviewResult = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText)
      reviewResult = {
        rating: completenessScore >= 0.8 ? 4 : 3,
        summary: `Submission from ${record.artist_name || 'Unknown'} (${record.country || 'Unknown'}). ${fieldsFilled}/${totalFields} fields complete.`
      }
    }

    // Clamp rating to 1-5
    const rating = Math.max(1, Math.min(5, parseInt(reviewResult.rating) || 3))

    await updateSubmissionAndNotify(supabase, record, rating, reviewResult.summary)

    console.log(`Review complete for ${record.artist_name}: ${rating}/5 stars`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        submission_id: record.id,
        agent_rating: rating
      })
    }

  } catch (error) {
    console.error('Review submission error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    }
  }
}

async function updateSubmissionAndNotify(supabase, record, rating, summary) {
  // Update artist_applications with agent review
  const { error: updateError } = await supabase
    .from('artist_applications')
    .update({
      agent_rating: rating,
      agent_notes: summary,
      agent_reviewed_at: new Date().toISOString()
    })
    .eq('id', record.id)

  if (updateError) {
    console.error('Error updating artist application with review:', updateError)
    throw updateError
  }

  // Create admin notification
  const { error: notifyError } = await supabase
    .from('admin_notifications')
    .insert([{
      type: 'artist_submission',
      reference_id: record.id,
      title: `New artist submission: ${record.artist_name || 'Unknown'}`,
      summary: summary,
      agent_rating: rating
    }])

  if (notifyError) {
    console.error('Error creating admin notification:', notifyError)
    // Don't throw - the review was saved, notification is secondary
  }
}
