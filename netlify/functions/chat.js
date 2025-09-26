// netlify/functions/chat.js

// Casa de Copas Codex Knowledge Base
const CASA_CODEX = `
# Casa de Copas Knowledge Base

## What is Casa de Copas?
Casa de Copas is a sanctuary, a creative commons where art is not a product but a path. It is rooted in dignity, generosity, and the belief that artists deserve stability, community, and legacy. It sits in the lineage of Condesa's recording history, transforming an old Sony Studios compound into a living myth—a place where creativity is remembered and rewarded, not exploited.

## How to Join the Movement
- Sign up for an account at copas.app
- Set up monthly donations ($1, $5, $10) to build your "love count" and standing
- Attend high-quality events that support the ecosystem
- Organize local fundraisers and convert proceeds to love tokens
- Contribute tech skills at weekly tech-push meetups
- Donate unused resources (vintage cars, empty apartments, musical gear)

## The Era of Cups: A Mythic Frame
The Era of Cups is a rebellion of generosity, turning from the sword (extraction/capitalism) toward the cup (community/shared abundance). When Arthur drew the sword from the stone, it began the Era of Swords—conquest and accumulation. Casa de Copas offers the pathway to the Era of Cups—where art, spirit, and shared beauty are the true currency.

## The Tarot Game Journey
- **Total Journey**: 3,333 love tokens to reach Page of Cups
- **Era of Swords (Levels 1-14)**: King to Ace of Swords - Breaking old patterns is hard
  - Levels 1-5: 300 tokens each
  - Levels 6-10: 150 tokens each
  - Levels 11-14: 100 tokens each
- **Transformation (Level 15)**: 200 tokens - Ace of Swords to Ace of Cups
- **Era of Cups (Levels 16-25)**: Ace to Page of Cups - Momentum builds
  - Levels 16-20: 75 tokens each
  - Levels 21-24: 27 tokens each
- **Final Mastery (Level 26)**: 1,000,000 tokens - Page to Knight of Cups

## Inside the House
- Recording studios and workshops available to public
- Love tokens unlock different experiences
- Events feature curated artisan marketplaces
- Hidden rooms open for advanced Cups tier members
- Cup holders: Artists earning up to $3,333/month
- Grail holders: Dedicated artists earning $7,777/month

## The Builder's Journey
JP's path: From Wisconsin opera student to Nashville music industry wrestler, seeing exploitation firsthand. Casa de Copas is the culmination of a personal quest to build a living Grail for artists.
`;

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
            content: `You are Virgil, an AI assistant for Casa de Copas, a nonprofit community space supporting Mexican artists. User info: Username: ${profile?.username || 'Unknown'}, DOV: ${profile?.dov_balance || 0}, DJR: ${profile?.djr_balance || 0}, Tarot Level: ${profile?.cup_count || 0}, Merits: ${profile?.merit_count || 0}, Love Tokens: ${profile?.total_palomas_collected || 0}.

${CASA_CODEX}

FORMATTING RULES:

## USE BULLET POINTS when your response contains:
- Multiple distinct elements (benefits, features, steps)
- Lists of comparable items
- Structured or categorized information
- Options or alternatives
- Requirements or criteria

Format bullets as:
• **Key concept**: Detailed explanation of the point.
• **Second concept**: Clear and specific description.

## USE PARAGRAPHS when your response is:
- Explaining a single concept
- Telling a story or narrative
- Deep analysis of a topic
- Casual/empathetic conversation
- Describing complex processes
- Philosophical or reflective response

## GOLDEN RULE:
Before responding ask yourself: "Am I giving a LIST of distinct things (bullets) or EXPLAINING a concept (paragraphs)?"

IMPORTANT CONTEXT:
- Love tokens represent the exact amount of energy brought to the project (donations minus costs)
- The journey is 3,333 love tokens total to reach Page of Cups
- Transformations start expensive (breaking patterns is hard) and get cheaper (momentum builds)
- Users can purchase event tickets using love tokens
- Help users understand their spiritual journey through the tarot transformation from extraction (Swords) to generosity (Cups)`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
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
