"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SessionClientData } from "@/types/tutor/session";
import SessionsFilters from "./sessionFilters";
import TableView from "./tableView";
import AddSessionDialog from "@/components/dashboard/dialogs/addSessionToTutorDialog";
import SessionDetailPanel from "./sessionDetailPanel";

interface SessionsClientProps {
  sessions: SessionClientData[];
  students: { id: number; name: string; balance: number }[];
  currentWeekStart: string;
  filter?: string;
  sessionIdParam: number | null;
  tutorId: number;
}

export default function SessionsClient({
  sessions: initialSessions,
  students,
  currentWeekStart,
  sessionIdParam,
  tutorId,
}: SessionsClientProps) {
  const t = useTranslations("TutorSessions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [detailSession, setDetailSession] = useState<SessionClientData | null>(
    () => {
      if (sessionIdParam) {
        return initialSessions.find((s) => s.id === sessionIdParam) || null;
      }
      return null;
    },
  );

  const [detailOpen, setDetailOpen] = useState(!!sessionIdParam);

  const handleSessionClick = (session: SessionClientData) => {
    setDetailSession(session);
    setDetailOpen(true);
  };

  const handleUpdate = () => {
    router.refresh();
    setDetailOpen(false);
    setDetailSession(null);
  };

  const studentId = searchParams.get("studentId") || undefined;
  const status = searchParams.get("status") || undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <AddSessionDialog tutorId={tutorId} studentOptions={students}>
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
            studentId={studentId}
            status={status}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <TableView
            sessions={initialSessions}
            onSessionClick={handleSessionClick}
          />
        </CardContent>
      </Card>

      {detailSession ? (
        <SessionDetailPanel
          onOpenChange={setDetailOpen}
          open={detailOpen}
          onUpdate={handleUpdate}
          session={detailSession}
        />
      ) : null}
    </div>
  );
}
