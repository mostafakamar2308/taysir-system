import { utcToLocalTime } from "@/lib/dates";
import { sessionStatusColors } from "@/const/sessions";
import { CheckCircle2, StickyNote, Video } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DashboardSession, SessionStatus } from "@/types/session";

type SessionCardProps = {
  session: DashboardSession;
  onClick: () => void;
  onMarkAttendance: (session: DashboardSession) => void;
};

export function SessionCard({
  session,
  onClick,
  onMarkAttendance,
}: SessionCardProps) {
  const hasNotes = session.notes && session.notes.trim().length > 0;

  return (
    <div className="relative group">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`w-full text-right rounded-lg p-1.5 mb-1 text-[0.7rem] leading-tight border transition-all hover:shadow-md ${
          sessionStatusColors[session.status as SessionStatus]
        }`}
      >
        <div className="font-semibold truncate">{session.studentName}</div>
        <div className="opacity-75 truncate">{session.tutorName}</div>
        <div className="opacity-60 flex items-center gap-1 mt-0.5">
          {utcToLocalTime(new Date(session.startTime))}
          {" – "}
          {utcToLocalTime(new Date(session.endTime))}

          {hasNotes && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <StickyNote className="h-2.5 w-2.5 inline-block text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{session.notes}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </button>
      {session.status === SessionStatus.COMPLETED && !session.attendance && (
        <div className="absolute top-2 left-1 -mt-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full bg-white shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAttendance(session);
            }}
          >
            <CheckCircle2 className="h-3 w-3 text-primary" />
          </Button>
        </div>
      )}
      {session.zoomStartUrl && session.status !== SessionStatus.COMPLETED && (
        <div className="absolute top-2 left-1 -mt-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              window.open(session.zoomStartUrl!, "_blank");
            }}
            className="block h-5 w-5 shadow-sm p-0"
          >
            <Video className="h-3 w-3 text-primary" />
          </Button>
        </div>
      )}
    </div>
  );
}
