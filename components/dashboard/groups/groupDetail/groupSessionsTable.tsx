"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import { sessionStatusLabels, sessionStatusColors } from "@/const/sessions";
import type { GroupSession } from "@/types/groupDetails";
import SessionAttendanceDialog from "./sessionAttendanceDialog";

interface Props {
  sessions: GroupSession[];
}

export default function GroupSessionsTable({ sessions }: Props) {
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(
    null,
  );

  return (
    <>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>الوقت</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>المعلم</TableHead>
              <TableHead>الحضور</TableHead>
              <TableHead>التقارير</TableHead>
              <TableHead>حضور المعلم</TableHead>
              <TableHead>تفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{formatDate(s.startTime)}</TableCell>
                <TableCell>
                  {formatTime(s.startTime)} – {formatTime(s.endTime)}
                </TableCell>
                <TableCell>
                  <Badge className={sessionStatusColors[s.status]}>
                    {sessionStatusLabels[s.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {s.tutorAttendanceStatus != null ? "—" : "—"}
                </TableCell>
                <TableCell>
                  {s.attendanceCount}/{s.totalParticipants}
                </TableCell>
                <TableCell>
                  {s.reportCount}/{s.totalParticipants}
                </TableCell>
                <TableCell>
                  {s.tutorAttendanceStatus != null ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      مسجل
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700"
                    >
                      غير مسجل
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedSession(s)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedSession && (
        <SessionAttendanceDialog
          open={!!selectedSession}
          onOpenChange={(open) => {
            if (!open) setSelectedSession(null);
          }}
          session={selectedSession}
        />
      )}
    </>
  );
}
