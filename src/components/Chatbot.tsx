'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { useApp } from '@/store/AppContext';

export function Chatbot() {
  const { state: appState, dispatch } = useApp();
  const user = appState.user;
  const [isOpen, setIsOpen] = useState(false);
  const [localInput, setLocalInput] = useState('');
  
  // ai-sdk/react v4.0+ signature
  const { messages, sendMessage, status, error, append } = useChat({
    body: { userId: user?.id },
    maxSteps: 5 // Allow multi-step tool calls
  }) as any;
  const isLoading = status === 'submitted' || status === 'streaming';
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatchedToolCalls = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    messages.forEach((m: any) => {
      m.toolInvocations?.forEach((t: any) => {
        if (t.toolName === 'schedule_study_blocks' && t.result?.success) {
          if (!dispatchedToolCalls.current.has(t.toolCallId)) {
            dispatchedToolCalls.current.add(t.toolCallId);
            dispatch({ type: 'ADD_PLANNER_BLOCKS', payload: t.result.blocks });
          }
        }
      });
    });
  }, [messages, dispatch]);

  // Return null if not logged in (must be after all hooks)
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen && (
        <Card className="w-80 sm:w-96 h-[520px] flex flex-col mb-4 border-0 glass-card shadow-fm-lg animate-slide-in-up overflow-hidden rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-sky to-lilac text-white p-4 flex flex-row justify-between items-center space-y-0 border-b-0">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-md">
                <Bot size={20} className="text-white" />
              </div>
              Focus Mate AI
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/20 hover:text-white rounded-full transition-colors" 
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-5 bg-background/40 backdrop-blur-sm" ref={scrollRef}>
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm text-center animate-fade-in">
                <strong>Lỗi kết nối AI:</strong> {error.message || 'Không thể kết nối đến máy chủ.'}
              </div>
            )}
            {(!messages || messages.length === 0) && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <div className="bg-gradient-to-br from-sky/20 to-lilac/20 p-5 rounded-full animate-mascot-bounce shadow-fm-sm">
                  <Sparkles size={48} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-foreground gradient-text">Xin chào, {user.name || 'bạn'}!</p>
                  <p className="text-sm text-muted-foreground mt-1">Mình có thể giúp gì cho bạn hôm nay?</p>
                </div>
              </div>
            )}
            {(messages || []).map((m: any) => (
              <div key={m.id || Math.random().toString()} className={`flex gap-3 animate-fade-in ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role !== 'user' && (
                  <Avatar className="w-8 h-8 border-0 bg-gradient-to-br from-sky/20 to-lilac/20 shrink-0 mt-1 shadow-sm">
                    <AvatarFallback className="bg-transparent"><Bot size={16} className="text-primary" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm shadow-sm ${m.role === 'user' ? 'bg-gradient-to-r from-sky to-primary text-white rounded-br-sm' : 'bg-card/80 backdrop-blur border-border/50 text-card-foreground rounded-bl-sm'}`}>
                  {m.content && m.content}
                  
                  {/* Handle tool calls UI */}
                  {m.toolInvocations?.map((toolInvocation: any) => {
                    const toolCallId = toolInvocation.toolCallId;
                    const result = toolInvocation.result;
                    if (toolInvocation.toolName === 'schedule_study_blocks') {
                      return (
                        <div key={toolCallId} className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                          {result ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-primary flex items-center gap-2">
                                <Sparkles size={14} /> Hoàn tất lưu lịch!
                              </span>
                              <span className="text-xs opacity-80">{typeof result === 'string' ? result : result.message || 'Thành công'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-primary font-medium">
                              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">Đang đồng bộ với AI Planner...</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  {(!m.content && !m.toolInvocations) && (m.parts ? m.parts.map((p: any) => p.text).join('') : JSON.stringify(m))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <Avatar className="w-8 h-8 border-0 bg-gradient-to-br from-sky/20 to-lilac/20 shrink-0 mt-1 shadow-sm">
                  <AvatarFallback className="bg-transparent"><Bot size={16} className="text-primary" /></AvatarFallback>
                </Avatar>
                <div className="bg-card/80 backdrop-blur border-border/50 text-card-foreground rounded-2xl rounded-bl-sm px-4 py-3.5 max-w-[80%] text-sm flex items-center gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-3 bg-background/60 backdrop-blur-md border-t border-border/50">
            <form onSubmit={e => { 
              e.preventDefault();
              if (!localInput || !localInput.trim()) return;
              try {
                const messageText = localInput;
                setLocalInput('');
                
                if (typeof sendMessage === 'function') {
                  sendMessage({ role: 'user', content: messageText });
                } else {
                  alert('SDK Error: sendMessage is not a function');
                }
              } catch (err: any) {
                alert("Submit Error: " + err.message);
              }
            }} className="flex w-full gap-2 relative">
              <Input 
                value={localInput} 
                onChange={(e) => setLocalInput(e.target.value)} 
                placeholder="Hỏi mình bất cứ điều gì..." 
                className="flex-1 pr-12 rounded-full bg-background/50 border-border/60 focus-visible:ring-primary/50 focus-visible:border-primary/50 shadow-sm transition-all"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1 h-8 w-8 rounded-full z-10 bg-gradient-to-r from-sky to-primary text-white hover:opacity-90 transition-opacity" 
                disabled={isLoading || !localInput.trim()}
              >
                <Send size={14} className="ml-0.5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
      
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="rounded-full w-14 h-14 p-0 shadow-fm-glow animate-float bg-gradient-to-r from-sky to-lilac text-white hover:scale-105 transition-transform duration-300 border-0"
        >
          <div className="flex items-center justify-center w-full h-full bg-white/10 rounded-full backdrop-blur-sm">
            <MessageCircle size={26} className="text-white drop-shadow-sm" />
          </div>
        </Button>
      )}
    </div>
  );
}

