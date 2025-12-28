import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import type { ChatSession } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function AppSidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
}: AppSidebarProps) {
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <Button
          onClick={onNewSession}
          className="w-full justify-start gap-2"
          data-testid="button-new-chat"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sortedSessions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                sortedSessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      onClick={() => onSessionSelect(session.id)}
                      className={cn(
                        "w-full justify-between group",
                        activeSessionId === session.id && "bg-sidebar-accent"
                      )}
                      data-testid={`button-session-${session.id}`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="truncate">{session.title}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        data-testid={`button-delete-session-${session.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
