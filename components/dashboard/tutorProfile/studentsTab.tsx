"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageSquare, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TutorProfile } from "@/types/tutor";
import { statusColors, statusLabels } from "@/lib/enums";

interface StudentsTabProps {
  tutor: TutorProfile;
}

export default function StudentsTab({ tutor }: StudentsTabProps) {
  const { toast } = useToast();
  const [studentSearch, setStudentSearch] = useState("");

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return tutor.students;
    return tutor.students.filter((s) => s.name.includes(studentSearch));
  }, [tutor.students, studentSearch]);

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Input
          placeholder="بحث عن طالب..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          className="w-60"
        />
        <Button
          variant="outline"
          onClick={() => toast({ title: "إرسال رسالة جماعية" })}
        >
          <MessageSquare className="h-4 w-4" /> رسالة للجميع
        </Button>
      </div>

      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا يوجد طلاب</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>العمر</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الخطة</TableHead>
                    <TableHead>الحصة القادمة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/students/${s.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell>{s.age}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[s.status]}>
                          {statusLabels[s.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.planTitle || "—"}</TableCell>
                      <TableCell>{formatDate(s.nextSessionDate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a
                              href={`https://wa.me/`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <Link href={`/dashboard/students/${s.id}`}>
                              <Users className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
