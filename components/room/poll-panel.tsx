"use client";

import { useState } from "react";
import { BarChart3, Plus, X, Check } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Poll } from "@/hooks/use-polls";

type PollPanelProps = {
  polls: Poll[];
  onCreatePoll: (question: string, options: string[]) => Promise<unknown>;
  onVotePoll: (pollId: string, optionId: string) => Promise<unknown>;
  onClosePoll: (pollId: string) => Promise<unknown>;
  isReadOnly: boolean;
  currentUserId: string;
  canCreatePoll: boolean;
  canClosePoll: boolean;
};

export function PollPanel({
  polls,
  onCreatePoll,
  onVotePoll,
  onClosePoll,
  isReadOnly,
  currentUserId,
  canCreatePoll,
  canClosePoll,
}: PollPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAddOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, ""]);
  }

  function handleRemoveOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleOptionChange(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  async function handleCreate() {
    const trimmedQuestion = question.trim();
    const trimmedOptions = options
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (!trimmedQuestion || trimmedOptions.length < 2) return;

    setIsSubmitting(true);
    try {
      await onCreatePoll(trimmedQuestion, trimmedOptions);
      setQuestion("");
      setOptions(["", ""]);
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setQuestion("");
    setOptions(["", ""]);
    setShowForm(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-foreground">Polls</span>
        </div>
        {canCreatePoll && !isReadOnly && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create Poll
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Create Poll Form */}
        {showForm && (
          <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-4">
            <Input
              placeholder="Poll question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="space-y-2">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  {options.length > 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveOption(index)}
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddOption}
                className="text-xs"
              >
                <Plus className="h-3 w-3" />
                Add Option
              </Button>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={
                  isSubmitting ||
                  !question.trim() ||
                  options.filter((o) => o.trim()).length < 2
                }
              >
                Create
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Polls List */}
        {polls.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No polls yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onVote={onVotePoll}
                onClose={onClosePoll}
                isReadOnly={isReadOnly}
                currentUserId={currentUserId}
                canClosePoll={canClosePoll}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type PollCardProps = {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => Promise<unknown>;
  onClose: (pollId: string) => Promise<unknown>;
  isReadOnly: boolean;
  currentUserId: string;
  canClosePoll: boolean;
};

function PollCard({
  poll,
  onVote,
  onClose,
  isReadOnly,
  currentUserId,
  canClosePoll,
}: PollCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  const canVote = poll.isActive && !poll.hasVoted && !isReadOnly;

  async function handleVote(optionId: string) {
    setIsVoting(true);
    try {
      await onVote(poll.id, optionId);
    } finally {
      setIsVoting(false);
    }
  }

  async function handleClose() {
    setIsClosing(true);
    try {
      await onClose(poll.id);
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Question & Status */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{poll.question}</p>
        <Badge variant={poll.isActive ? "success" : "secondary"}>
          {poll.isActive ? "Active" : "Closed"}
        </Badge>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage =
            totalVotes > 0
              ? Math.round((option.voteCount / totalVotes) * 100)
              : 0;
          const isUserVote = poll.userVotedOptionId === option.id;

          return (
            <div key={option.id} className="space-y-1">
              {canVote ? (
                <button
                  type="button"
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    "hover:border-primary hover:bg-primary/5",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {option.text}
                </button>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={cn(
                        "flex items-center gap-1.5",
                        isUserVote && "font-medium text-primary",
                      )}
                    >
                      {isUserVote && (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {option.text}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.voteCount} vote{option.voteCount !== 1 ? "s" : ""}{" "}
                      ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isUserVote ? "bg-primary" : "bg-primary/40",
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </span>
        {canClosePoll && poll.isActive && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClose}
            disabled={isClosing}
          >
            Close Poll
          </Button>
        )}
      </div>
    </div>
  );
}
