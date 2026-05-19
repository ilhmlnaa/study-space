"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Hand, Megaphone, MessageSquare, Users, Pencil } from "lucide-react";

import { cn } from "@/lib/cn";
import { getDashboardPath } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { useChat, type ChatMessage } from "@/hooks/use-chat";
import { useParticipants, type Participant } from "@/hooks/use-participants";
import { usePolls, type Poll } from "@/hooks/use-polls";
import { useRaiseHand, type RaiseHand } from "@/hooks/use-raise-hand";
import { useAnnouncements, type Announcement } from "@/hooks/use-announcements";
import { RoomHeader } from "@/components/room/room-header";
import { ChatPanel } from "@/components/room/chat-panel";
import { ParticipantPanel } from "@/components/room/participant-panel";
import { ExcalidrawWhiteboard } from "@/components/room/excalidraw-whiteboard";
import { PollPanel } from "@/components/room/poll-panel";
import { RaiseHandPanel } from "@/components/room/raise-hand-panel";
import { AnnouncementPanel } from "@/components/room/announcement-panel";
import type { Role, WhiteboardPermission } from "@prisma/client";

type RoomUser = {
  id: string;
  name: string | null;
  image: string | null;
  role: Role;
};

type RoomData = {
  id: string;
  title: string;
  topic: string | null;
  code: string;
  status: "ACTIVE" | "CLOSED";
  createdById: string;
  whiteboardPermission: WhiteboardPermission;
  participants: { user: RoomUser }[];
  moderators: { userId: string; user: RoomUser }[];
  messages: {
    id: string;
    content: string;
    createdAt: Date | string;
    user: RoomUser;
  }[];
  polls: {
    id: string;
    roomId: string;
    question: string;
    isActive: boolean;
    createdAt: Date | string;
    closedAt: Date | string | null;
    options: {
      id: string;
      text: string;
      votes: { userId: string }[];
    }[];
    votes: { userId: string; optionId: string }[];
  }[];
  announcements: {
    id: string;
    roomId: string;
    content: string;
    createdAt: Date | string;
    user: RoomUser;
  }[];
  raiseHands: {
    id: string;
    roomId: string;
    userId: string;
    isResolved: boolean;
    resolvedAt: Date | string | null;
    createdAt: Date | string;
    user: RoomUser;
  }[];
  whiteboard: {
    data: unknown;
  } | null;
};

type RoomClientProps = {
  room: RoomData;
  currentUser: RoomUser;
};

type TabId = "chat" | "participants" | "polls" | "raise-hand" | "announcements";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "participants", label: "People", icon: <Users className="h-4 w-4" /> },
  { id: "polls", label: "Polls", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "raise-hand", label: "Hand", icon: <Hand className="h-4 w-4" /> },
  {
    id: "announcements",
    label: "Announce",
    icon: <Megaphone className="h-4 w-4" />,
  },
];

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeWhiteboardData(data: unknown) {
  if (!data || typeof data !== "object") {
    return { elements: [], appState: {}, files: {} };
  }

  const snapshot = data as {
    elements?: unknown;
    appState?: unknown;
    files?: unknown;
  };

  return {
    elements: Array.isArray(snapshot.elements) ? snapshot.elements : [],
    appState:
      snapshot.appState && typeof snapshot.appState === "object"
        ? snapshot.appState
        : {},
    files:
      snapshot.files && typeof snapshot.files === "object"
        ? snapshot.files
        : {},
  };
}

export function RoomClient({ room, currentUser }: RoomClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [mobileActiveTab, setMobileActiveTab] = useState<"whiteboard" | TabId>("whiteboard");
  const [roomStatus, setRoomStatus] = useState<"ACTIVE" | "CLOSED">(
    room.status,
  );

  const socket = useSocket(room.id, currentUser.id);

  const initialMessages: ChatMessage[] = useMemo(
    () =>
      room.messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: toIsoString(m.createdAt) ?? new Date().toISOString(),
        user: {
          id: m.user.id,
          name: m.user.name,
          image: m.user.image,
          role: m.user.role,
        },
      })),
    [room.messages],
  );

  const initialParticipants: Participant[] = useMemo(
    () =>
      room.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        image: p.user.image,
        role: p.user.role,
      })),
    [room.participants],
  );

  const initialPolls: Poll[] = useMemo(
    () =>
      room.polls.map((poll) => {
        const currentUserVote = poll.votes.find(
          (vote) => vote.userId === currentUser.id,
        );

        return {
          id: poll.id,
          roomId: poll.roomId,
          question: poll.question,
          isActive: poll.isActive,
          createdAt: toIsoString(poll.createdAt) ?? new Date().toISOString(),
          closedAt: toIsoString(poll.closedAt),
          options: poll.options.map((option) => ({
            id: option.id,
            text: option.text,
            voteCount: option.votes.length,
          })),
          userVotedOptionId: currentUserVote?.optionId ?? null,
          hasVoted: Boolean(currentUserVote),
        };
      }),
    [currentUser.id, room.polls],
  );

  const initialRaiseHands: RaiseHand[] = useMemo(
    () =>
      room.raiseHands.map((hand) => ({
        id: hand.id,
        roomId: hand.roomId,
        userId: hand.userId,
        isResolved: hand.isResolved,
        resolvedAt: toIsoString(hand.resolvedAt),
        createdAt: toIsoString(hand.createdAt) ?? new Date().toISOString(),
        user: {
          id: hand.user.id,
          name: hand.user.name,
          image: hand.user.image,
          role: hand.user.role,
        },
      })),
    [room.raiseHands],
  );

  const initialAnnouncements: Announcement[] = useMemo(
    () =>
      room.announcements.map((announcement) => ({
        id: announcement.id,
        roomId: announcement.roomId,
        content: announcement.content,
        createdAt:
          toIsoString(announcement.createdAt) ?? new Date().toISOString(),
        user: {
          id: announcement.user.id,
          name: announcement.user.name,
          image: announcement.user.image,
          role: announcement.user.role,
        },
      })),
    [room.announcements],
  );

  const whiteboardData = useMemo(
    () => normalizeWhiteboardData(room.whiteboard?.data),
    [room.whiteboard?.data],
  );

  const { messages, sendMessage } = useChat({
    socket,
    roomId: room.id,
    userId: currentUser.id,
    initialMessages,
  });

  const { participants } = useParticipants({
    socket,
    initialParticipants,
  });

  const { polls, createPoll, votePoll, closePoll } = usePolls({
    socket,
    roomId: room.id,
    initialPolls,
    currentUserId: currentUser.id,
  });

  const { raiseHands, raiseHand, resolveHand, userHasActiveHand } =
    useRaiseHand({
      socket,
      roomId: room.id,
      initialRaiseHands,
      currentUserId: currentUser.id,
    });

  const { announcements, sendAnnouncement } = useAnnouncements({
    socket,
    roomId: room.id,
    initialAnnouncements,
  });

  const isCreator = currentUser.id === room.createdById;
  const isModerator = room.moderators.some((m) => m.userId === currentUser.id);
  const isReadOnly = roomStatus === "CLOSED";
  const dashboardPath = getDashboardPath(currentUser.role);

  const canCreatePoll = isCreator && !isReadOnly;
  const canClosePoll = (isCreator || isModerator) && !isReadOnly;
  const canResolveRaiseHand = (isCreator || isModerator) && !isReadOnly;
  const canSendAnnouncement = (isCreator || isModerator) && !isReadOnly;

  const canDraw =
    !isReadOnly &&
    (isCreator ||
      room.whiteboardPermission === "ALL_PARTICIPANTS" ||
      (room.whiteboardPermission === "MENTOR_MODERATOR" && isModerator));

  async function handleCloseRoom() {
    try {
      const res = await fetch(`/api/rooms/${room.id}/close`, {
        method: "PATCH",
      });

      if (res.ok) {
        setRoomStatus("CLOSED");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to close room", err);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {isReadOnly && (
        <div className="flex items-center justify-center bg-muted px-4 py-2 text-sm text-muted-foreground">
          This room is closed. You are in read-only mode.
        </div>
      )}

      <RoomHeader
        room={{ ...room, status: roomStatus }}
        participantCount={participants.length}
        isCreator={isCreator}
        dashboardPath={dashboardPath}
        onCloseRoom={handleCloseRoom}
      />

      <div className="flex flex-1 overflow-hidden flex-col">
        <div className="flex flex-1 overflow-hidden relative">
          <div className={cn(
            "flex min-w-0 flex-1 overflow-hidden bg-card transition-all",
            "m-0 sm:m-3 sm:rounded-2xl sm:border shadow-sm",
            mobileActiveTab !== "whiteboard" ? "hidden lg:flex" : "flex"
          )}>
            <ExcalidrawWhiteboard
            socket={socket}
            roomId={room.id}
            initialData={whiteboardData}
            canDraw={canDraw}
            isReadOnly={isReadOnly}
            isCreator={isCreator}
          />
        </div>

          <aside className={cn(
            "flex w-full flex-col bg-card lg:w-96 lg:border-l transition-all",
            mobileActiveTab !== "whiteboard" ? "flex flex-1" : "hidden lg:flex"
          )}>
            <div className="hidden lg:flex shrink-0 overflow-x-auto border-b">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-selected={activeTab === tab.id}
                role="tab"
                type="button"
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" && (
              <ChatPanel
                messages={messages}
                onSendMessage={sendMessage}
                isReadOnly={isReadOnly}
                currentUserId={currentUser.id}
              />
            )}

            {activeTab === "participants" && (
              <ParticipantPanel participants={participants} />
            )}

            {activeTab === "polls" && (
              <PollPanel
                polls={polls}
                onCreatePoll={createPoll}
                onVotePoll={votePoll}
                onClosePoll={closePoll}
                isReadOnly={isReadOnly}
                currentUserId={currentUser.id}
                canCreatePoll={canCreatePoll}
                canClosePoll={canClosePoll}
              />
            )}

            {activeTab === "raise-hand" && (
              <RaiseHandPanel
                raiseHands={raiseHands}
                onRaiseHand={raiseHand}
                onResolveHand={resolveHand}
                isReadOnly={isReadOnly}
                currentUserId={currentUser.id}
                canResolve={canResolveRaiseHand}
                userHasActiveHand={userHasActiveHand}
              />
            )}

            {activeTab === "announcements" && (
              <AnnouncementPanel
                announcements={announcements}
                onSendAnnouncement={sendAnnouncement}
                isReadOnly={isReadOnly}
                canSendAnnouncement={canSendAnnouncement}
              />
            )}
          </div>
        </aside>
      </div>

        {/* Mobile Bottom Navbar */}
        <div className="flex lg:hidden shrink-0 border-t bg-card">
          {[
            { id: "whiteboard", label: "Board", icon: <Pencil className="h-5 w-5" /> },
            ...TABS
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMobileActiveTab(tab.id as "whiteboard" | TabId);
                if (tab.id !== "whiteboard") {
                  setActiveTab(tab.id as TabId);
                }
              }}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                mobileActiveTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
