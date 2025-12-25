import { MessageSquare, Cpu } from "lucide-react";

interface EmptyStateProps {
  hasModel: boolean;
}

export function EmptyState({ hasModel }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md space-y-4">
        {hasModel ? (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Start a Conversation</h3>
            <p className="text-muted-foreground text-sm">
              Type a message below to interact with the selected Cerebras model. Your messages will be processed through the n8n webhook.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
              <Cpu className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold">Select a Model</h3>
            <p className="text-muted-foreground text-sm">
              Choose a Cerebras model from the dropdown above to start chatting. Available models include various LLaMA and other powerful AI models.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
