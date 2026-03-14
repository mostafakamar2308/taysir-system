"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Building2,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { createAcademy, updateAcademy, deleteAcademy } from "@/actions/academy";

interface Academy {
  id: number;
  name: string;
  adminId: string | null;
  adminName: string | null;
  maxStudents: number | null;
  maxTutors: number | null;
  primaryColor: string | null;
  createdAt: Date;
  studentCount: number;
  tutorCount: number;
}

interface AcademiesClientProps {
  initialAcademies: Academy[];
  users: { id: string; name: string }[];
}

export default function AcademiesClient({
  initialAcademies,
  users,
}: AcademiesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [academies] = useState<Academy[]>(initialAcademies);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Academy | null>(null);

  const [formName, setFormName] = useState("");
  const [formAdminId, setFormAdminId] = useState<string>("");
  const [formMaxStudents, setFormMaxStudents] = useState("");
  const [formMaxTutors, setFormMaxTutors] = useState("");
  const [formPrimaryColor, setFormPrimaryColor] = useState("#1a9a5c");

  const filtered = academies.filter((a) => a.name.includes(search));

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormAdminId("");
    setFormMaxStudents("");
    setFormMaxTutors("");
    setFormPrimaryColor("#1a9a5c");
    setDialogOpen(true);
  };

  const openEdit = (academy: Academy) => {
    setEditing(academy);
    setFormName(academy.name);
    setFormAdminId(academy.adminId || "");
    setFormMaxStudents(academy.maxStudents?.toString() || "");
    setFormMaxTutors(academy.maxTutors?.toString() || "");
    setFormPrimaryColor(academy.primaryColor || "#1a9a5c");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName) return;

    const formData = new FormData();
    formData.append("name", formName);
    if (formAdminId) formData.append("adminId", formAdminId);
    if (formMaxStudents) formData.append("maxStudents", formMaxStudents);
    if (formMaxTutors) formData.append("maxTutors", formMaxTutors);
    if (formPrimaryColor) formData.append("primaryColor", formPrimaryColor);

    try {
      if (editing) {
        await updateAcademy(editing.id, formData);
        toast({ title: "تم تحديث الأكاديمية" });
      } else {
        await createAcademy(formData);
        toast({ title: "تمت إضافة الأكاديمية" });
      }
      setDialogOpen(false);
      router.refresh(); // re-fetch data from server
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAcademy(id);
      toast({ title: "تم الحذف", variant: "destructive" });
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            إدارة الأكاديميات
          </h1>
          <p className="text-sm text-muted-foreground">
            إدارة جميع الأكاديميات في المنصة
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة أكاديمية
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الأكاديمية</TableHead>
                <TableHead>المشرف</TableHead>
                <TableHead>الطلاب</TableHead>
                <TableHead>المعلمين</TableHead>
                <TableHead>الحدود</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    لا توجد أكاديميات
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {a.primaryColor && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: a.primaryColor }}
                          />
                        )}
                        {a.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.adminName || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                        {a.studentCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        {a.tutorCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.maxStudents && <span>طلاب: {a.maxStudents}</span>}
                      {a.maxStudents && a.maxTutors && " · "}
                      {a.maxTutors && <span>معلمين: {a.maxTutors}</span>}
                      {!a.maxStudents && !a.maxTutors && "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(a.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => console.log("View", a.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                حذف الأكاديمية
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف &quot;{a.name}&quot;؟ هذا
                                الإجراء لا يمكن التراجع عنه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(a.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "تعديل أكاديمية" : "إضافة أكاديمية جديدة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الأكاديمية *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>المشرف</Label>
              <Select value={formAdminId} onValueChange={setFormAdminId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مشرفًا" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأقصى للطلاب</Label>
                <Input
                  type="number"
                  value={formMaxStudents}
                  onChange={(e) => setFormMaxStudents(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى للمعلمين</Label>
                <Input
                  type="number"
                  value={formMaxTutors}
                  onChange={(e) => setFormMaxTutors(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>اللون الأساسي</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formPrimaryColor}
                  onChange={(e) => setFormPrimaryColor(e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer border border-input"
                />
                <Input
                  value={formPrimaryColor}
                  onChange={(e) => setFormPrimaryColor(e.target.value)}
                  dir="ltr"
                  className="text-left flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>{editing ? "حفظ" : "إضافة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
