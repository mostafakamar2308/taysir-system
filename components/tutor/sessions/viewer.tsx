"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DashboardSession } from "@/types/session";
import SessionsFilters from "./sessionFilters";
import CalendarView from "./calendarView";
import TableView from "./tableView";
import SessionDetailPanel from "./sessionDetailPanel";
import AddSessionDialog from "@/components/dashboard/dialogs/addSessionToTutorDialog";

interface SessionsClientProps {
  sessions: DashboardSession[];
  students: { id: number; name: string }[];
  view: string;
  currentWeekStart: string;
  filter?: string;
  sessionIdParam: number | null;
  tutorId: number;
  academyId: number;
}

export default function SessionsClient({
  sessions: initialSessions,
  students,
  view: initialView,
  currentWeekStart,
  sessionIdParam,
  tutorId,
  academyId,
}: SessionsClientProps) {
  const t = useTranslations("TutorSessions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [detailSession, setDetailSession] = useState<DashboardSession | null>(
    () => {
      if (sessionIdParam) {
        return initialSessions.find((s) => s.id === sessionIdParam) || null;
      }
      return null;
    },
  );

  const [detailOpen, setDetailOpen] = useState(!!sessionIdParam);

  const handleSessionClick = (session: DashboardSession) => {
    setDetailSession(session);
    setDetailOpen(true);
  };

  const handleUpdate = () => {
    router.refresh();
    setDetailOpen(false);
    setDetailSession(null);
  };

  const view = searchParams.get("view") || initialView;
  const studentId = searchParams.get("studentId") || undefined;
  const status = searchParams.get("status") || undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <AddSessionDialog
          tutorId={tutorId}
          studentOptions={students}
          academyId={academyId}
        >
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> {t("addSessionButton")}
          </Button>
        </AddSessionDialog>
      </div>

      <Card>
        <CardContent>
          <SessionsFilters
            students={students}
            currentWeekStart={currentWeekStart}
            view={view}
            studentId={studentId}
            status={status}
          />
        </CardContent>
      </Card>

      {view === "calendar" ? (
        <CalendarView
          currentWeekStart={currentWeekStart}
          sessions={initialSessions}
          onSlotClick={() => {}}
          onSessionClick={handleSessionClick}
          onMarkAttendance={() => {}}
        />
      ) : (
        <Card>
          <CardContent className="p-4">
            <TableView
              sessions={initialSessions}
              onSessionClick={handleSessionClick}
            />
          </CardContent>
        </Card>
      )}

      {detailSession && (
        <SessionDetailPanel
          session={detailSession}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
