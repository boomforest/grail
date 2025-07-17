import React, { useState, useRef, useEffect } from 'react';

const GPTChatWindow = ({ isOpen, onToggle, profile }) => {
  // Add debugging
  console.log('GPTChatWindow rendered with:', { isOpen, profile: profile?.username });

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Your OpenAI API key
  const OPENAI_API_KEY = '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';

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
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create context about the user for the AI
      const systemMessage = `You are an AI assistant for a token/crypto application. The user's profile information:
      - Username: ${profile?.username || 'Unknown'}
      - DOV Balance: ${profile?.dov_balance || 0}
      - DJR Balance: ${profile?.djr_balance || 0}
      - Cup Count: ${profile?.cup_count || 0}
      - Merit Count: ${profile?.merit_count || 0}
      - Total Palomas Collected: ${profile?.total_palomas_collected || 0}
      
      Help them with questions about their account, the application features, or general assistance.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // or 'gpt-4' if you have access
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: inputMessage
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.",
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      let errorText = "Sorry, I'm having trouble connecting right now. Please try again later.";
      
      if (error.message.includes('401')) {
        errorText = "API key authentication failed. Please check your OpenAI API key.";
      } else if (error.message.includes('429')) {
        errorText = "Rate limit exceeded. Please wait a moment before trying again.";
      } else if (error.message.includes('403')) {
        errorText = "Access denied. Please check your API key permissions.";
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Debug the render decision
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
            // Fallback to angel emoji if image doesn't load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
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
    <div className="fixed bottom-20 left-6 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50" style={{ zIndex: 1000 }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span style={{ fontSize: '16px' }}>👼</span>
          <span className="font-medium">AI Assistant</span>
        </div>
        <button
          onClick={onToggle}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-xs p-3 rounded-lg ${
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
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
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
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
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
