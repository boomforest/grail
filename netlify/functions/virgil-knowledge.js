// Netlify function to fetch Virgil's knowledge from Google Docs
exports.handler = async (event, context) => {
  // Get configuration from environment variables
  const GOOGLE_DOC_ID = process.env.VIRGIL_KNOWLEDGE_DOC_ID
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

  // Validate configuration
  if (!GOOGLE_DOC_ID || !GOOGLE_API_KEY) {
    console.error('Missing required environment variables')
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Server configuration error',
        hasDocId: !!GOOGLE_DOC_ID,
        hasApiKey: !!GOOGLE_API_KEY
      })
    }
  }

  try {
    console.log('Fetching knowledge from Google Doc:', GOOGLE_DOC_ID)

    // Fetch the document from Google Docs API
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${GOOGLE_DOC_ID}?key=${GOOGLE_API_KEY}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Docs API error:', response.status, errorText)
      throw new Error(`Google Docs API returned ${response.status}: ${errorText}`)
    }

    const doc = await response.json()
    console.log('Document fetched successfully')

    // Extract text content from the document
    const knowledge = extractTextFromDoc(doc)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        content: knowledge,
        lastUpdated: new Date().toISOString(),
        docTitle: doc.title
      })
    }
  } catch (error) {
    console.error('Error fetching Virgil knowledge:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to fetch knowledge base',
        message: error.message
      })
    }
  }
}

/**
 * Extract plain text from Google Docs structure
 * Google Docs returns a complex nested structure, this flattens it to text
 */
function extractTextFromDoc(doc) {
  if (!doc.body || !doc.body.content) {
    return ''
  }

  let text = ''

  // Iterate through all content elements
  for (const element of doc.body.content) {
    if (element.paragraph) {
      // Extract text from paragraph elements
      if (element.paragraph.elements) {
        for (const elem of element.paragraph.elements) {
          if (elem.textRun && elem.textRun.content) {
            text += elem.textRun.content
          }
        }
      }
    } else if (element.table) {
      // Extract text from tables
      for (const row of element.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          for (const cellElement of cell.content || []) {
            if (cellElement.paragraph && cellElement.paragraph.elements) {
              for (const elem of cellElement.paragraph.elements) {
                if (elem.textRun && elem.textRun.content) {
                  text += elem.textRun.content
                }
              }
            }
          }
        }
      }
    }
  }

  return text.trim()
}
