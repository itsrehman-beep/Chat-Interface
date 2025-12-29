import { User, Bot, AlertCircle, Image as ImageIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  message: ChatMessageType;
  isSelected: boolean;
  onClick: () => void;
}

interface PaginatedResponse {
  items: Record<string, unknown>[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

function isPaginatedResponse(obj: unknown): obj is { items: unknown[]; total: number; page: number; limit: number; total_pages: number } {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    Array.isArray(o.items) &&
    typeof o.total === "number" &&
    typeof o.page === "number" &&
    typeof o.limit === "number" &&
    typeof o.total_pages === "number"
  );
}

function normalizePaginatedResponse(obj: Record<string, unknown>): PaginatedResponse | null {
  if (!isPaginatedResponse(obj)) return null;
  
  const items = obj.items.filter(
    (item): item is Record<string, unknown> => 
      typeof item === "object" && item !== null
  );
  
  return {
    items,
    pagination: {
      total: obj.total,
      page: obj.page,
      limit: obj.limit,
      total_pages: obj.total_pages,
    },
  };
}

function isImageUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const lower = value.toLowerCase();
  return (
    lower.includes("imageurl") ||
    lower.includes("image_url") ||
    lower.includes("avatar") ||
    lower.includes("photo") ||
    lower.includes("picture") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lower)
  );
}

function renderKeyValue(key: string, value: unknown) {
  const valueStr = typeof value === "object" ? JSON.stringify(value) : String(value);
  const isImage = isImageUrl(key) || (typeof value === "string" && isImageUrl(value));
  
  return (
    <div key={key} className="flex items-start gap-2 break-all">
      <span className="text-muted-foreground shrink-0">{key}:</span>
      {isImage && typeof value === "string" ? (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <img 
              src={value} 
              alt={key}
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <AvatarFallback>
              <ImageIcon className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-foreground truncate max-w-[200px]" title={valueStr}>
            {valueStr}
          </span>
        </div>
      ) : (
        <span className="text-foreground">{valueStr}</span>
      )}
    </div>
  );
}

function renderToolObject(obj: Record<string, unknown>, index: number) {
  return (
    <div 
      key={index} 
      className="bg-muted/50 rounded-md p-3 space-y-1 font-mono text-sm"
    >
      {Object.entries(obj).map(([key, value]) => renderKeyValue(key, value))}
    </div>
  );
}

function renderPaginatedResponse(paginated: PaginatedResponse, index: number) {
  const { items, pagination } = paginated;
  
  return (
    <div key={index} className="space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ChevronRight className="h-3 w-3" />
          <span>{pagination.total} results</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          Page {pagination.page} of {pagination.total_pages}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {items.map((item, itemIndex) => (
          <div 
            key={itemIndex}
            className="bg-muted/50 rounded-md p-3 space-y-1 font-mono text-sm border-l-2 border-secondary/50"
          >
            {Object.entries(item).map(([key, value]) => renderKeyValue(key, value))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatMessageComponent({ message, isSelected, onClick }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasToolResponse = message.toolResponse && Array.isArray(message.toolResponse) && message.toolResponse.length > 0;
  const hasError = !!message.error;

  return (
    <div
      className={cn(
        "group flex gap-3 p-4 rounded-lg transition-colors cursor-pointer",
        isUser ? "flex-row-reverse" : "flex-row",
        isSelected && "bg-primary/10 ring-2 ring-primary/30",
        !isSelected && "hover-elevate"
      )}
      onClick={onClick}
      data-testid={`chat-message-${message.id}`}
    >
      <Avatar className={cn(
        "h-8 w-8 shrink-0",
        isUser ? "bg-primary" : "bg-secondary"
      )}>
        <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn(
        "flex flex-col gap-2 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-card border border-card-border"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>

        {hasError && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{message.error}</span>
          </div>
        )}

        {hasToolResponse && (
          <div className="w-full space-y-2">
            {message.toolResponse.map((tool: unknown, index: number) => {
              if (typeof tool === "object" && tool !== null) {
                const toolObj = tool as Record<string, unknown>;
                const paginated = normalizePaginatedResponse(toolObj);
                if (paginated) {
                  return renderPaginatedResponse(paginated, index);
                }
                return renderToolObject(toolObj, index);
              }
              return null;
            })}
          </div>
        )}

        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
