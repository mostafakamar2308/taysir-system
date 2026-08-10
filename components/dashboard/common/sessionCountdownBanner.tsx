"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import dayjs from "@/lib/dayjs";

export interface SessionBannerItem {
  key: string;
  startTime: string;
  endTime: string;
  joinUrl: string | null;
  renderMessage: (timeText: string) => ReactNode;
}

interface SessionCountdownBannerProps {
  sessions: SessionBannerItem[];
  nowLabel: string;
  joinLabel: string;
}

interface BannerState {
  item: SessionBannerItem;
  timeText: string;
  showJoin: boolean;
}

// Shows a countdown to the nearest live/upcoming session and a join button
// when it is about to start (or already running). A session that is currently
// running (started but not ended) always wins over a future one, so a late
// student/tutor still sees it. Rolls over automatically when a session ends.
export function SessionCountdownBanner({
  sessions,
  nowLabel,
  joinLabel,
}: SessionCountdownBannerProps) {
  const compute = useCallback((): BannerState | null => {
    const nowMs = Date.now();
    const candidates = sessions
      .filter((s) => dayjs(s.endTime).valueOf() > nowMs)
      .sort(
        (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
      );
    const live = candidates.find(
      (s) => dayjs(s.startTime).valueOf() <= nowMs,
    );
    const pick = live ?? candidates[0];
    if (!pick) return null;

    const diffSeconds = Math.floor(
      (dayjs(pick.startTime).valueOf() - nowMs) / 1000,
    );
    const showJoin = diffSeconds <= 60;
    const timeText =
      diffSeconds <= 0
        ? nowLabel
        : `${Math.floor(diffSeconds / 60)}:${String(diffSeconds % 60).padStart(
            2,
            "0",
          )}`;
    return { item: pick, timeText, showJoin };
  }, [sessions, nowLabel]);

  const [state, setState] = useState<BannerState | null>(compute);

  useEffect(() => {
    const interval = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(interval);
  }, [compute]);

  if (!state) return null;

  return (
    <div className="bg-primary border text-white p-3 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 shrink-0" />
        <span>{state.item.renderMessage(state.timeText)}</span>
      </div>
      {state.showJoin && state.item.joinUrl && (
        <Button size="sm" variant="secondary" asChild>
          <a
            href={state.item.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {joinLabel}
            <ExternalLink className="h-4 w-4 mr-1" />
          </a>
        </Button>
      )}
    </div>
  );
}
