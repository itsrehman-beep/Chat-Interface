import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_INTENT_SYSTEM_PROMPT, DEFAULT_RUNTIME_SYSTEM_PROMPT } from "@shared/schema";

interface PromptEditorProps {
  intentSystemPrompt?: string;
  runtimeSystemPrompt?: string;
  onSave: (intentPrompt: string | undefined, runtimePrompt: string | undefined) => void;
  disabled?: boolean;
}

export function PromptEditor({ 
  intentSystemPrompt, 
  runtimeSystemPrompt, 
  onSave,
  disabled 
}: PromptEditorProps) {
  const [open, setOpen] = useState(false);
  const [intentPrompt, setIntentPrompt] = useState(intentSystemPrompt || "");
  const [runtimePrompt, setRuntimePrompt] = useState(runtimeSystemPrompt || "");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setIntentPrompt(intentSystemPrompt || "");
      setRuntimePrompt(runtimeSystemPrompt || "");
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    const finalIntentPrompt = intentPrompt.trim() && intentPrompt.trim() !== DEFAULT_INTENT_SYSTEM_PROMPT.trim() 
      ? intentPrompt.trim() 
      : undefined;
    const finalRuntimePrompt = runtimePrompt.trim() && runtimePrompt.trim() !== DEFAULT_RUNTIME_SYSTEM_PROMPT.trim()
      ? runtimePrompt.trim()
      : undefined;
    
    onSave(finalIntentPrompt, finalRuntimePrompt);
    setOpen(false);
  };

  const handleReset = () => {
    setIntentPrompt("");
    setRuntimePrompt("");
  };

  const hasCustomPrompts = intentSystemPrompt || runtimeSystemPrompt;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasCustomPrompts ? "secondary" : "ghost"} 
          size="icon"
          disabled={disabled}
          data-testid="button-prompt-editor"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>System Prompts</DialogTitle>
          <DialogDescription>
            Customize the system prompts for this conversation. Leave empty to use defaults.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="intent" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="intent" data-testid="tab-intent-prompt">
              Intent Analyzer
              {intentPrompt && <span className="ml-1 w-2 h-2 bg-primary rounded-full" />}
            </TabsTrigger>
            <TabsTrigger value="runtime" data-testid="tab-runtime-prompt">
              Runtime Prompt
              {runtimePrompt && <span className="ml-1 w-2 h-2 bg-primary rounded-full" />}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="intent" className="flex-1 overflow-hidden flex flex-col mt-4">
            <Label htmlFor="intent-prompt" className="mb-2">Intent System Prompt</Label>
            <Textarea
              id="intent-prompt"
              value={intentPrompt}
              onChange={(e) => setIntentPrompt(e.target.value)}
              placeholder={DEFAULT_INTENT_SYSTEM_PROMPT}
              className="flex-1 min-h-[200px] resize-none font-mono text-sm"
              data-testid="textarea-intent-prompt"
            />
          </TabsContent>
          
          <TabsContent value="runtime" className="flex-1 overflow-hidden flex flex-col mt-4">
            <Label htmlFor="runtime-prompt" className="mb-2">Runtime System Prompt</Label>
            <Textarea
              id="runtime-prompt"
              value={runtimePrompt}
              onChange={(e) => setRuntimePrompt(e.target.value)}
              placeholder={DEFAULT_RUNTIME_SYSTEM_PROMPT}
              className="flex-1 min-h-[200px] resize-none font-mono text-sm"
              data-testid="textarea-runtime-prompt"
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReset} data-testid="button-reset-prompts">
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} data-testid="button-save-prompts">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
