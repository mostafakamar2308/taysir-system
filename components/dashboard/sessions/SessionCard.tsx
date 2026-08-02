"use client";

import { SessionStatus } from "@/types/session";
import type { AdminSession } from "@/types/session";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { formatTime } from "@/lib/dates";

interface Props {
  session: AdminSession;
  onClick: () => void;
  onEdit?: (session: AdminSession) => void;
  onCancel?: (session: AdminSession) => void;
}

const statusStyles: Record<SessionStatus, string> = {
  [SessionStatus.COMPLETED]: "bg-green-50 border-green-200 text-green-800",
  [SessionStatus.SCHEDULED]: "bg-blue-50 border-blue-200 text-blue-800",
  [SessionStatus.CANCELLED]: "bg-red-50 border-red-200 text-red-800",
};

export function SessionCard({ session, onClick, onEdit, onCancel }: Props) {
  const startTime = formatTime(session.startTime);
  const endTime = formatTime(session.endTime);

  const attendedCount = session.participants.filter(
    (p) => p.status !== null && [0, 3].includes(p.status),
  ).length;
  const totalParticipants = session.participants.length;
  const reportsCount = session.participants.filter(
    (p) => p.report !== null,
  ).length;
  const homeworkSubmissions = session.participants.filter(
    (p) => p.homeworkSolution !== null,
  ).length;
  const isCompleted = session.status === SessionStatus.COMPLETED;

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full text-right rounded-lg p-2 border transition-all hover:shadow-md ${statusStyles[session.status]}`}
      >
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold">
            {startTime} – {endTime}
          </span>
          {isCompleted && (
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {attendedCount}/{totalParticipants}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {reportsCount}/{totalParticipants}
              </Badge>
              {session.assignment && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {homeworkSubmissions}/{totalParticipants}
                </Badge>
              )}
            </div>
          )}
        </div>
        <p className="text-xs mt-1 truncate">{session.tutorName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {session.groupName}
        </p>
      </button>

      {/* Actions menu – visible on hover */}
      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-white shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onEdit?.(session)}>
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCancel?.(session)}>
              إلغاء
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
