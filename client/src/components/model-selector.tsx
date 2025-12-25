import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Cpu } from "lucide-react";

interface ModelSelectorProps {
  models: string[];
  selectedModel: string | null;
  onModelSelect: (model: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function ModelSelector({ models, selectedModel, onModelSelect, isLoading, error }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Cpu className="h-4 w-4" />
        <span className="text-sm font-medium">Model</span>
      </div>
      <Select
        value={selectedModel || ""}
        onValueChange={onModelSelect}
        disabled={isLoading || models.length === 0}
      >
        <SelectTrigger 
          className="w-[240px] bg-background border-border"
          data-testid="select-model"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading models...</span>
            </div>
          ) : error ? (
            <span className="text-destructive">Error loading models</span>
          ) : (
            <SelectValue placeholder="Select a model" />
          )}
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem 
              key={model} 
              value={model}
              data-testid={`select-model-option-${model}`}
            >
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
