"use client";

import { useState } from "react";
import { Megaphone, Send } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/layout/user-avatar";
import { RoleBadge } from "@/components/layout/role-badge";
import type { Announcement } from "@/hooks/use-announcements";

type AnnouncementPanelProps = {
  announcements: Announcement[];
  onSendAnnouncement: (content: string) => Promise<unknown>;
  isReadOnly: boolean;
  canSendAnnouncement: boolean;
};

export function AnnouncementPanel({
  announcements,
  onSendAnnouncement,
  isReadOnly,
  canSendAnnouncement,
}: AnnouncementPanelProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSending(true);
    try {
      await onSendAnnouncement(trimmed);
      setContent("");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Megaphone
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-foreground">
          Announcements
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* New Announcement Form */}
        {canSendAnnouncement && !isReadOnly && (
          <div className="mb-4 space-y-2 rounded-lg border bg-muted/30 p-3">
            <Textarea
              placeholder="Write an announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Ctrl+Enter to send
              </span>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={isSending || !content.trim()}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No announcements yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <UserAvatar
                    name={announcement.user.name}
                    image={announcement.user.image}
                    size="sm"
                  />
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="truncate text-xs font-medium text-foreground">
                      {announcement.user.name ?? "Anonymous"}
                    </span>
                    <RoleBadge
                      role={
                        announcement.user.role as
                          | "ADMIN"
                          | "MENTOR"
                          | "MODERATOR"
                          | "STUDENT"
                      }
                      className="scale-75"
                    />
                  </div>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {new Date(announcement.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
