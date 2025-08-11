// netlify/functions/chat.js
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Debug: Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key available:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 'undefined');
    console.log('API Key starts with:', apiKey ? apiKey.substring(0, 20) : 'undefined');
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'OpenAI API key not configured',
          debug: 'Environment variable OPENAI_API_KEY is missing'
        })
      };
    }

    const { message, profile } = JSON.parse(event.body);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for a crypto/token application. User info: Username: ${profile?.username || 'Unknown'}, DOV: ${profile?.dov_balance || 0}, DJR: ${profile?.djr_balance || 0}, Cups: ${profile?.cup_count || 0}, Merits: ${profile?.merit_count || 0}, Palomas: ${profile?.total_palomas_collected || 0}. Help with account questions and app features.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Error:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'OpenAI API error',
          details: `${response.status}: ${errorText}`
        })
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request."
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process chat request',
        details: error.message
      })
    };
  }
};
