
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Camera, Upload, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ImageUpload from './ImageUpload';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  image?: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! 👋 I'm your Farm Helper AI. Ask me anything about farming, crops, diseases, or upload a photo of your plants for diagnosis!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateFarmingResponse = (query: string, hasImage: boolean): string => {
    const responses = [
      hasImage ? 
        "Based on your image, I can see some concerning signs. This appears to be a nutrient deficiency. I recommend testing your soil pH and applying a balanced fertilizer. Also ensure proper drainage and watering schedule." :
        "That's a great question! For healthy crop growth, maintain proper soil moisture, ensure adequate sunlight, and monitor for pests regularly. Consider crop rotation to maintain soil health.",
      
      hasImage ?
        "Looking at your plant photo, the yellowing leaves suggest nitrogen deficiency or overwatering. Check soil drainage and consider applying nitrogen-rich fertilizer. Remove affected leaves to prevent disease spread." :
        "For optimal yields, focus on soil preparation, proper seed spacing, timely irrigation, and integrated pest management. Regular monitoring is key to successful farming.",
      
      hasImage ?
        "From the image, this looks like a fungal infection. Remove infected plant parts immediately, improve air circulation, and apply organic fungicide. Avoid overhead watering to prevent spread." :
        "Weather conditions greatly affect crop health. During monsoon, ensure proper drainage. In dry seasons, implement drip irrigation. Always match your farming practices to local climate patterns."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSubmit = async () => {
    if (!inputText.trim() && !uploadedImage) {
      toast.error('Please enter a question or upload an image');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText || (uploadedImage ? 'I uploaded an image of my crop. Can you help?' : ''),
      isUser: true,
      image: uploadedImage || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setUploadedImage(null);
    setIsLoading(true);

    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateFarmingResponse(inputText, !!uploadedImage),
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-sm shadow-xl border-green-200">
      <div className="flex flex-col h-[600px]">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 bg-green-100 rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                <span className="text-green-700">Analyzing your query...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t border-green-200 p-4 bg-green-50/50">
          {uploadedImage && (
            <div className="mb-3">
              <div className="relative inline-block">
                <img
                  src={uploadedImage}
                  alt="Uploaded crop"
                  className="w-20 h-20 object-cover rounded-lg border-2 border-green-300"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your farming question here (e.g., My wheat leaves are turning yellow...)"
                className="min-h-[60px] resize-none border-green-300 focus:border-green-500 focus:ring-green-500 bg-white"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <ImageUpload onImageUpload={setUploadedImage} />
              
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (!inputText.trim() && !uploadedImage)}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 h-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Ask Now
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-green-600 mt-2 text-center">
            💡 Tip: Upload clear photos of your crops for better diagnosis
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;
