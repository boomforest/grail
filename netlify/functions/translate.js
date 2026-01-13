// netlify/functions/translate.js
// Auto-translate power-up content to Spanish using Claude API

export async function handler(event) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { title, description } = JSON.parse(event.body)

    if (!title && !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Title or description required' })
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Translation service not configured' })
      }
    }

    // Build the prompt
    const contentToTranslate = []
    if (title) contentToTranslate.push(`Title: ${title}`)
    if (description) contentToTranslate.push(`Description: ${description}`)

    const prompt = `Translate the following content from English to Spanish. This is for a creative studio/arts community platform. Keep the tone professional but warm. Return ONLY a JSON object with the translated fields, no markdown or explanation.

${contentToTranslate.join('\n\n')}

Return format (JSON only):
${title ? '{ "title_es": "translated title"' : '{'}${title && description ? ', ' : ''}${description ? '"description_es": "translated description"' : ''}}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Claude API error:', errorData)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Translation service error' })
      }
    }

    const data = await response.json()
    const translatedText = data.content[0]?.text || ''

    // Parse the JSON response
    try {
      // Clean up the response - remove any markdown code blocks if present
      const cleanedText = translatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const translations = JSON.parse(cleanedText)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(translations)
      }
    } catch (parseError) {
      console.error('Failed to parse translation response:', translatedText)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse translation' })
      }
    }

  } catch (error) {
    console.error('Translation error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Translation failed' })
    }
  }
}
