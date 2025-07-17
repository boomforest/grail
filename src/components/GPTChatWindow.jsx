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
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Debug: Check what key we're actually using
      console.log('API Key length:', OPENAI_API_KEY.length);
      console.log('API Key starts with:', OPENAI_API_KEY.substring(0, 20));
      console.log('API Key ends with:', OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10));
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY.trim()}` // Add trim() to remove any whitespace
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: currentInput
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.",
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Full error details:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Still having authentication issues. Let me try a different approach...",
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
          <span style={{ fontSize: '14px' }}>👼</span>
          <span className="font-medium text-sm">AI Assistant</span>
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
            onKeyPress={handleKeyPress}
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
