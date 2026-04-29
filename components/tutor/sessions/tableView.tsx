"use client";
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
import {
    AttendanceStatus,
    DashboardSession,
    SessionStatus,
} from "@/types/session";

interface TableViewProps {
    sessions: DashboardSession[];
    onSessionClick: (session: DashboardSession) => void;
}

export default function TableView({
    sessions,
    onSessionClick,
}: TableViewProps) {


    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الوقت</TableHead>
                        <TableHead>الطالب</TableHead>
                        <TableHead>الموضوع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الحضور</TableHead>
                        <TableHead>التقرير</TableHead>
                        <TableHead>إجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                لا توجد حصص
                            </TableCell>
                        </TableRow>
                    ) : (
                        sessions.map((s) => (
                            <TableRow
                                key={s.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => onSessionClick(s)}
                            >
                                <TableCell>{formatDate(s.startTime)}</TableCell>
                                <TableCell>
                                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                                </TableCell>
                                <TableCell>{s.studentName}</TableCell>
                                <TableCell>{s.topic || "—"}</TableCell>
                                <TableCell>
                                    <Badge className={sessionStatusColors[s.status as SessionStatus]}>
                                        {sessionStatusLabels[s.status as SessionStatus]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {s.attendance ? (
                                        <Badge
                                            className={
                                                s.attendance.tutorAttendance === AttendanceStatus.ATTENDED
                                                    ? "bg-green-100 text-green-700"
                                                    : s.attendance.tutorAttendance === AttendanceStatus.LATE
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-red-100 text-red-700"
                                            }
                                        >
                                            {s.attendance.tutorAttendance === AttendanceStatus.ATTENDED
                                                ? "حاضر"
                                                : s.attendance.tutorAttendance === AttendanceStatus.LATE
                                                    ? "متأخر"
                                                    : "غائب"}
                                        </Badge>
                                    ) : s.status === SessionStatus.COMPLETED ? (
                                        <span className="text-amber-600 text-xs">لم يسجل</span>
                                    ) : (
                                        "—"
                                    )}
                                </TableCell>
                                <TableCell>
                                    {s.report ? (
                                        <Badge variant="outline" className="bg-primary/10 text-primary">
                                            مكتمل
                                        </Badge>
                                    ) : s.status === SessionStatus.COMPLETED &&
                                        s.attendance &&
                                        [
                                            AttendanceStatus.ATTENDED,
                                            AttendanceStatus.LATE,
                                        ].includes(s.attendance.studentAttendance) ? (
                                        <span className="text-blue-600 text-xs">بحاجة تقرير</span>
                                    ) : (
                                        "—"
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSessionClick(s);
                                        }}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}