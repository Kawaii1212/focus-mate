'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen && (
        <Card className="w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl mb-4 border border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              <Bot size={22} />
              AI Assistant
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-full" 
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Bot size={40} className="text-primary" />
                </div>
                <p className="font-medium text-foreground">Hi there!</p>
                <p className="text-sm">How can I help you today?</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role !== 'user' && (
                  <Avatar className="w-8 h-8 border bg-background shrink-0 mt-1">
                    <AvatarFallback className="bg-transparent"><Bot size={16} className="text-primary" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background border text-foreground rounded-bl-none'}`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <Avatar className="w-8 h-8 shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/20"><User size={16} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8 border bg-background shrink-0 mt-1">
                  <AvatarFallback className="bg-transparent"><Bot size={16} className="text-primary" /></AvatarFallback>
                </Avatar>
                <div className="bg-background border text-foreground rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%] text-sm flex items-center gap-1 shadow-sm">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-3 bg-background border-t">
            <form onSubmit={handleSubmit} className="flex w-full gap-2 relative">
              <Input 
                value={input} 
                onChange={handleInputChange} 
                placeholder="Ask me anything..." 
                className="flex-1 pr-12 rounded-full bg-muted/50 focus-visible:ring-primary/30"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1 h-8 w-8 rounded-full" 
                disabled={isLoading || !input.trim()}
              >
                <Send size={16} className="ml-1" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
      
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="rounded-full w-14 h-14 shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform duration-200"
        >
          <MessageCircle size={28} />
        </Button>
      )}
    </div>
  );
}
