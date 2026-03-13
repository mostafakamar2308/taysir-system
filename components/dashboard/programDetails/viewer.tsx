"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  BookOpen,
  Clock,
  GraduationCap,
  Users,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { ProgramFormDialog } from "@/components/dashboard/programs/programFormDialog";
import { TopicFormDialog } from "@/components/dashboard/programDetails/topicFormDialog";
import { EnrollmentDialog } from "@/components/dashboard/programDetails/enrollmentDialog";
import { deleteTopic, reorderTopics } from "@/actions/program";
import { toast } from "@/hooks/use-toast";
import { Program, ProgramTopic, StudentEnrollment } from "@/types/program";

interface ProgramDetailClientProps {
  program: Program;
}

const enrollmentStatusMap: Record<number, { label: string; color: string }> = {
  0: {
    label: "نشط",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  1: {
    label: "مكتمل",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  2: {
    label: "منسحب",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function ProgramDetailClient({
  program: initialProgram,
}: ProgramDetailClientProps) {
  const router = useRouter();
  const [program] = useState(initialProgram);
  const [topics, setTopics] = useState(initialProgram.topics);
  const [programFormOpen, setProgramFormOpen] = useState(false);
  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<ProgramTopic | null>(null);
  const [deleteTopicId, setDeleteTopicId] = useState<number | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  const moveTopic = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === topics.length - 1)
    )
      return;
    const newTopics = [...topics];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newTopics[index], newTopics[swapIndex]] = [
      newTopics[swapIndex],
      newTopics[index],
    ];
    // Update order numbers
    newTopics.forEach((t, idx) => (t.order = idx + 1));
    setTopics(newTopics);
    // Save to server
    try {
      await reorderTopics(
        program.id,
        newTopics.map((t) => ({ id: t.id, order: t.order })),
      );
      toast({ title: "تم إعادة الترتيب" });
    } catch (error) {
      console.log({ error });

      toast({ title: "حدث خطأ", variant: "destructive" });
      // Revert on error? For simplicity, we'll just show error.
    }
  };

  const handleTopicSave = (data: { title: string; description: string }) => {
    if (editingTopic) {
      // Update locally
      setTopics((prev) =>
        prev.map((t) => (t.id === editingTopic.id ? { ...t, ...data } : t)),
      );
      toast({ title: "تم التعديل" });
    } else {
      // We need to wait for server response; for simplicity, we'll refresh the page.
      // But we can also push optimistic update.
      // Since we have the server action, we'll just refresh.
    }
    setEditingTopic(null);
    router.refresh(); // This will re-fetch data from server
  };

  const handleDeleteTopic = async () => {
    if (deleteTopicId !== null) {
      try {
        await deleteTopic(deleteTopicId, program.id);
        setTopics((prev) =>
          prev
            .filter((t) => t.id !== deleteTopicId)
            .map((t, i) => ({ ...t, order: i + 1 })),
        );
        toast({ title: "تم الحذف" });
        setDeleteTopicId(null);
      } catch (error) {
        console.log({ error });
        toast({ title: "حدث خطأ", variant: "destructive" });
      }
    }
  };

  const handleProgramSave = () => {
    router.refresh();
  };

  const handleEnrollSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Back + Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/programs")}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <span className="text-muted-foreground text-sm">البرامج التعليمية</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{program.name}</h1>
          {program.description && (
            <p className="text-muted-foreground mt-1 max-w-2xl">
              {program.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setEnrollDialogOpen(true)}
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            تسجيل طالب
          </Button>
          <Button
            variant="outline"
            onClick={() => setProgramFormOpen(true)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            تعديل البرنامج
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المستوى</p>
              <p className="font-semibold">{program.level || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المدة</p>
              <p className="font-semibold">
                {program.duration ? `${program.duration} أسابيع` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المواضيع</p>
              <p className="font-semibold">{topics.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الملتحقون</p>
              <p className="font-semibold">{program.enrollments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">المواضيع</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingTopic(null);
              setTopicFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة موضوع
          </Button>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                لا توجد مواضيع بعد. ابدأ بإضافة المواضيع الدراسية.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-20">الترتيب</TableHead>
                    <TableHead className="text-right">عنوان الموضوع</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right w-32">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.map((topic, idx: number) => (
                    <TableRow key={topic.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => moveTopic(idx, "up")}
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => moveTopic(idx, "down")}
                              disabled={idx === topics.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-mono text-muted-foreground">
                            {topic.order}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {topic.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {topic.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingTopic(topic);
                              setTopicFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteTopicId(topic.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolled Students */}
      {program.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الطلاب الملتحقون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الطالب</TableHead>
                    <TableHead className="text-right">تاريخ الالتحاق</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التقدم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {program.enrollments.map((enrollment: StudentEnrollment) => {
                    const completedCount = enrollment.topics.filter(
                      (t) => t.completed,
                    ).length;
                    const totalCount = enrollment.topics.length;
                    const progress =
                      totalCount > 0
                        ? Math.round((completedCount / totalCount) * 100)
                        : 0;
                    const statusInfo = enrollmentStatusMap[
                      enrollment.status
                    ] || {
                      label: "غير معروف",
                      color: "bg-gray-100 text-gray-800",
                    };
                    return (
                      <TableRow
                        key={enrollment.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/dashboard/students/${enrollment.studentId}`,
                          )
                        }
                      >
                        <TableCell className="font-medium">
                          {enrollment.student.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {enrollment.enrolledAt.toDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusInfo.color}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-37.5">
                            <Progress value={progress} className="h-2 flex-1" />
                            <span className="text-sm text-muted-foreground">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ProgramFormDialog
        open={programFormOpen}
        onOpenChange={setProgramFormOpen}
        program={program}
        onSave={handleProgramSave}
        academyId={program.academyId}
      />
      <TopicFormDialog
        open={topicFormOpen}
        onOpenChange={setTopicFormOpen}
        topic={editingTopic}
        programId={program.id}
        onSave={handleTopicSave}
      />
      <EnrollmentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        programId={program.id}
        academyId={program.academyId}
        onEnroll={handleEnrollSuccess}
      />

      {/* Delete Topic Confirmation */}
      <AlertDialog
        open={deleteTopicId !== null}
        onOpenChange={() => setDeleteTopicId(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الموضوع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الموضوع؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
