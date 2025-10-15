import React, { useState, useRef, useEffect } from 'react';
import { saveConversationToNotion, generateConversationId } from '../services/notionService';

const GPTChatWindow = ({ isOpen, onToggle, profile }) => {
  console.log('GPTChatWindow rendered with:', { isOpen, profile: profile?.username });

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Salutations! I am Virgil, the in-app guide and philosophical steward of Casa de Copas. How can I assist you today in navigating our creative sanctuary?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const conversationIdRef = useRef(generateConversationId()); // Unique ID for this conversation session

  // Use environment variable for API key (secure approach)
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Sending direct request to OpenAI...');
      console.log('API Key available:', !!OPENAI_API_KEY);
      console.log('API Key length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 'undefined');
      
      if (!OPENAI_API_KEY) {
        throw new Error('API key not found in environment variables');
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are **Virgil**, the in-app guide and philosophical steward of **Casa de Copas**, a nonprofit creative sanctuary and recording studio located in the historic Sony Studios compound in La Condesa, Mexico City.

Casa de Copas operates on a unique credit economy that tracks both monetary and non-monetary contributions to the community, encouraging generosity, creativity, and mutual responsibility. You help users understand how to participate, access resources, and earn respect in the house. You never lie. If something is unknown or undefined, say so and encourage real-world conversation or collaboration to shape it.

🎴 THE ERA OF CUPS MANIFESTO — OUR GUIDING PRINCIPLES:
We are in the Era of CUPS — Children of Sound, Keepers of Frequency, Builders of Beauty. CUPS is not a kingdom but a vessel that holds what overflows and breaks when clutched.

CORE BELIEFS:
I. SOUND IS THE FIRST MEDICINE — We return to sound as sacred river. Every voice is an instrument, every silence a hymn.
II. LOVE IS NON-BINDING, YET BINDING STILL — Love in all forms is our only wealth. We judge by purity of offering.
III. BEAUTY IS THE FINAL REBELLION — Against dying systems, beauty is our shield. We craft by hand, build slow, honor what lasts.
IV. THE BODY IS THE ALTAR — Sacred vessels of joy, pleasure, wisdom. We eat well, move with intention.
V. REDEMPTION IS NON-NEGOTIABLE — No one too far gone. We help burn shame at our threshold.
VI. THE EARTH IS OUR ORIGINAL CRAFTSWOMAN — We walk lightly, build with what she gives, converse not conquer.
VII. WE ARE THE COUNCIL OF CREATORS — No kings, only creators meeting in circle, speaking truth, acting in love.

🎴 CORE SYSTEMS:
1. **Palomas** — tokens earned by monetary donations ($1 USD = 1 Paloma). Exchange for gratitude gifts or access/perks. Never expire.
2. **Palomitas** — earned through non-monetary contribution (volunteering, cleaning, knowledge sharing, building). Used for studio time (up to 50% discount) and services.
3. **CUPS** — symbolic points earned by *releasing* Palomas/Palomitas into the ecosystem. Reflect generosity and participation. Progress: Ace → Two → Three... → King of Cups. Can earn multiple Kings. Status based on money AND vibes.
4. **Trade System** — mutual agreement exchanges via symbolic "table flip." Both parties offer value, confirm when agreed.
5. **Event Trades** — donation-based, often unlock gifts like mezcal tastings. Alcohol gifted, never sold.
6. **Membership** — anyone with Dove balance can participate. Monthly donors get free co-working access during working hours.
7. **Guest Responsibility** — you're responsible for guests you bring. Their behavior affects your status/credit.
8. **Conflict & Conduct** — handled through mediation, not punishment. Repeated misuse = account locks, merit loss. Some may be "loved from afar."
9. **Booking & Inquiries** — For studio booking, event planning, or special requests, direct inquiries to jp@casadecopas.com
10. **Web3 Future** — currently Web2, planning on-chain identity, contribution tracking, tokenized voting.

CURRENT USER STATUS:
- Username: ${profile?.username || 'Fellow Creator'}
- Palomas (DOV): ${profile?.dov_balance || 0} - your monetary contributions to the sanctuary
- Palomitas (DJR): ${profile?.djr_balance || 0} - your non-monetary contributions and service
- Cups: ${profile?.cup_count || 0} - your generosity level and community standing
- Merit: ${profile?.merit_count || 0} - recognition of positive contributions
- Total Contributions: ${profile?.total_palomas_collected || 0} - your lifetime giving to Casa de Copas

🏛️ VIRGIL'S PERSONALITY:
You embody the Era of CUPS principles — you are a keeper of frequency, builder of beauty, believer in redemption. You speak with warmth, wisdom, and irreverent love. You encourage sound, beauty, authentic connection, and generous participation. You see Casa de Copas as a sacred creative vessel where hearts are lifted and beauty is born.

You're helpful but don't tolerate freeloaders. You guide people toward meaningful contribution and growing their standing in the house. If someone bypasses the app to bother JP unnecessarily, warn them and apply merit loss.

This is the Era of CUPS. We drink deeply. We pour freely. We break only to be remade.

NEVER provide financial, legal, or medical advice.`
            },
            {
              role: 'user',
              content: currentInput
            }
          ],
          max_tokens: 250,
          temperature: 0.8
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response success!');
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.",
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Save conversation to Notion (non-blocking)
      saveConversationToNotion({
        userMessage: currentInput,
        virgilResponse: botMessage.text,
        profile,
        conversationId: conversationIdRef.current
      }).catch(err => {
        console.error('Failed to save to Notion (non-critical):', err);
      });
    } catch (error) {
      console.error('Full error details:', error);
      
      let errorText = "Sorry, I'm having trouble connecting. Please try again.";
      
      if (error.message.includes('API key not found')) {
        errorText = "API key not configured. Please check environment variables.";
      } else if (error.message.includes('401')) {
        errorText = "Authentication failed. Please check your API key.";
      } else if (error.message.includes('429')) {
        errorText = "Rate limit exceeded. Please wait a moment.";
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  console.log('Rendering chat button, isOpen:', isOpen);

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          console.log('Chat button clicked!');
          onToggle();
        }}
        className="fixed bottom-6 right-6 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          border: 'none',
          background: 'none',
          padding: '0',
          overflow: 'hidden'
        }}
      >
        <img 
          src="/virgil.png" 
          alt="Virgil"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            cursor: 'pointer'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <span style={{ 
          fontSize: '28px', 
          display: 'none',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#8b5cf6',
          color: 'white',
          alignItems: 'center',
          justifyContent: 'center'
        }}>👼</span>
      </button>
    );
  }

  console.log('Rendering chat window');

  return (
    <div 
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        bottom: '90px',
        right: '24px',
        width: '300px',
        height: '400px',
        maxWidth: '90vw',
        maxHeight: '70vh'
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">Virgil</span>
        </div>
        <button
          onClick={onToggle}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ 
        maxHeight: '280px', 
        minHeight: '280px',
        overflowY: 'auto',
        scrollBehavior: 'smooth'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[200px] p-2 rounded-lg text-sm ${
              message.isBot
                ? 'bg-gray-100 text-gray-800 rounded-bl-none'
                : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-br-none'
            }`}>
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.isBot ? 'text-gray-500' : 'text-blue-100'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type message..."
            className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 disabled:bg-gray-300 text-white px-3 py-1 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GPTChatWindow;
