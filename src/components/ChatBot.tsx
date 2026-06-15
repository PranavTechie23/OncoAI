import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { sendChatMessage, getFallbackResponse } from "@/services/chatService";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBotProps {
  initialOpen?: boolean;
}

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Hello! I'm your AI assistant for treatment recommendations. How can I help you today?",
    sender: "bot",
    timestamp: new Date(),
  },
];

export function ChatBot({ initialOpen }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen ?? false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userInput = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      // Try to get AI response
      const aiResponse = await sendChatMessage(conversationHistory, userInput);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // Update conversation history with user and bot response
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user' as const, content: userInput },
        { role: 'assistant' as const, content: aiResponse },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      
      // Use fallback response if API fails
      const fallbackResponse = getFallbackResponse(userInput);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user' as const, content: userInput },
        { role: 'assistant' as const, content: fallbackResponse },
      ]);
      
      // Show error toast for any API issue
      toast.error('Chat error', {
        description: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    if (messages.length > 1) {
      // Remove last user and bot messages
      const newMessages = messages.slice(0, -2);
      const newHistory = conversationHistory.slice(0, -2);
      setMessages(newMessages);
      setConversationHistory(newHistory);
      setError(null);
      
      // Resend last user message
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].sender === 'user') {
        setInput(newMessages[newMessages.length - 1].text);
        setTimeout(() => {
          handleSend();
        }, 100);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-border/50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Treatment Recommendations</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-xs">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "bot" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={scrollEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about treatment recommendations..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!input.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

