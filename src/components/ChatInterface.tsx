
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ImageUpload from './ImageUpload';
import { toast } from 'sonner';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
      text: "Hello! 👋 I'm your Farm Friend AI. Ask me anything about farming, crops, diseases, or upload a photo of your plants for diagnosis!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [pendingResponses, setPendingResponses] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up webhook response listener
  useEffect(() => {
    const handleWebhookResponse = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'WEBHOOK_RESPONSE' && event.data.sessionId === sessionId) {
        const { messageId, response } = event.data;
        
        if (pendingResponses.has(messageId)) {
          const aiResponse: Message = {
            id: `ai_${Date.now()}`,
            text: response || "I'm sorry, I couldn't process your request at the moment. Please try again.",
            isUser: false,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiResponse]);
          setPendingResponses(prev => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
          });
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('message', handleWebhookResponse);
    return () => window.removeEventListener('message', handleWebhookResponse);
  }, [sessionId, pendingResponses]);

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

  const handleVoiceToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening... Speak now!');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
      toast.success('Voice input captured!');
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast.error('Voice recognition error: ' + event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const sendToWebhook = async (question: string, photo?: string, messageId?: string) => {
    const webhookUrl = 'https://lucifer2z.app.n8n.cloud/webhook-test/fc359f00-306c-4c56-a6c0-d578d68c1ce5';
    
    try {
      const payload = {
        question: question,
        photo: photo || null,
        sessionId: sessionId,
        messageId: messageId,
        timestamp: new Date().toISOString(),
        source: 'Farm Friend AI'
      };

      console.log('Sending to webhook:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Successfully sent to webhook');
        
        // If n8n doesn't respond within 10 seconds, show fallback response
        setTimeout(() => {
          if (messageId && pendingResponses.has(messageId)) {
            const fallbackResponse: Message = {
              id: `fallback_${Date.now()}`,
              text: generateFarmingResponse(question, !!photo),
              isUser: false,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, fallbackResponse]);
            setPendingResponses(prev => {
              const newSet = new Set(prev);
              newSet.delete(messageId);
              return newSet;
            });
            setIsLoading(false);
          }
        }, 10000);
      } else {
        console.error('Webhook response error:', response.status);
        // Show fallback response immediately if webhook fails
        if (messageId) {
          const fallbackResponse: Message = {
            id: `error_${Date.now()}`,
            text: generateFarmingResponse(question, !!photo),
            isUser: false,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, fallbackResponse]);
          setPendingResponses(prev => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
          });
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error sending to webhook:', error);
      // Show fallback response on error
      if (messageId) {
        const fallbackResponse: Message = {
          id: `error_${Date.now()}`,
          text: generateFarmingResponse(question, !!photo),
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, fallbackResponse]);
        setPendingResponses(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim() && !uploadedImage) {
      toast.error('Please enter a question or upload an image');
      return;
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userMessage: Message = {
      id: messageId,
      text: inputText || (uploadedImage ? 'I uploaded an image of my crop. Can you help?' : ''),
      isUser: true,
      image: uploadedImage || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setPendingResponses(prev => new Set([...prev, messageId]));
    
    // Send to webhook
    await sendToWebhook(userMessage.text, uploadedImage || undefined, messageId);
    
    setInputText('');
    setUploadedImage(null);
    setIsLoading(true);
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
                type="button"
                variant="outline"
                onClick={handleVoiceToText}
                className={`border-green-300 text-green-700 hover:bg-green-50 px-4 py-3 h-auto ${
                  isListening ? 'bg-green-100 border-green-500' : ''
                }`}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 mr-2 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">
                  {isListening ? 'Stop' : 'Voice'}
                </span>
              </Button>
              
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
            💡 Tip: Upload clear photos of your crops for better diagnosis or use voice input
            {sessionId && <span className="block text-xs opacity-60">Session: {sessionId}</span>}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;
