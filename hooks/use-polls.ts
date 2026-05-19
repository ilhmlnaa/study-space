"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export type PollOption = {
  id: string;
  text: string;
  voteCount: number;
};

export type Poll = {
  id: string;
  roomId: string;
  question: string;
  isActive: boolean;
  createdAt: string;
  closedAt: string | null;
  options: PollOption[];
  userVotedOptionId: string | null;
  hasVoted: boolean;
};

type UsePollsOptions = {
  socket: Socket | null;
  roomId: string;
  initialPolls: Poll[];
  currentUserId: string;
};

export function usePolls({
  socket,
  roomId,
  initialPolls,
  currentUserId,
}: UsePollsOptions) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  useEffect(() => {
    if (!socket) return;

    const handleNewPoll = (data: { poll: Poll }) => {
      setPolls((prev) => {
        if (prev.some((p) => p.id === data.poll.id)) return prev;
        return [data.poll, ...prev];
      });
    };

    const handlePollResult = (data: { poll?: Poll; result?: Poll }) => {
      const updatedPoll = data.poll ?? data.result;
      if (!updatedPoll) return;
      setPolls((prev) =>
        prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)),
      );
    };

    const handlePollClosed = (data: { pollId: string }) => {
      setPolls((prev) =>
        prev.map((p) => (p.id === data.pollId ? { ...p, isActive: false } : p)),
      );
    };

    socket.on("poll:new", handleNewPoll);
    socket.on("poll:result", handlePollResult);
    socket.on("poll:closed", handlePollClosed);

    return () => {
      socket.off("poll:new", handleNewPoll);
      socket.off("poll:result", handlePollResult);
      socket.off("poll:closed", handlePollClosed);
    };
  }, [socket]);

  async function createPoll(question: string, options: string[]) {
    const res = await fetch(`/api/rooms/${roomId}/polls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, options }),
    });

    if (!res.ok) {
      throw new Error("Failed to create poll");
    }

    const poll: Poll = await res.json();

    setPolls((prev) => {
      if (prev.some((p) => p.id === poll.id)) return prev;
      return [poll, ...prev];
    });

    if (socket) {
      socket.emit("poll:create", { roomId, poll });
    }

    return poll;
  }

  async function votePoll(pollId: string, optionId: string) {
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });

    if (!res.ok) {
      throw new Error("Failed to vote");
    }

    const result: Poll = await res.json();

    setPolls((prev) => prev.map((p) => (p.id === result.id ? result : p)));

    if (socket) {
      socket.emit("poll:vote", { roomId, pollId, result });
    }

    return result;
  }

  async function closePoll(pollId: string) {
    const res = await fetch(`/api/polls/${pollId}/close`, {
      method: "PATCH",
    });

    if (!res.ok) {
      throw new Error("Failed to close poll");
    }

    const result: Poll = await res.json();

    setPolls((prev) =>
      prev.map((p) => (p.id === result.id ? { ...p, ...result } : p)),
    );

    if (socket) {
      socket.emit("poll:close", { roomId, pollId });
    }

    return result;
  }

  return { polls, createPoll, votePoll, closePoll };
}
