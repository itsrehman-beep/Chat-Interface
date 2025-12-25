import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 p-4 bg-destructive text-destructive-foreground"
      role="alert"
      data-testid="error-banner"
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="shrink-0 text-destructive-foreground hover:bg-destructive-foreground/10"
          data-testid="button-dismiss-error"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
