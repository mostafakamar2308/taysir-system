"use client";
import { useState } from "react";
import {
  students,
  statusLabels,
  statusColors,
  sourceLabels,
  planLabels,
  type Student,
} from "@/data/mockData";
import { ViewToggle } from "@/components/dashboard/common/viewToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Phone,
  Mail,
  Clock,
  BookOpen,
  CalendarDays,
  Search,
  Users,
} from "lucide-react";

export default function StudentsPage() {
  const [view, setView] = useState<"cards" | "table">("cards");
  const [search, setSearch] = useState("");

  const filtered = students.filter(
    (s) =>
      s.name.includes(search) ||
      s.email.includes(search) ||
      s.tutorName.includes(search),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            الطلاب
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {students.length} طالب مسجل
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              className="pr-9 w-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(
          [
            "trial",
            "subscribed",
            "lead",
            "churned",
            "paused",
          ] as Student["status"][]
        ).map((status) => (
          <Card key={status} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${statusColors[status]}`}
              >
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {statusLabels[status]}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {students.filter((s) => s.status === status).length}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content */}
      {view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">العمر</TableHead>
                <TableHead className="text-right">الدولة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">البرنامج</TableHead>
                <TableHead className="text-right">الخطة</TableHead>
                <TableHead className="text-right">المعلم</TableHead>
                <TableHead className="text-right">المصدر</TableHead>
                <TableHead className="text-right">تاريخ التجديد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.age}</TableCell>
                  <TableCell>{s.country}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[s.status]}`}
                    >
                      {statusLabels[s.status]}
                    </span>
                  </TableCell>
                  <TableCell>{s.currentProgram}</TableCell>
                  <TableCell>{planLabels[s.plan]}</TableCell>
                  <TableCell>{s.tutorName}</TableCell>
                  <TableCell>{sourceLabels[s.source]}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {s.renewalDate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function StudentCard({ student }: { student: Student }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {student.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{student.name}</h3>
              <p className="text-xs text-muted-foreground">
                {student.age} سنة · {student.country}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[student.status]}`}
          >
            {statusLabels[student.status]}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{student.currentProgram}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{student.tutorName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{planLabels[student.plan]}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{student.timezone.split("/")[1]}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${student.whatsapp.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${student.email}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            {sourceLabels[student.source]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
