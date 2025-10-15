import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({
  auth: import.meta.env.VITE_NOTION_API_KEY,
});

const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID;

/**
 * Save a conversation exchange to Notion
 * @param {Object} conversationData - The conversation data to save
 * @param {string} conversationData.userMessage - The user's message
 * @param {string} conversationData.virgilResponse - Virgil's response
 * @param {Object} conversationData.profile - User profile data
 * @param {string} conversationData.conversationId - Unique ID for this conversation session
 */
export async function saveConversationToNotion({
  userMessage,
  virgilResponse,
  profile,
  conversationId
}) {
  try {
    // Check if API key and database ID are configured
    if (!import.meta.env.VITE_NOTION_API_KEY || !import.meta.env.VITE_NOTION_DATABASE_ID) {
      console.warn('Notion API not configured. Skipping save to Notion.');
      return null;
    }

    // Create a summary for the title (first 50 chars of user message)
    const title = userMessage.length > 50
      ? `${userMessage.substring(0, 50)}...`
      : userMessage;

    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        // Title is required for most Notion databases
        'Title': {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        // User information
        'Username': {
          rich_text: [
            {
              text: {
                content: profile?.username || 'Anonymous',
              },
            },
          ],
        },
        // Conversation data
        'User Message': {
          rich_text: [
            {
              text: {
                content: userMessage,
              },
            },
          ],
        },
        'Virgil Response': {
          rich_text: [
            {
              text: {
                content: virgilResponse,
              },
            },
          ],
        },
        // Timestamp
        'Timestamp': {
          date: {
            start: new Date().toISOString(),
          },
        },
        // User stats
        'User Palomas': {
          number: profile?.dov_balance || 0,
        },
        'User Cups': {
          number: profile?.cup_count || 0,
        },
        // Conversation tracking
        'Conversation ID': {
          rich_text: [
            {
              text: {
                content: conversationId,
              },
            },
          ],
        },
      },
    });

    console.log('✅ Conversation saved to Notion:', response.id);
    return response;
  } catch (error) {
    console.error('❌ Error saving to Notion:', error);

    // Provide helpful error messages
    if (error.code === 'unauthorized') {
      console.error('Notion API authorization failed. Check your VITE_NOTION_API_KEY.');
    } else if (error.code === 'object_not_found') {
      console.error('Notion database not found. Check your VITE_NOTION_DATABASE_ID and ensure the integration has access.');
    } else if (error.code === 'validation_error') {
      console.error('Notion validation error. Check that your database has all the required properties.');
    }

    return null;
  }
}

/**
 * Batch save multiple conversation exchanges
 * Useful for saving entire conversation history
 */
export async function batchSaveConversations(conversations, profile, conversationId) {
  try {
    const promises = conversations.map(conv =>
      saveConversationToNotion({
        userMessage: conv.userMessage,
        virgilResponse: conv.virgilResponse,
        profile,
        conversationId
      })
    );

    const results = await Promise.all(promises);
    console.log(`✅ Saved ${results.filter(r => r !== null).length} conversations to Notion`);
    return results;
  } catch (error) {
    console.error('❌ Error batch saving to Notion:', error);
    return [];
  }
}

/**
 * Generate a unique conversation ID for a session
 */
export function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
