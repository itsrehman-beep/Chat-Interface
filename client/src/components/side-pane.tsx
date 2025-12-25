import { useState } from "react";
import { ChevronDown, ChevronRight, X, Zap, Brain, Coins, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidePaneProps {
  intentAnalyzer: Record<string, unknown> | null;
  runtimePrompt: Record<string, unknown> | null;
  onClose: () => void;
  isOpen: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  data: Record<string, unknown> | null;
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

function CollapsibleSection({ title, icon, data, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!data) return null;

  const usage = data.usage as Record<string, unknown> | undefined;
  const reasoningDetails = data.reasoning_details as unknown;
  const otherFields = Object.entries(data).filter(
    ([key]) => key !== "usage" && key !== "reasoning_details"
  );

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
        <div className="p-4 space-y-4 bg-card/50">
          {otherFields.map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {key.replace(/_/g, " ")}
              </label>
              <div className="font-mono text-sm">{renderValue(value)}</div>
            </div>
          ))}

          {reasoningDetails !== undefined && reasoningDetails !== null ? (
            <ReasoningDetailsSection data={reasoningDetails} />
          ) : null}

          {usage && (
            <UsageSection usage={usage} />
          )}
        </div>
      )}
    </div>
  );
}

function ReasoningDetailsSection({ data }: { data: unknown }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-2 bg-muted/20 text-left hover-elevate"
        data-testid="button-expand-reasoning-details"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <Brain className="h-3 w-3 text-secondary" />
        <span className="text-xs font-medium">Reasoning Details</span>
      </button>
      {isOpen && (
        <div className="p-3 bg-muted/10 font-mono text-xs">
          {renderValue(data)}
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
        <div className="p-4 space-y-4">
          {!hasData ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select a message to view details</p>
            </div>
          ) : (
            <>
              <CollapsibleSection
                title="Intent Analyzer Response"
                icon={<Zap className="h-4 w-4 text-primary" />}
                data={intentAnalyzer}
                defaultOpen={true}
              />
              <CollapsibleSection
                title="Runtime Prompt Response"
                icon={<Brain className="h-4 w-4 text-secondary" />}
                data={runtimePrompt}
                defaultOpen={true}
              />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
