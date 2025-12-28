import { User, Bot, AlertCircle, Image as ImageIcon, DollarSign, CreditCard, FileText, Calendar, ArrowRightLeft, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  message: ChatMessageType;
  isSelected: boolean;
  onClick: () => void;
}

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function renderFormattedText(text: string): JSX.Element[] {
  const cleanText = stripThinkTags(text);
  const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index} className="font-semibold">{boldText}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
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
    lower.includes("logourl") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lower)
  );
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function detectResponseType(obj: Record<string, unknown>): string {
  if ('items' in obj && 'total' in obj && 'page' in obj && 'total_pages' in obj) {
    return 'PaginatedResponse';
  }
  if ('TransactionId' in obj && 'Amount' in obj) {
    return 'Transaction';
  }
  if ('AccountId' in obj && 'CalculatedBalance' in obj) {
    return 'BalanceResponse';
  }
  if ('CustomerId' in obj && 'FirstName' in obj && 'LastName' in obj) {
    return 'CustomerResponse';
  }
  if ('BillId' in obj && 'Amount' in obj && 'DueDate' in obj) {
    return 'Bill';
  }
  if ('DocumentId' in obj && 'DocumentType' in obj) {
    return 'DocumentResponse';
  }
  if ('FromCurrency' in obj && 'ToCurrency' in obj && 'Rate' in obj) {
    return 'ExchangeRate';
  }
  if ('BeneficiaryId' in obj || ('BeneficiaryName' in obj && 'AccountNumber' in obj)) {
    return 'Beneficiary';
  }
  if ('SessionId' in obj && 'ExpiryTime' in obj) {
    return 'LoginResponse';
  }
  if ('RequestId' in obj && 'Status' in obj) {
    return 'WorkflowResponse';
  }
  return 'Generic';
}

function renderTransaction(tx: Record<string, unknown>, index: number) {
  const amount = tx.Amount as number;
  const isCredit = amount > 0;
  const currency = (tx.Currency as string) || 'USD';
  
  return (
    <div key={index} className="bg-card border border-card-border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isCredit ? (
            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
              <ArrowRightLeft className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
              <CreditCard className="h-3 w-3 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{tx.Description as string || tx.Subtype as string || 'Transaction'}</p>
            <p className="text-xs text-muted-foreground">{tx.Type as string} - {tx.Subtype as string}</p>
          </div>
        </div>
        <div className={cn("text-sm font-semibold", isCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
          {isCredit ? '+' : ''}{formatCurrency(amount, currency)}
        </div>
      </div>
      {typeof tx.DateTime === 'string' && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(tx.DateTime)}
        </p>
      )}
      <p className="text-xs text-muted-foreground font-mono">ID: {tx.TransactionId as string}</p>
    </div>
  );
}

function renderBalance(obj: Record<string, unknown>, index: number) {
  const balance = obj.CalculatedBalance as number;
  const currency = (obj.Currency as string) || 'USD';
  
  return (
    <div key={index} className="bg-card border border-card-border rounded-md p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Account Balance</p>
          <p className="text-xl font-bold">{formatCurrency(balance, currency)}</p>
          <p className="text-xs text-muted-foreground font-mono">Account: {obj.AccountId as string}</p>
        </div>
      </div>
    </div>
  );
}

function renderPaginatedResponse(obj: Record<string, unknown>, index: number) {
  const items = obj.items as unknown[];
  const total = obj.total as number;
  const page = obj.page as number;
  const totalPages = obj.total_pages as number;
  
  return (
    <div key={index} className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {total} total items
        </Badge>
        <Badge variant="outline" className="text-xs">
          Page {page} of {totalPages}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.map((item, itemIndex) => {
          if (typeof item === 'object' && item !== null) {
            const itemObj = item as Record<string, unknown>;
            const type = detectResponseType(itemObj);
            if (type === 'Transaction') {
              return renderTransaction(itemObj, itemIndex);
            }
            return renderGenericObject(itemObj, itemIndex);
          }
          return null;
        })}
      </div>
    </div>
  );
}

function renderCustomer(obj: Record<string, unknown>, index: number) {
  return (
    <div key={index} className="bg-card border border-card-border rounded-md p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-secondary/10">
          <User className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">{obj.FirstName as string} {obj.LastName as string}</p>
          <p className="text-sm text-muted-foreground">{obj.Email as string}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{obj.Status as string}</Badge>
            <span className="text-xs text-muted-foreground font-mono">ID: {obj.CustomerId as string}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBeneficiary(obj: Record<string, unknown>, index: number) {
  return (
    <div key={index} className="bg-card border border-card-border rounded-md p-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-medium">{obj.BeneficiaryName as string || obj.Name as string || 'Beneficiary'}</p>
          {typeof obj.AccountNumber === 'string' && (
            <p className="text-sm text-muted-foreground font-mono">{obj.AccountNumber}</p>
          )}
          {typeof obj.BankName === 'string' && (
            <p className="text-xs text-muted-foreground">{obj.BankName}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {typeof obj.BeneficiaryId === 'string' && (
              <span className="text-xs text-muted-foreground font-mono">ID: {obj.BeneficiaryId}</span>
            )}
            {typeof obj.Status === 'string' && (
              <Badge variant="outline" className="text-xs">{obj.Status}</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBill(obj: Record<string, unknown>, index: number) {
  const amount = obj.Amount as number;
  const currency = (obj.Currency as string) || 'USD';
  const status = obj.Status as string;
  
  return (
    <div key={index} className="bg-card border border-card-border rounded-md p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30">
            <FileText className="h-3 w-3 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium">{obj.BillerName as string || 'Bill'}</p>
            <p className="text-xs text-muted-foreground">Due: {obj.DueDate as string}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{formatCurrency(amount, currency)}</p>
          <Badge variant={status === 'Paid' ? 'default' : 'secondary'} className="text-xs">
            {status}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function renderExchangeRate(obj: Record<string, unknown>, index: number) {
  return (
    <div key={index} className="bg-card border border-card-border rounded-md p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Exchange Rate</p>
          <p className="font-medium">{obj.FromCurrency as string} to {obj.ToCurrency as string}</p>
          <p className="text-lg font-bold">{obj.Rate as number}</p>
          {typeof obj.Example === 'string' && <p className="text-xs text-muted-foreground">{obj.Example}</p>}
        </div>
      </div>
    </div>
  );
}

function renderGenericObject(obj: Record<string, unknown>, index: number) {
  const importantKeys = ['AccountId', 'CustomerId', 'TransactionId', 'Amount', 'Balance', 'Status', 'Name', 'Email', 'message'];
  const sortedEntries = Object.entries(obj).sort(([a], [b]) => {
    const aImportant = importantKeys.some(k => a.toLowerCase().includes(k.toLowerCase()));
    const bImportant = importantKeys.some(k => b.toLowerCase().includes(k.toLowerCase()));
    if (aImportant && !bImportant) return -1;
    if (!aImportant && bImportant) return 1;
    return 0;
  });

  return (
    <div 
      key={index} 
      className="bg-card border border-card-border rounded-md p-3 space-y-1.5"
    >
      {sortedEntries.map(([key, value]) => {
        if (value === null || value === undefined) return null;
        
        const isImage = isImageUrl(key) || (typeof value === "string" && isImageUrl(value));
        const isAmount = key.toLowerCase().includes('amount') || key.toLowerCase().includes('balance');
        const isDate = key.toLowerCase().includes('date') || key.toLowerCase().includes('time');
        const isCurrency = key.toLowerCase() === 'currency';
        
        let displayValue: string | JSX.Element;
        
        if (isImage && typeof value === "string") {
          displayValue = (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 shrink-0">
                <img src={value} alt={key} className="object-cover" />
                <AvatarFallback><ImageIcon className="h-3 w-3" /></AvatarFallback>
              </Avatar>
              <span className="text-foreground truncate max-w-[200px]" title={value}>{value}</span>
            </div>
          );
        } else if (isAmount && typeof value === 'number') {
          displayValue = formatCurrency(value);
        } else if (isDate && typeof value === 'string') {
          displayValue = formatDate(value);
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          return (
            <div key={key} className="space-y-2">
              <span className="text-muted-foreground text-sm">{key}: ({value.length} items)</span>
              <div className="space-y-2 pl-2 border-l-2 border-border">
                {value.map((item, itemIndex) => {
                  if (typeof item === 'object' && item !== null) {
                    return renderSingleItem(item as Record<string, unknown>, index * 1000 + itemIndex);
                  }
                  return null;
                })}
              </div>
            </div>
          );
        } else if (typeof value === "object") {
          displayValue = JSON.stringify(value, null, 2);
        } else {
          displayValue = String(value);
        }
        
        return (
          <div key={key} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground shrink-0 min-w-[100px]">{key}:</span>
            {typeof displayValue === 'string' ? (
              <span className={cn(
                "text-foreground break-all",
                isAmount && "font-semibold",
                isCurrency && "font-mono"
              )}>{displayValue}</span>
            ) : displayValue}
          </div>
        );
      })}
    </div>
  );
}

function renderSingleItem(obj: Record<string, unknown>, index: number): JSX.Element {
  const type = detectResponseType(obj);
  
  switch (type) {
    case 'PaginatedResponse':
      return renderPaginatedResponse(obj, index);
    case 'Transaction':
      return renderTransaction(obj, index);
    case 'BalanceResponse':
      return renderBalance(obj, index);
    case 'CustomerResponse':
      return renderCustomer(obj, index);
    case 'Bill':
      return renderBill(obj, index);
    case 'ExchangeRate':
      return renderExchangeRate(obj, index);
    case 'Beneficiary':
      return renderBeneficiary(obj, index);
    default:
      return renderGenericObject(obj, index);
  }
}

function renderToolResponse(item: unknown, index: number): JSX.Element | JSX.Element[] | null {
  if (Array.isArray(item)) {
    return item.map((subItem, subIndex) => {
      if (typeof subItem === 'object' && subItem !== null) {
        return renderSingleItem(subItem as Record<string, unknown>, index * 1000 + subIndex);
      }
      return null;
    }).filter(Boolean) as JSX.Element[];
  }
  
  if (typeof item === 'object' && item !== null) {
    return renderSingleItem(item as Record<string, unknown>, index);
  }
  
  return null;
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
          <p className="text-sm whitespace-pre-wrap">{renderFormattedText(message.text)}</p>
        </div>

        {hasError && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{message.error}</span>
          </div>
        )}

        {hasToolResponse && (
          <div className="w-full space-y-2">
            {message.toolResponse.map((tool: unknown, index: number) => 
              renderToolResponse(tool, index)
            )}
          </div>
        )}

        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
