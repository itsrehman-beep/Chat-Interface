import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModelSelector } from "@/components/model-selector";
import { ChatMessageComponent } from "@/components/chat-message";
import { MessageInput } from "@/components/message-input";
import { SidePane } from "@/components/side-pane";
import { LoadingOverlay } from "@/components/loading-overlay";
import { ErrorBanner } from "@/components/error-banner";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ChatMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Brain } from "lucide-react";

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sidePaneOpen, setSidePaneOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modelsQuery = useQuery<{ data: { id: string }[] }>({
    queryKey: ["/api/models"],
  });

  const models = modelsQuery.data?.data?.map((m) => m.id) || [];

  const sendMessageMutation = useMutation({
    mutationFn: async ({ model, message }: { model: string; message: string }) => {
      return apiRequest("POST", "/api/webhook", {
        model_name: model,
        first_message: message,
      });
    },
    onSuccess: async (response, variables) => {
      const data = await response.json();
      
      const responseItem = Array.isArray(data) ? data[0] : data;
      
      const toolResponse = responseItem?.Tool_Call_Response;
      const intentAnalyzer = responseItem?.Intent_Analyzer_Response;
      const runtimePrompt = responseItem?.Runtime_Prompt_Response;
      
      let errorMessage: string | undefined;
      if (toolResponse?.error) {
        errorMessage = typeof toolResponse.error === "string" 
          ? toolResponse.error 
          : JSON.stringify(toolResponse.error);
      }

      const extractAssistantText = (): string => {
        if (runtimePrompt?.response) {
          return String(runtimePrompt.response);
        }
        if (runtimePrompt?.content) {
          return String(runtimePrompt.content);
        }
        if (runtimePrompt?.message) {
          return String(runtimePrompt.message);
        }
        if (intentAnalyzer?.response) {
          return String(intentAnalyzer.response);
        }
        if (intentAnalyzer?.intent) {
          return `Intent: ${intentAnalyzer.intent}`;
        }
        if (toolResponse) {
          const tools = Array.isArray(toolResponse) ? toolResponse : [toolResponse];
          if (tools.length > 0) {
            return `Retrieved ${tools.length} result${tools.length > 1 ? "s" : ""} from tool call`;
          }
        }
        return "Response processed successfully";
      };

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: extractAssistantText(),
        timestamp: Date.now(),
        toolResponse: Array.isArray(toolResponse) ? toolResponse : toolResponse ? [toolResponse] : undefined,
        intentAnalyzer,
        runtimePrompt,
        error: errorMessage,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSelectedMessageId(assistantMessage.id);
      setSidePaneOpen(true);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Error processing request",
        timestamp: Date.now(),
        error: errorMessage,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    },
  });

  const handleSendMessage = (text: string) => {
    if (!selectedModel) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessageMutation.mutate({ model: selectedModel, message: text });
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
    <div className="h-screen flex flex-col bg-background">
      {globalError && (
        <ErrorBanner message={globalError} onDismiss={() => setGlobalError(null)} />
      )}

      <LoadingOverlay 
        isVisible={sendMessageMutation.isPending} 
        message="Processing your message..." 
      />

      <header className="shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
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
  );
}
