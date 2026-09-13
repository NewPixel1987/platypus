"use client";

import {
  BanIcon,
  BotIcon,
  BrainIcon,
  CheckCircleIcon,
  PenLineIcon,
  WrenchIcon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { RunEventStatus, RunEventType } from "@platypus/schemas";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * One line of agent activity, as a Sub-Agent's card in a Chat and a Trigger
 * run's timeline both draw it: what kind of thing happened, its name where it
 * has one, and how it stands. The two readers share the SHAPE — a delegate
 * reads the same way wherever it appears — and nothing else: the Chat card
 * streams its entries live, the timeline reads persisted Run events.
 *
 * `failed` is not a Run event type. It is the shape a Chat's Sub-Agent card
 * has always yielded for "the delegation itself failed", stored on every such
 * Chat message for ever, so it stays readable here without being written
 * anywhere new.
 */
export type ActivityRowEntry = {
  type: RunEventType | "failed";
  toolName?: string | null;
  status: RunEventStatus;
  error?: string;
  /** How many identical consecutive entries this row stands for. */
  count?: number;
};

const config: Record<
  ActivityRowEntry["type"],
  {
    icon: LucideIcon;
    activeColor: string;
    label: (entry: ActivityRowEntry) => string;
  }
> = {
  "tool-call": {
    icon: WrenchIcon,
    activeColor: "text-blue-500",
    label: (entry) => entry.toolName ?? "tool",
  },
  reasoning: {
    icon: BrainIcon,
    activeColor: "text-purple-500",
    label: () => "Thinking…",
  },
  text: {
    icon: PenLineIcon,
    activeColor: "text-amber-500",
    label: () => "Generating response…",
  },
  delegate: {
    icon: BotIcon,
    activeColor: "text-emerald-500",
    label: (entry) => entry.toolName ?? "Sub-Agent",
  },
  failed: {
    icon: XCircleIcon,
    activeColor: "text-red-500",
    label: () => "Run failed",
  },
};

/** The words a row's label uses for an entry, exported so tests need not restate them. */
export const activityLabel = (entry: ActivityRowEntry): string =>
  config[entry.type].label(entry);

const StatusMark = ({ status }: { status: RunEventStatus }) => {
  switch (status) {
    case "running":
      return (
        <Badge
          variant="secondary"
          className="rounded-full text-[10px] px-1.5 py-0"
        >
          running
        </Badge>
      );
    case "error":
      return (
        <XCircleIcon
          className="size-3.5 shrink-0 text-red-600"
          aria-label="Failed"
        />
      );
    case "cancelled":
      return (
        <BanIcon
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-label="Cancelled"
        />
      );
    default:
      return (
        <CheckCircleIcon
          className="size-3.5 shrink-0 text-green-600"
          aria-label="Completed"
        />
      );
  }
};

export const ActivityRow = ({
  entry,
  trailing,
  className,
}: {
  entry: ActivityRowEntry;
  /** Anything to draw after the status mark — a duration, say. */
  trailing?: ReactNode;
  className?: string;
}) => {
  const { icon: Icon, activeColor } = config[entry.type];
  const isRunning = entry.status === "running";

  return (
    <div className={cn("flex flex-col gap-0.5 py-1", className)}>
      <div className="flex items-center gap-2 text-sm">
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            isRunning
              ? `${activeColor} animate-pulse`
              : entry.status === "error"
                ? "text-red-500"
                : "text-muted-foreground",
          )}
        />
        <span className="text-muted-foreground truncate">
          {activityLabel(entry)}
          {entry.count && entry.count > 1 && (
            <span className="ml-1 text-xs text-muted-foreground/70">
              &times;{entry.count}
            </span>
          )}
        </span>
        <StatusMark status={entry.status} />
        {trailing}
      </div>
      {entry.error && (
        <span className="ml-5.5 text-xs text-red-600 truncate">
          {entry.error}
        </span>
      )}
    </div>
  );
};
