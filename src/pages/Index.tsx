
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-2">
            🌾 Farm Helper AI
          </h1>
          <p className="text-green-600 text-lg">
            Ask questions about your crops, get instant farming advice
          </p>
        </div>
        <ChatInterface />
      </div>
    </div>
  );
};

export default Index;
