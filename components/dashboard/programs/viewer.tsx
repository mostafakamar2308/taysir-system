"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Search,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
} from "lucide-react";
import { ProgramFormDialog } from "@/components/dashboard/programs/programFormDialog";
import { toast } from "@/hooks/use-toast";
import { deleteProgram } from "@/actions/program";
import { ProgramTopic } from "@/types/program";

interface Program {
  id: number;
  name: string;
  description: string | null;
  level: string | null;
  duration: number | null;
  academyId: number;
  createdAt: string;
  topics: ProgramTopic[];
  enrollmentCount: number;
}

interface ProgramsClientProps {
  programs: Program[];
  academyId: number;
}

const programLevels = ["مبتدئ", "متوسط", "متقدم", "احترافي"];

export default function ProgramsClient({
  programs: initialPrograms,
  academyId,
}: ProgramsClientProps) {
  const router = useRouter();
  const [programs, setPrograms] = useState(initialPrograms);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        p.name.includes(search) || (p.description || "").includes(search);
      const matchLevel = levelFilter === "all" || p.level === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [programs, search, levelFilter]);

  const handleSave = () => {
    router.refresh();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProgram(deleteId);
      setPrograms((prev) => prev.filter((p) => p.id !== deleteId));
      toast({ title: "تم الحذف", description: "تم حذف البرنامج بنجاح" });
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            البرامج التعليمية
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة البرامج التعليمية والمناهج الدراسية
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProgram(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة برنامج
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue placeholder="المستوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                {programLevels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              لا توجد برامج
            </h3>
            <p className="text-muted-foreground mb-6">
              ابدأ بإضافة أول برنامج تعليمي لأكاديميتك
            </p>
            <Button
              onClick={() => {
                setEditingProgram(null);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة برنامج
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم البرنامج</TableHead>
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">المدة</TableHead>
                    <TableHead className="text-right">عدد المواضيع</TableHead>
                    <TableHead className="text-right">الملتحقون</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((program) => (
                    <TableRow
                      key={program.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/dashboard/programs/${program.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          {program.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {program.level && (
                          <Badge variant="secondary">{program.level}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {program.duration ? `${program.duration} أسابيع` : "—"}
                      </TableCell>
                      <TableCell>{program.topics.length}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                          {program.enrollmentCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {program.createdAt}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              router.push(`/dashboard/programs/${program.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingProgram(program);
                              setFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(program.id)}
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
          </CardContent>
        </Card>
      )}

      <ProgramFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        program={editingProgram}
        onSave={handleSave}
        academyId={academyId}
      />

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا البرنامج؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
