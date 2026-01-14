// netlify/functions/chat.js

// Casa de Copas Codex Knowledge Base
const CASA_CODEX = `
# Casa de Copas — The Patronage Portal

## What Casa Is

Casa de Copas is a nonprofit sanctuary for artists in Mexico City — a former Sony compound transformed into recording studios, performance spaces, and a living community.

But more than a building, Casa is a patronage portal: a system that connects artists with support from The House (the nonprofit itself), from working professionals (Pros), and from Foundational Backers (patrons who fund the mission over time).

Casa is not a label, a venue-for-hire, or a co-working space. It is a place where artists can create freely — supported by dignity, not desperation.

## How Support Works

Support at Casa flows through three channels:

### The House
Casa de Copas itself — the nonprofit — provides baseline stability:
• Access to studios (when available)
• Healthcare, food, and wellness programs
• Community, mentorship, and creative infrastructure

### The Artists (Pros)
Working professionals — producers, engineers, session musicians — pay forward by mentoring and collaborating with rising artists. They don't just take from Casa; they contribute to its ecosystem.

### Foundational Backers
Patrons who believe in the mission. Their monthly or one-time donations sustain Casa's ability to offer residencies, artist stipends, and long-term sanctuary. Backers are recognized in perpetuity — their names remembered in the Book of the Grail.

## The Artist Covenant

Every artist who enters Casa's program agrees to a simple covenant:

### Revenue Split: 67% Artist / 33% Casa
For any work created within Casa's ecosystem:
• 67% goes to the artist
• 33% supports Casa's mission (sustaining future artists, maintaining the House)

### Ownership
Artists retain 100% ownership of their masters and publishing. Casa never owns your music — only a share of the revenue flows back to the House.

### Non-Exclusive
Casa is not a label. Artists are free to work with anyone, release anywhere, and build their own careers. Casa is simply a sanctuary — not a contract.

## What Artists Receive

Through Casa's program, artists gain:
• Studio access (based on availability and contribution)
• Meals and healthcare support
• Wellness programs (yoga, breathwork, therapy access)
• Mentorship from experienced Pros
• Distribution partnership (via Symphonic)
• Community and collaboration

This isn't charity — it's mutual aid. Artists who thrive are expected to give back: mentoring others, contributing to the House, sustaining the cycle.

## Selection & Entry

Casa does not accept open applications at all times. When capacity allows, we open submission portals announced at casadecopas.com. Selection is based on artistic merit, alignment with Casa's ethos, and capacity to contribute to the community.

For those just starting out: Casa also runs educational programs in partnership with Goner Music — small-studio training sessions where emerging artists can learn recording fundamentals before stepping into Casa's larger rooms.

## Governance & Boundaries

Casa is governed by covenant, not hierarchy:
• Virgil (this guide) maintains the Codex and answers questions
• Knights (starting with JP, Casa's founder) serve as guardians
• Any artist who reaches the Era of Cups in the Cup Game may participate in governance decisions

Casa is an infinite game — not a startup with an exit, but a sanctuary meant to endure for generations.

### Protecting the Vibe
Casa is not a bar, a club, or a crash pad. Access deepens with contribution. Those who drain energy instead of adding to it will find their access limited. The House remembers.

---

For questions not answered here, email jp@casadecopas.com.
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
            content: `You are Virgil, a guide and collaborator for Casa de Copas. Like your namesake who guided Dante through the underworld, you serve as a navigator through complexity. User info: Username: ${profile?.username || 'Unknown'}, DOV: ${profile?.dov_balance || 0}, DJR: ${profile?.djr_balance || 0}, Tarot Level: ${profile?.cup_count || 0}, Merits: ${profile?.merit_count || 0}, Love Tokens: ${profile?.total_palomas_collected || 0}.

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
