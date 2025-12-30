import { useState } from "react";
import { ChevronDown, ChevronRight, X, Zap, Brain, Coins, Clock, Wrench, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidePaneProps {
  intentAnalyzer: Record<string, unknown> | null;
  runtimePrompt: unknown[] | Record<string, unknown> | null;
  onClose: () => void;
  isOpen: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-xs">
        {String(value)}
      </Badge>
    );
  }
  
  if (typeof value === "number") {
    return <span className="text-accent">{value.toLocaleString()}</span>;
  }
  
  if (typeof value === "string") {
    if (value.length > 200) {
      return (
        <div className="bg-muted/30 rounded p-2 mt-1 text-sm whitespace-pre-wrap break-words">
          {value}
        </div>
      );
    }
    return <span className="text-foreground">{value}</span>;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">[]</span>;
    }
    return (
      <div className="space-y-1 mt-1">
        {value.map((item, index) => (
          <div key={index} className="pl-4 border-l border-border">
            <span className="text-muted-foreground text-xs">[{index}]</span>
            <div className="ml-2">{renderValue(item, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof value === "object") {
    return (
      <div className="space-y-1 mt-1">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="pl-4 border-l border-border">
            <span className="text-muted-foreground font-mono text-xs">{k}:</span>
            <div className="ml-2">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }
  
  return <span className="text-foreground">{String(value)}</span>;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-3 bg-muted/30 text-left hover-elevate transition-colors"
        data-testid={`button-expand-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        {icon}
        <span className="font-medium text-sm">{title}</span>
      </button>

      {isOpen && (
        <div className="p-4 bg-card/50">
          {children}
        </div>
      )}
    </div>
  );
}

function UsageSection({ usage }: { usage: Record<string, unknown> }) {
  const promptTokens = usage.prompt_tokens as number | undefined;
  const completionTokens = usage.completion_tokens as number | undefined;
  const totalTokens = usage.total_tokens as number | undefined;
  const cost = usage.cost as number | undefined;
  const latency = usage.latency_ms as number | undefined;

  return (
    <div className="bg-muted/30 rounded-md p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <Coins className="h-3 w-3" />
        Usage & Cost
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {promptTokens !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prompt:</span>
            <span className="font-mono">{promptTokens.toLocaleString()}</span>
          </div>
        )}
        {completionTokens !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completion:</span>
            <span className="font-mono">{completionTokens.toLocaleString()}</span>
          </div>
        )}
        {totalTokens !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono font-medium">{totalTokens.toLocaleString()}</span>
          </div>
        )}
        {cost !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cost:</span>
            <span className="font-mono text-accent">${cost.toFixed(6)}</span>
          </div>
        )}
        {latency !== undefined && (
          <div className="flex justify-between col-span-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Latency:
            </span>
            <span className="font-mono">{latency}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

function IntentAnalyzerSection({ data }: { data: Record<string, unknown> }) {
  const reasoning = data.MTX_REASONING as string | undefined;
  const selectedAgent = data.MTX_SELECTED_AGENT as string | undefined;
  const userQuery = data.MTX_USER_QUERY as string | undefined;
  const llm = data.MTX_LLM as string | undefined;
  const inputTokens = data.MTX_INPUT_TOKENS as number | undefined;
  const outputTokens = data.MTX_OUTPUT_TOKENS as number | undefined;
  const processedDate = data.MTX_PROCESSED_DATE as string | undefined;
  const sessionId = data.MTX_SESSION_ID as string | undefined;

  return (
    <div className="space-y-4">
      {selectedAgent && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Wrench className="h-3 w-3 mr-1" />
            {selectedAgent}
          </Badge>
        </div>
      )}

      {reasoning && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Reasoning
          </label>
          <div className="bg-muted/30 rounded-md p-3 text-sm whitespace-pre-wrap">
            {reasoning}
          </div>
        </div>
      )}

      <CollapsibleSection
        title="Details"
        icon={<Zap className="h-4 w-4 text-primary" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {userQuery && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                User Query
              </label>
              <div className="font-mono text-sm">{userQuery}</div>
            </div>
          )}
          {llm && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                LLM
              </label>
              <div className="font-mono text-sm">{llm}</div>
            </div>
          )}
          {sessionId && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Session ID
              </label>
              <div className="font-mono text-sm text-muted-foreground">{sessionId}</div>
            </div>
          )}
          {processedDate && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Processed Date
              </label>
              <div className="font-mono text-sm">{processedDate}</div>
            </div>
          )}
          {(inputTokens !== undefined || outputTokens !== undefined) && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {inputTokens !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Input Tokens:</span>
                  <span className="font-mono">{inputTokens.toLocaleString()}</span>
                </div>
              )}
              {outputTokens !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Output Tokens:</span>
                  <span className="font-mono">{outputTokens.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

function extractThinkContent(content: string): string | null {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    return thinkMatch[1].trim();
  }
  if (content.startsWith("<think>")) {
    let extracted = content.replace(/^<think>\s*/, "");
    extracted = extracted.replace(/\s*<\/think>\s*$/, "");
    return extracted.trim() || null;
  }
  return null;
}

function normalizeReasoning(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}

function extractTextFromContentField(content: unknown): string | null {
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  
  if (Array.isArray(content)) {
    const texts: string[] = [];
    for (const item of content) {
      if (typeof item === "string" && item.trim()) {
        texts.push(item.trim());
      } else if (item && typeof item === "object") {
        const itemObj = item as Record<string, unknown>;
        if (itemObj.text && typeof itemObj.text === "string" && itemObj.text.trim()) {
          texts.push(itemObj.text.trim());
        }
        if (itemObj.content && typeof itemObj.content === "string" && itemObj.content.trim()) {
          texts.push(itemObj.content.trim());
        }
      }
    }
    return texts.length > 0 ? texts.join("\n") : null;
  }
  
  return null;
}

function extractReasoningsFromStep(itemObj: Record<string, unknown>): string[] {
  const reasonings: string[] = [];
  
  if (itemObj.reasoning && typeof itemObj.reasoning === "string" && itemObj.reasoning.trim()) {
    reasonings.push(itemObj.reasoning.trim());
  }
  
  const reasoningDetails = itemObj.reasoning_details;
  if (Array.isArray(reasoningDetails)) {
    for (const rd of reasoningDetails) {
      if (rd && typeof rd === "object") {
        const rdObj = rd as Record<string, unknown>;
        if (rdObj.text && typeof rdObj.text === "string" && rdObj.text.trim()) {
          reasonings.push(rdObj.text.trim());
        }
        const contentText = extractTextFromContentField(rdObj.content);
        if (contentText) {
          reasonings.push(contentText);
        }
      }
    }
  }
  
  if (itemObj.content) {
    const contentText = extractTextFromContentField(itemObj.content);
    if (contentText) {
      const thinkContent = extractThinkContent(contentText);
      if (thinkContent) {
        reasonings.push(thinkContent);
      }
    }
  }
  
  if (itemObj.message && typeof itemObj.message === "object") {
    const msgObj = itemObj.message as Record<string, unknown>;
    const msgContentText = extractTextFromContentField(msgObj.content);
    if (msgContentText) {
      const thinkContent = extractThinkContent(msgContentText);
      if (thinkContent) {
        reasonings.push(thinkContent);
      }
    }
  }
  
  return reasonings;
}

function extractWidgetType(content: unknown): { type: string; props?: Record<string, unknown> } | null {
  if (!content) return null;
  
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    if (typeof obj.type === "string" && obj.type.includes("widget")) {
      return {
        type: obj.type,
        props: obj.props as Record<string, unknown> | undefined,
      };
    }
  }
  
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === "object" && parsed !== null && typeof parsed.type === "string" && parsed.type.includes("widget")) {
        return {
          type: parsed.type,
          props: parsed.props,
        };
      }
    } catch {
      // Not JSON, ignore
    }
  }
  
  if (Array.isArray(content)) {
    for (const item of content) {
      const result = extractWidgetType(item);
      if (result) return result;
    }
  }
  
  return null;
}

function RuntimePromptSection({ data }: { data: unknown[] | Record<string, unknown> }) {
  const promptArray = Array.isArray(data) ? data : [data];
  
  const allReasonings: string[] = [];
  const seenReasoningKeys = new Set<string>();
  const allToolCalls: { name: string; arguments: string }[] = [];
  const allUsages: Record<string, unknown>[] = [];
  let finalContent = "";
  let widgetInfo: { type: string; props?: Record<string, unknown> } | null = null;

  for (const item of promptArray) {
    if (!item || typeof item !== "object") continue;
    const itemObj = item as Record<string, unknown>;
    
    const stepReasonings = extractReasoningsFromStep(itemObj);
    for (const reasoning of stepReasonings) {
      const normalizedKey = normalizeReasoning(reasoning);
      if (!seenReasoningKeys.has(normalizedKey)) {
        seenReasoningKeys.add(normalizedKey);
        allReasonings.push(reasoning);
      }
    }
    
    const contentText = extractTextFromContentField(itemObj.content);
    if (contentText) {
      const cleanContent = contentText.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*/g, "").trim();
      if (cleanContent) {
        finalContent = cleanContent;
      }
    }
    
    if (!widgetInfo) {
      widgetInfo = extractWidgetType(itemObj.content);
    }
    
    if (!finalContent && itemObj.message && typeof itemObj.message === "object") {
      const msgObj = itemObj.message as Record<string, unknown>;
      const msgContentText = extractTextFromContentField(msgObj.content);
      if (msgContentText) {
        const cleanContent = msgContentText.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*/g, "").trim();
        if (cleanContent) {
          finalContent = cleanContent;
        }
      }
      if (!widgetInfo) {
        widgetInfo = extractWidgetType(msgObj.content);
      }
    }
    
    const toolCalls = itemObj.tool_calls as Array<{ function?: { name?: string; arguments?: string } }> | undefined;
    if (toolCalls && Array.isArray(toolCalls)) {
      for (const tc of toolCalls) {
        if (tc.function?.name) {
          allToolCalls.push({
            name: tc.function.name,
            arguments: tc.function.arguments || "{}",
          });
        }
      }
    }
    
    if (itemObj.usage && typeof itemObj.usage === "object") {
      allUsages.push(itemObj.usage as Record<string, unknown>);
    }
  }

  return (
    <div className="space-y-4">
      {widgetInfo && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <LayoutGrid className="h-3 w-3 text-primary" />
            Widget Selected
          </label>
          <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
            <Badge variant="default" className="text-sm font-mono" data-testid="badge-widget-type">
              {widgetInfo.type}
            </Badge>
            {widgetInfo.props && (
              <div className="mt-2 text-xs text-muted-foreground">
                {Object.keys(widgetInfo.props).length} prop{Object.keys(widgetInfo.props).length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}

      {allReasonings.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Brain className="h-3 w-3 text-secondary" />
            Reasoning
          </label>
          <div className="space-y-2">
            {allReasonings.map((reasoning, idx) => (
              <div key={idx} className="bg-secondary/10 border border-secondary/20 rounded-md p-3 text-sm whitespace-pre-wrap">
                {reasoning}
              </div>
            ))}
          </div>
        </div>
      )}

      {allToolCalls.length > 0 && (
        <CollapsibleSection
          title={`Tool Calls (${allToolCalls.length})`}
          icon={<Wrench className="h-4 w-4 text-accent" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {allToolCalls.map((tc, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {tc.name}
                  </Badge>
                </div>
                <pre className="bg-muted/30 rounded p-2 text-xs overflow-x-auto">
                  {tc.arguments}
                </pre>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {finalContent && (
        <CollapsibleSection
          title="Final Response"
          icon={<Brain className="h-4 w-4 text-secondary" />}
          defaultOpen={false}
        >
          <div className="bg-muted/30 rounded-md p-3 text-sm whitespace-pre-wrap font-mono">
            {finalContent}
          </div>
        </CollapsibleSection>
      )}

      {allUsages.length > 0 && (
        <CollapsibleSection
          title="Usage Statistics"
          icon={<Coins className="h-4 w-4 text-muted-foreground" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {allUsages.map((usage, idx) => (
              <div key={idx}>
                {allUsages.length > 1 && (
                  <div className="text-xs text-muted-foreground mb-2">Step {idx + 1}</div>
                )}
                <UsageSection usage={usage} />
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

export function SidePane({ intentAnalyzer, runtimePrompt, onClose, isOpen }: SidePaneProps) {
  if (!isOpen) return null;

  const hasData = intentAnalyzer || runtimePrompt;

  return (
    <div className="h-full flex flex-col bg-card border-l border-card-border">
      <div className="flex items-center justify-between p-4 border-b border-card-border">
        <h2 className="font-semibold text-sm">Response Inspector</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-inspector"
          aria-label="Close inspector"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {!hasData ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select a message to view details</p>
            </div>
          ) : (
            <>
              {intentAnalyzer && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="h-4 w-4 text-primary" />
                    Intent Analyzer
                  </div>
                  <IntentAnalyzerSection data={intentAnalyzer} />
                </div>
              )}
              
              {runtimePrompt && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Brain className="h-4 w-4 text-secondary" />
                    Runtime Prompt
                  </div>
                  <RuntimePromptSection data={runtimePrompt} />
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
