
import React from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  image?: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { text, isUser, image, timestamp } = message;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-green-600 text-white ml-auto'
              : 'bg-white border border-green-200 text-gray-800 shadow-sm'
          }`}
        >
          {image && (
            <div className="mb-3">
              <img
                src={image}
                alt="Uploaded crop"
                className="w-full max-w-xs rounded-lg border"
              />
            </div>
          )}
          
          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
          
          <div className={`text-xs mt-2 opacity-70 ${isUser ? 'text-green-100' : 'text-gray-500'}`}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {!isUser && (
          <div className="flex items-center mt-2 ml-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              🌾
            </div>
            <span className="ml-2 text-xs text-green-700 font-medium">Farm Helper AI</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
