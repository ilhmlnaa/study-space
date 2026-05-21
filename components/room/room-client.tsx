"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Hand, Megaphone, MessageSquare, Users } from "lucide-react";

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
import { VideoConferencePanel } from "@/components/room/video-conference";
import { PollPanel } from "@/components/room/poll-panel";
import { RaiseHandPanel } from "@/components/room/raise-hand-panel";
import { AnnouncementPanel } from "@/components/room/announcement-panel";
import { RoomMobileNav } from "@/components/room/room-mobile-nav";
import type { Role, WhiteboardPermission, RoomMode } from "@prisma/client";

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
  roomMode: RoomMode;
  participants: { user: RoomUser; canSpeak: boolean; canVideo: boolean }[];
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

type MainView = "video" | "whiteboard";

type RoomClientProps = {
  room: RoomData;
  currentUser: RoomUser;
};

type TabId = "chat" | "participants" | "polls" | "raise-hand" | "announcements";

const TAB_DEFS: { id: TabId; label: string; icon: React.ReactNode }[] = [
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

type BadgeCounts = Record<TabId, number>;

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
  const [mobileActiveTab, setMobileActiveTab] = useState<
    "video" | "whiteboard" | TabId
  >(room.roomMode === "VIDEO_CONFERENCE" ? "video" : "whiteboard");
  const activeTabRef = useRef<TabId>("chat");
  const mobileActiveTabRef = useRef<"video" | "whiteboard" | TabId>(
    room.roomMode === "VIDEO_CONFERENCE" ? "video" : "whiteboard",
  );
  const isDesktopRef = useRef(false);
  const [badges, setBadges] = useState<BadgeCounts>({
    chat: 0,
    participants: 0,
    polls: 0,
    "raise-hand": 0,
    announcements: 0,
  });
  const [roomStatus, setRoomStatus] = useState<"ACTIVE" | "CLOSED">(
    room.status,
  );
  const [whiteboardPermission, setWhiteboardPermission] =
    useState<WhiteboardPermission>(room.whiteboardPermission);

  // For VIDEO_CONFERENCE rooms: track which main view is shown.
  // Video connection stays alive in background when switching to whiteboard.
  const [mainView, setMainView] = useState<MainView>(
    room.roomMode === "VIDEO_CONFERENCE" ? "video" : "whiteboard",
  );

  const [speakingUserIds, setSpeakingUserIds] = useState<string[]>(() =>
    room.participants
      .filter((participant) => participant.canSpeak || participant.canVideo)
      .map((participant) => participant.user.id),
  );

  const { socket, status: socketStatus } = useSocket(room.id, currentUser.id);

  useEffect(() => {
    if (!socket) return;

    const handlePermissionChanged = (data: {
      roomId: string;
      permission: WhiteboardPermission;
    }) => {
      if (data.roomId !== room.id) return;
      setWhiteboardPermission(data.permission);
    };

    const handleSpeakingGranted = (data: {
      userId: string;
      canSpeak: boolean;
      canVideo: boolean;
    }) => {
      if (!data.canSpeak && !data.canVideo) return;
      setSpeakingUserIds((prev) =>
        prev.includes(data.userId) ? prev : [...prev, data.userId],
      );
    };

    const handleSpeakingRevoked = (data: { userId: string }) => {
      setSpeakingUserIds((prev) => prev.filter((id) => id !== data.userId));
    };

    socket.on("whiteboard:permission:changed", handlePermissionChanged);
    socket.on("speaking:granted", handleSpeakingGranted);
    socket.on("speaking:revoked", handleSpeakingRevoked);

    return () => {
      socket.off("whiteboard:permission:changed", handlePermissionChanged);
      socket.off("speaking:granted", handleSpeakingGranted);
      socket.off("speaking:revoked", handleSpeakingRevoked);
    };
  }, [socket, room.id]);

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

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    mobileActiveTabRef.current = mobileActiveTab;
  }, [mobileActiveTab]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    isDesktopRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      isDesktopRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function isTabVisible(tabId: TabId) {
    if (isDesktopRef.current) {
      return activeTabRef.current === tabId;
    }
    return (
      activeTabRef.current === tabId && mobileActiveTabRef.current === tabId
    );
  }

  function incrementBadge(tabId: TabId) {
    setBadges((prev) => ({ ...prev, [tabId]: prev[tabId] + 1 }));
  }

  function clearBadge(tabId: TabId) {
    setBadges((prev) => ({ ...prev, [tabId]: 0 }));
  }

  function handleTabChange(tabId: TabId) {
    setActiveTab(tabId);
    clearBadge(tabId);
  }

  const {
    messages,
    sendMessage,
    error: chatError,
  } = useChat({
    socket,
    roomId: room.id,
    userId: currentUser.id,
    initialMessages,
    onNewMessage: () => {
      if (!isTabVisible("chat")) incrementBadge("chat");
    },
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
    onNewPoll: () => {
      if (!isTabVisible("polls")) incrementBadge("polls");
    },
  });

  const { raiseHands, raiseHand, resolveHand, approveHand, userHasActiveHand } =
    useRaiseHand({
      socket,
      roomId: room.id,
      initialRaiseHands,
      currentUserId: currentUser.id,
      onHandRaised: () => {
        if (!isTabVisible("raise-hand")) incrementBadge("raise-hand");
      },
      onHandResolved: () => {
        // — handled via the raiseHands-derived badge below
      },
    });

  const { announcements, sendAnnouncement } = useAnnouncements({
    socket,
    roomId: room.id,
    initialAnnouncements,
    onNewAnnouncement: () => {
      if (!isTabVisible("announcements")) incrementBadge("announcements");
    },
  });

  const unresolvedHandCount = raiseHands.filter((h) => !h.isResolved).length;

  const isCreator = currentUser.id === room.createdById;
  const isModerator = room.moderators.some((m) => m.userId === currentUser.id);
  const isReadOnly = roomStatus === "CLOSED";
  const dashboardPath = getDashboardPath(currentUser.role);

  const canCreatePoll = isCreator && !isReadOnly;
  const canClosePoll = (isCreator || isModerator) && !isReadOnly;
  const canResolveRaiseHand = (isCreator || isModerator) && !isReadOnly;
  const canSendAnnouncement = (isCreator || isModerator) && !isReadOnly;

  const TABS = TAB_DEFS.map((tab) => {
    let badge = badges[tab.id];
    if (tab.id === "raise-hand" && canResolveRaiseHand) {
      badge = unresolvedHandCount;
    }
    return { ...tab, badge };
  });

  const canDraw =
    !isReadOnly &&
    (isCreator ||
      whiteboardPermission === "ALL_PARTICIPANTS" ||
      (whiteboardPermission === "MENTOR_MODERATOR" && isModerator));

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
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {isReadOnly && (
        <div className="flex items-center justify-center bg-muted px-4 py-2 text-sm text-muted-foreground">
          This room is closed. You are in read-only mode.
        </div>
      )}

      {socketStatus !== "connected" && (
        <div className="flex items-center justify-center bg-yellow-500/10 px-4 py-2 text-sm text-yellow-700 dark:text-yellow-300">
          {socketStatus === "connecting" && "Connecting to realtime server..."}
          {socketStatus === "disconnected" &&
            "Realtime connection disconnected. Reconnecting..."}
          {socketStatus === "error" &&
            "Realtime connection problem. Some updates may be delayed."}
        </div>
      )}

      <RoomHeader
        room={{ ...room, status: roomStatus }}
        participantCount={participants.length}
        isCreator={isCreator}
        dashboardPath={dashboardPath}
        onCloseRoom={handleCloseRoom}
        showViewToggle={room.roomMode === "VIDEO_CONFERENCE"}
        currentView={mainView}
        onToggleView={() =>
          setMainView((prev) => (prev === "video" ? "whiteboard" : "video"))
        }
      />

      <div className="flex flex-1 overflow-hidden flex-col">
        <div className="flex flex-1 overflow-hidden relative">
          {/* Video Conference area (only for VIDEO_CONFERENCE rooms) */}
          {room.roomMode === "VIDEO_CONFERENCE" && (
            <div
              className={cn(
                "min-w-0 flex-1 overflow-hidden bg-card transition-all",
                "m-0 sm:m-3 sm:rounded-2xl sm:border shadow-sm",
                // Desktop: show when mainView is video
                // Mobile: show when mobileActiveTab is video
                mainView === "video" ? "hidden lg:flex" : "hidden",
                mobileActiveTab === "video" && "flex lg:hidden",
                mainView === "video" && mobileActiveTab === "video" && "flex",
              )}
            >
              <VideoConferencePanel
                roomId={room.id}
                currentUser={currentUser}
                isCreator={isCreator}
                isModerator={isModerator}
                isReadOnly={isReadOnly}
                socket={socket}
              />
            </div>
          )}

          {/* Whiteboard area */}
          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden bg-card transition-all",
              "m-0 sm:m-3 sm:rounded-2xl sm:border shadow-sm",
              // Desktop: show when mainView is whiteboard (or WHITEBOARD_ONLY room)
              mainView === "whiteboard" ? "hidden lg:flex" : "hidden",
              mobileActiveTab === "whiteboard" && "flex lg:hidden",
              mainView === "whiteboard" &&
                mobileActiveTab === "whiteboard" &&
                "flex",
            )}
          >
            <ExcalidrawWhiteboard
              socket={socket}
              roomId={room.id}
              initialData={whiteboardData}
              canDraw={canDraw}
              isReadOnly={isReadOnly}
              isCreator={isCreator}
            />
          </div>

          {/* Sidebar */}
          <aside
            className={cn(
              "flex w-full flex-col bg-card lg:w-96 lg:border-l transition-all",
              // Desktop: always visible
              // Mobile: visible when a tab (not video/whiteboard) is selected
              mobileActiveTab !== "video" && mobileActiveTab !== "whiteboard"
                ? "flex flex-1 lg:flex-none"
                : "hidden lg:flex",
            )}
          >
            <div className="hidden lg:flex shrink-0 overflow-x-auto border-b">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "relative flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                  type="button"
                >
                  <span className="relative">
                    {tab.icon}
                    {tab.badge > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </span>
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
                  error={chatError}
                />
              )}

              {activeTab === "participants" && (
                <ParticipantPanel
                  participants={participants}
                  roomId={room.id}
                  canModerate={(isCreator || isModerator) && !isReadOnly}
                  isVideoConference={room.roomMode === "VIDEO_CONFERENCE"}
                  speakingUserIds={speakingUserIds}
                />
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
                  onApproveHand={
                    room.roomMode === "VIDEO_CONFERENCE"
                      ? approveHand
                      : undefined
                  }
                  isReadOnly={isReadOnly}
                  currentUserId={currentUser.id}
                  canResolve={canResolveRaiseHand}
                  isVideoConference={room.roomMode === "VIDEO_CONFERENCE"}
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
        <RoomMobileNav
          tabs={TABS}
          showVideoTab={room.roomMode === "VIDEO_CONFERENCE"}
          mobileActiveTab={mobileActiveTab}
          onTabChange={(tabId) => {
            setMobileActiveTab(tabId as "video" | "whiteboard" | TabId);
            if (tabId === "video" || tabId === "whiteboard") {
              setMainView(tabId);
              return;
            }
            handleTabChange(tabId as TabId);
          }}
        />
      </div>
    </div>
  );
}
