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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TutorProfile } from "@/types/tutor";
import { statusColors, statusLabels } from "@/lib/enums";
import { StudentStatus } from "@/types/student";

interface StudentsTabProps {
  tutor: TutorProfile;
}

export default function StudentsTab({ tutor }: StudentsTabProps) {
  const { toast } = useToast();
  const [studentSearch, setStudentSearch] = useState("");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return tutor.students;
    return tutor.students.filter((s) => s.name.includes(studentSearch));
  }, [tutor.students, studentSearch]);

  const studentsWithNumber = useMemo(() => {
    return filteredStudents.filter(
      (s) => !!s.phone && s.status === StudentStatus.subscribed,
    );
  }, [filteredStudents]);

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—";

  const handleSendBulkMessage = async () => {
    if (!bulkMessage.trim()) {
      toast({
        title: "الرجاء كتابة رسالة",
        variant: "destructive",
      });
      return;
    }

    // Build messages array for all filtered students
    const messages = studentsWithNumber.map((student) => ({
      phoneNumber: student.phone,
      message: bulkMessage.trim(),
    }));

    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: `تم إرسال ${data.jobs.length} رسالة بنجاح`,
          description: "ستصل الرسائل إلى الطلاب خلال لحظات",
        });
        setMessageDialogOpen(false);
        setBulkMessage("");
      } else {
        toast({
          title: "فشل الإرسال",
          description: data.error || "حدث خطأ ما",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ في الشبكة",
        description: "تعذر الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

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
          onClick={() => setMessageDialogOpen(true)}
          disabled={filteredStudents.length === 0}
        >
          <MessageSquare className="h-4 w-4 ml-2" />
          رسالة للجميع
        </Button>
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال رسالة جماعية</DialogTitle>
            <DialogDescription>
              سيتم إرسال هذه الرسالة إلى {studentsWithNumber.length} طالب
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="اكتب رسالتك هنا..."
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              سيتم إرسال الرسالة عبر واتساب لكل طالب على حدة
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setMessageDialogOpen(false)}
              disabled={isSending}
            >
              إلغاء
            </Button>
            <Button onClick={handleSendBulkMessage} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 ml-2" />
                  إرسال
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                              href={`https://wa.me/${s.phone?.replace(/\D/g, "")}`}
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
