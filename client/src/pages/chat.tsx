import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModelSelector } from "@/components/model-selector";
import { ChatMessageComponent } from "@/components/chat-message";
import { MessageInput } from "@/components/message-input";
import { SidePane } from "@/components/side-pane";
import { ErrorBanner } from "@/components/error-banner";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import type { ChatMessage, ChatSession } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Bot } from "lucide-react";

const STORAGE_KEY = "cerebras-chat-sessions";

function createNewSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    modelId: null,
    currentAgent: null,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function loadSessions(): ChatSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load sessions:", e);
  }
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save sessions:", e);
  }
}

function generateSessionTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (firstUserMessage) {
    const text = firstUserMessage.text.slice(0, 30);
    return text.length < firstUserMessage.text.length ? `${text}...` : text;
  }
  return "New Chat";
}

export default function ChatPage() {
  const [state, setState] = useState(() => {
    const loaded = loadSessions();
    const sessions = loaded.length === 0 ? [createNewSession()] : loaded;
    const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      sessions,
      activeSessionId: sortedSessions[0].id,
    };
  });
  
  const { sessions, activeSessionId } = state;
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sidePaneOpen, setSidePaneOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];
  const selectedModel = activeSession?.modelId || null;

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const setSessions = useCallback((updater: (prev: ChatSession[]) => ChatSession[]) => {
    setState((prev) => ({ ...prev, sessions: updater(prev.sessions) }));
  }, []);

  const setActiveSessionId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeSessionId: id }));
  }, []);

  const updateSession = useCallback((sessionId: string, updater: (session: ChatSession) => ChatSession) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === sessionId ? updater(s) : s)),
    }));
  }, []);

  const setSelectedModel = useCallback((modelId: string | null) => {
    updateSession(activeSessionId, (session) => ({
      ...session,
      modelId,
      updatedAt: Date.now(),
    }));
  }, [activeSessionId, updateSession]);

  const setMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    updateSession(activeSessionId, (session) => {
      const newMessages = updater(session.messages);
      return {
        ...session,
        messages: newMessages,
        title: generateSessionTitle(newMessages) || session.title,
        updatedAt: Date.now(),
      };
    });
  }, [activeSessionId, updateSession]);

  const handleNewSession = useCallback(() => {
    const newSession = createNewSession();
    setState((prev) => ({
      sessions: [newSession, ...prev.sessions],
      activeSessionId: newSession.id,
    }));
    setSelectedMessageId(null);
    setSidePaneOpen(false);
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setState((prev) => {
      const filtered = prev.sessions.filter((s) => s.id !== sessionId);
      if (filtered.length === 0) {
        const newSession = createNewSession();
        return {
          sessions: [newSession],
          activeSessionId: newSession.id,
        };
      }
      return {
        sessions: filtered,
        activeSessionId: prev.activeSessionId === sessionId ? filtered[0].id : prev.activeSessionId,
      };
    });
    setSelectedMessageId(null);
    setSidePaneOpen(false);
  }, []);

  const handleSessionSelect = useCallback((sessionId: string) => {
    setState((prev) => ({ ...prev, activeSessionId: sessionId }));
    setSelectedMessageId(null);
    setSidePaneOpen(false);
  }, []);

  const modelsQuery = useQuery<{ data: { id: string }[] }>({
    queryKey: ["/api/models"],
  });

  const models = modelsQuery.data?.data?.map((m) => m.id) || [];

  const addMessageToSession = useCallback((sessionId: string, message: ChatMessage, newAgent?: string | null) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, message],
              title: generateSessionTitle([...s.messages, message]) || s.title,
              currentAgent: newAgent || s.currentAgent,
              updatedAt: Date.now(),
            }
          : s
      ),
    }));
  }, []);

  const buildConversationHistory = useCallback((sessionMessages: ChatMessage[]): { role: "user" | "assistant"; content: string }[] => {
    return sessionMessages.map((msg) => {
      let content = msg.text;
      if (msg.role === "assistant" && msg.toolResponse) {
        const toolJson = JSON.stringify(msg.toolResponse, null, 2);
        content = `${msg.text}\n\njson\n${toolJson}\n`;
      }
      return { role: msg.role, content };
    });
  }, []);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      model, 
      message, 
      isFirstMessage, 
      currentAgent, 
      conversation 
    }: { 
      sessionId: string; 
      model: string; 
      message: string; 
      isFirstMessage: boolean; 
      currentAgent: string | null; 
      conversation: { role: "user" | "assistant"; content: string }[];
    }) => {
      let payload;
      if (isFirstMessage) {
        payload = {
          first_message: message,
          session_id: sessionId,
          model,
        };
      } else {
        payload = {
          first_message: null,
          current_agent: currentAgent,
          session_id: sessionId,
          model,
          conversation,
        };
      }
      
      const response = await apiRequest("POST", "/api/webhook", payload);
      return { response, sessionId };
    },
    onSuccess: async ({ response, sessionId }) => {
      const data = await response.json();
      
      const responseItem = Array.isArray(data) ? data[0] : data;
      
      const toolResponse = responseItem?.Tool_Request_Response || responseItem?.Tool_Call_Response;
      const intentAnalyzer = responseItem?.Intent_Analyzer_Response;
      const runtimePrompt = responseItem?.RunTime_Prompt_Response || responseItem?.Runtime_Prompt_Response;
      
      let errorMessage: string | undefined;
      if (toolResponse?.error) {
        errorMessage = typeof toolResponse.error === "string" 
          ? toolResponse.error 
          : JSON.stringify(toolResponse.error);
      }

      const extractCurrentAgent = (): string | null => {
        if (intentAnalyzer?.MTX_SELECTED_AGENT) {
          return String(intentAnalyzer.MTX_SELECTED_AGENT);
        }
        if (!runtimePrompt) return null;
        const promptArray = Array.isArray(runtimePrompt) ? runtimePrompt : [runtimePrompt];
        for (const item of promptArray) {
          if (item?.tool_calls?.[0]?.function?.name) {
            return item.tool_calls[0].function.name;
          }
        }
        return null;
      };

      const extractAssistantText = (): string => {
        if (runtimePrompt) {
          const promptArray = Array.isArray(runtimePrompt) ? runtimePrompt : [runtimePrompt];
          for (const item of promptArray) {
            if (item?.content && typeof item.content === "string" && item.content.trim()) {
              return item.content;
            }
          }
          for (const item of promptArray) {
            if (item?.message?.content && typeof item.message.content === "string") {
              return item.message.content;
            }
          }
        }
        if (intentAnalyzer?.MTX_REASONING) {
          return String(intentAnalyzer.MTX_REASONING);
        }
        if (toolResponse) {
          return "Retrieved data from tool call";
        }
        return "Response processed successfully";
      };

      const unwrapToolResponse = (resp: unknown): unknown[] | undefined => {
        if (!resp) return undefined;
        const items = Array.isArray(resp) ? resp : [resp];
        return items.map((item: unknown) => {
          if (item && typeof item === "object" && "json" in item) {
            return (item as { json: unknown }).json;
          }
          return item;
        });
      };

      const newAgent = extractCurrentAgent();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: extractAssistantText(),
        timestamp: Date.now(),
        toolResponse: unwrapToolResponse(toolResponse),
        intentAnalyzer,
        runtimePrompt,
        error: errorMessage,
      };

      addMessageToSession(sessionId, assistantMessage, newAgent);
      setState((prev) => {
        if (prev.activeSessionId === sessionId) {
          setSelectedMessageId(assistantMessage.id);
          setSidePaneOpen(true);
        }
        return prev;
      });
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Error processing request",
        timestamp: Date.now(),
        error: errorMessage,
      };

      addMessageToSession(variables.sessionId, assistantMessage);
    },
  });

  const handleSendMessage = (text: string) => {
    if (!selectedModel || !activeSession) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: Date.now(),
    };

    const existingMessages = activeSession.messages;
    const isFirstMessage = existingMessages.length === 0;
    const conversationWithNewMessage = buildConversationHistory([...existingMessages, userMessage]);

    addMessageToSession(activeSessionId, userMessage);
    sendMessageMutation.mutate({ 
      sessionId: activeSessionId, 
      model: selectedModel, 
      message: text,
      isFirstMessage,
      currentAgent: activeSession.currentAgent,
      conversation: conversationWithNewMessage,
    });
  };

  const handleMessageClick = (message: ChatMessage) => {
    setSelectedMessageId(message.id);
    if (message.intentAnalyzer || message.runtimePrompt) {
      setSidePaneOpen(true);
    }
  };

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (modelsQuery.error) {
      setGlobalError("Failed to load models. Please refresh the page.");
    }
  }, [modelsQuery.error]);

  return (
    <>
      <AppSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {globalError && (
          <ErrorBanner message={globalError} onDismiss={() => setGlobalError(null)} />
        )}

        <header className="shrink-0 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-semibold text-lg hidden sm:block">Cerebras Chat</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
                isLoading={modelsQuery.isLoading}
                error={modelsQuery.error ? "Failed to load" : null}
              />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            {messages.length === 0 ? (
              <EmptyState hasModel={!!selectedModel} />
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {messages.map((message) => (
                    <ChatMessageComponent
                      key={message.id}
                      message={message}
                      isSelected={message.id === selectedMessageId}
                      onClick={() => handleMessageClick(message)}
                    />
                  ))}
                  {sendMessageMutation.isPending && (
                    <div className="flex gap-3 p-4" data-testid="loading-bubble">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div className="bg-card border border-card-border rounded-lg px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}

            <MessageInput
              onSend={handleSendMessage}
              disabled={!selectedModel}
              isLoading={sendMessageMutation.isPending}
              placeholder={
                selectedModel
                  ? `Message ${selectedModel}...`
                  : "Select a model to start chatting"
              }
            />
          </div>

          <div 
            className={`
              transition-all duration-300 ease-in-out overflow-hidden
              ${sidePaneOpen ? "w-[400px] lg:w-[450px]" : "w-0"}
              hidden md:block
            `}
          >
            <SidePane
              intentAnalyzer={selectedMessage?.intentAnalyzer || null}
              runtimePrompt={selectedMessage?.runtimePrompt || null}
              onClose={() => setSidePaneOpen(false)}
              isOpen={sidePaneOpen}
            />
          </div>
        </div>

        {sidePaneOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
            <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-card border-t border-card-border rounded-t-xl overflow-hidden">
              <SidePane
                intentAnalyzer={selectedMessage?.intentAnalyzer || null}
                runtimePrompt={selectedMessage?.runtimePrompt || null}
                onClose={() => setSidePaneOpen(false)}
                isOpen={sidePaneOpen}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
