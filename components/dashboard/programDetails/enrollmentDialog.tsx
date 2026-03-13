"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { enrollStudent } from "@/actions/program";
import { StudentEnrollment } from "@/types/program";

interface EnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: number;
  academyId: number;
  onEnroll: () => void;
}

export function EnrollmentDialog({
  open,
  onOpenChange,
  programId,
  academyId,
  onEnroll,
}: EnrollmentDialogProps) {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );

  // Fetch students when dialog opens
  useEffect(() => {
    if (open) {
      const fetchStudents = async () => {
        try {
          const res = await fetch(
            `/api/students?academyId=${academyId}&search=${search}`,
          );
          const data = await res.json();
          setStudents(data);
        } catch (error) {
          console.error(error);
        }
      };
      fetchStudents();
    }
  }, [open, search, academyId]);

  const handleEnroll = async () => {
    if (!selectedStudentId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طالب",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await enrollStudent(selectedStudentId, programId);
      toast({
        title: "تم التسجيل",
        description: "تم تسجيل الطالب في البرنامج",
      });
      onEnroll();
      onOpenChange(false);
    } catch (error) {
      console.log({ error });

      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message || "حدث خطأ",
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل طالب في البرنامج</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن طالب..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد</TableHead>
                  <TableHead className="text-right w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-4"
                    >
                      لا يوجد طلاب
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow
                      key={student.id}
                      className={`cursor-pointer ${selectedStudentId === student.id ? "bg-primary/10" : ""}`}
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <TableCell className="font-medium">
                        {student.id || "Mostafa"}
                      </TableCell>
                      <TableCell>
                        {student.id || "mostafakamar.dev@gmail.com"}
                      </TableCell>
                      <TableCell>
                        {selectedStudentId === student.id && (
                          <span className="text-primary">✓</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={loading || !selectedStudentId}
          >
            {loading ? "جاري التسجيل..." : "تسجيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
