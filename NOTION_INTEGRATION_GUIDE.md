# Notion API Integration Guide for Virgil

This guide walks you through setting up Notion's API to save Virgil's conversations to a Notion database as a knowledge base.

## ✅ What's Already Done

1. **Notion SDK Installed** - `@notionhq/client` package added
2. **Service Layer Created** - `/src/services/notionService.js` handles all Notion operations
3. **Chat Integration Complete** - GPTChatWindow automatically saves conversations
4. **Environment Variables Added** - `.env` file configured with placeholders

## 🚀 Setup Steps

### Step 1: Create Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name**: `Virgil Knowledge Base` (or any name you prefer)
   - **Associated workspace**: Select your workspace
   - **Type**: Internal integration
4. Click **"Submit"**
5. **Copy the Internal Integration Token** (starts with `secret_...`)
   - ⚠️ Keep this secret! Don't commit it to Git

### Step 2: Create Notion Database

1. Open Notion and create a new page in your workspace
2. Give it a name like **"Virgil Conversations"** or **"Casa de Copas Knowledge Base"**
3. Type `/database` and select **"Table - Inline"** to create a database
4. Add the following properties (columns):

   | Property Name | Property Type | Description |
   |--------------|---------------|-------------|
   | **Title** | Title | Auto-populated with conversation summary |
   | **Username** | Text | Username of the person chatting |
   | **User Message** | Text | The user's message |
   | **Virgil Response** | Text | Virgil's response |
   | **Timestamp** | Date | When the conversation happened |
   | **User Palomas** | Number | User's Palomas (DOV) balance |
   | **User Cups** | Number | User's Cup count |
   | **Conversation ID** | Text | Unique ID for the conversation session |

   **How to add properties:**
   - Click the **"+"** button at the right edge of the column headers
   - Select the property type from the dropdown
   - Name it exactly as shown above

### Step 3: Share Database with Integration

1. In your database page, click the **"..."** menu (top right)
2. Scroll down and click **"Connections"** or **"Add connections"**
3. Find and select your **"Virgil Knowledge Base"** integration
4. Confirm the connection

### Step 4: Get Database ID

1. Open your database as a **full page** (click the page title to open it)
2. Look at the URL in your browser. It will look like:
   ```
   https://www.notion.so/your-workspace/DATABASE_ID?v=VIEW_ID
   ```
3. **Copy the DATABASE_ID** part (it's a 32-character string between the last `/` and the `?`)
   - Example: If URL is `https://notion.so/myworkspace/abc123def456?v=xyz`, the ID is `abc123def456`

### Step 5: Update Environment Variables

1. Open `/Users/boomforest/Desktop/grail-new/grail/.env`
2. Replace the placeholder values:
   ```env
   # Replace these with your actual values:
   VITE_NOTION_API_KEY=secret_your_actual_notion_token_here
   VITE_NOTION_DATABASE_ID=your_actual_database_id_here
   ```
3. Save the file
4. The dev server will automatically restart

### Step 6: Test the Integration

1. Open your app at [http://localhost:5173/](http://localhost:5173/)
2. Click on the Virgil chat button (bottom right)
3. Send a test message like "Hello Virgil!"
4. Check the browser console (F12) for logs:
   - ✅ Success: `"✅ Conversation saved to Notion: page-id"`
   - ❌ Error: Check the error message for troubleshooting
5. Go to your Notion database and verify the conversation appears

## 🎯 How It Works

Every time a user sends a message and Virgil responds:

1. **Chat happens** - User types, Virgil responds via OpenAI
2. **Auto-save triggers** - `saveConversationToNotion()` is called
3. **Data saved** - A new row is added to your Notion database with:
   - The conversation exchange
   - User information (username, balances)
   - Timestamp
   - Unique conversation session ID

The save happens **asynchronously** (in the background) so it doesn't slow down the chat experience.

## 🔍 Useful Features

### Conversation Session ID

Each chat session gets a unique ID. This lets you:
- Group multiple exchanges from the same conversation
- Track conversation flow over time
- Filter by session in Notion

### Non-Blocking Saves

If Notion is down or there's an error:
- The chat continues to work normally
- Error is logged to console (non-critical)
- User experience is unaffected

### Customization Options

You can modify `/src/services/notionService.js` to:
- Add more user data fields
- Save sentiment analysis
- Tag conversations by topic
- Add custom metadata

## 🛠️ Troubleshooting

### Error: "Notion API not configured"
- Check that both `VITE_NOTION_API_KEY` and `VITE_NOTION_DATABASE_ID` are set in `.env`
- Make sure there are no extra spaces or quotes around the values

### Error: "unauthorized"
- Your API key is invalid or missing
- Make sure you copied the full token (starts with `secret_`)
- Regenerate the token in Notion if needed

### Error: "object_not_found"
- Your database ID is wrong
- Make sure you shared the database with your integration (Step 3)
- Verify the database ID is correct (32 characters, no spaces)

### Error: "validation_error"
- Your database is missing required properties
- Check that all 8 properties from Step 2 are created
- Verify property names match exactly (case-sensitive)

### Nothing appears in Notion
- Check browser console (F12) for errors
- Verify the dev server restarted after updating `.env`
- Make sure you're logged in to Notion

## 📊 Notion Database Tips

### Create Views

In Notion, create different views to analyze your data:

1. **By User** - Group by Username to see all conversations per user
2. **By Date** - Timeline view to see conversation trends
3. **By Session** - Group by Conversation ID to see full chat sessions
4. **High Engagement** - Filter users with high Palomas/Cups counts

### Export Data

You can export the entire database as CSV or Markdown for:
- Training custom AI models
- Analytics and insights
- Backup purposes

### Automation with Notion API

Use Notion's API to:
- Send weekly digests of conversations
- Flag important topics for review
- Trigger alerts for specific keywords
- Generate summaries with AI

## 🔐 Security Notes

- **Never commit `.env` file to Git** - It's already in `.gitignore`
- **API keys are secrets** - Don't share them publicly
- **Database permissions** - Only share with necessary integrations
- **Client-side exposure** - Since this is a Vite app, env vars are bundled. For production, consider moving Notion saves to a backend API

## 📚 Next Steps

1. ✅ Complete the setup above
2. 🎨 Customize your Notion database layout
3. 📊 Create useful views and filters
4. 🤖 Consider adding sentiment analysis or topic detection
5. 🔄 Set up automated backups of your knowledge base

## 💡 Ideas for Enhancement

- **Sentiment Analysis**: Analyze user sentiment and save it to Notion
- **Topic Tagging**: Auto-tag conversations by topic (studio, booking, credits, etc.)
- **User Journey**: Track user progression through Casa de Copas
- **Response Quality**: Track successful vs unsuccessful responses
- **Search Integration**: Build a search feature that queries Notion
- **Admin Dashboard**: Create a dashboard in Notion for team insights

---

**Need Help?** Check the browser console for detailed error messages or review the Notion API documentation at [https://developers.notion.com](https://developers.notion.com)
