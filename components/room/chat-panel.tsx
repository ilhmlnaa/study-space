"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/layout/user-avatar";
import { RoleBadge } from "@/components/layout/role-badge";
import type { ChatMessage } from "@/hooks/use-chat";

type ChatPanelProps = {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isReadOnly: boolean;
  currentUserId: string;
  error?: string | null;
};

export function ChatPanel({
  messages,
  onSendMessage,
  isReadOnly,
  currentUserId,
  error,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.user.id === currentUserId && "flex-row-reverse",
              )}
            >
              <UserAvatar
                name={msg.user.name}
                image={msg.user.image}
                size="sm"
              />
              <div
                className={cn(
                  "max-w-[75%] space-y-1",
                  msg.user.id === currentUserId && "text-right",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    msg.user.id === currentUserId && "flex-row-reverse",
                  )}
                >
                  <span className="text-xs font-medium text-foreground">
                    {msg.user.name ?? "Anonymous"}
                  </span>
                  <RoleBadge
                    role={msg.user.role as "ADMIN" | "MENTOR" | "MODERATOR" | "STUDENT"}
                    className="scale-75"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={cn(
                    "inline-block rounded-2xl px-3 py-2 text-sm",
                    msg.user.id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        {error && (
          <p className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        {isReadOnly ? (
          <p className="text-center text-sm text-muted-foreground">
            This room is closed. Chat is read-only.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
