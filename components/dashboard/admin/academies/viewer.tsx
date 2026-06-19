"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { createAcademy, updateAcademy, deleteAcademy } from "@/actions/academy";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/finances";

interface Academy {
  id: number;
  name: string;
  adminId: number | null;
  adminName: string | null;
  adminEmail: string | null;
  studentCount: number;
  tutorCount: number;
  totalRevenue: number;
  totalExpenses: number;
  saasPlanName: string | null;
  saasPlanDollarPrice: number | null;
  saasPlanEgyptianPrice: number | null;
  createdAt: Date;
}

interface SaasPlan {
  id: number;
  name: string;
  dollarPrice: number;
  egyptianPrice: number;
  maxStudents: number;
  maxTutors: number;
  billingPeriod: number;
}

interface AcademiesClientProps {
  academies: Academy[];
  saasPlans: SaasPlan[];
}

export default function AcademiesClient({
  academies: initialAcademies,
  saasPlans,
}: AcademiesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [academies] = useState(initialAcademies);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    saasPlanId: "",
    isFreeTrial: false,
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = academies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingAcademy(null);
    setFormData({
      name: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      saasPlanId: "",
      isFreeTrial: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (academy: Academy) => {
    setEditingAcademy(academy);
    setFormData({
      name: academy.name,
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      saasPlanId: academy.saasPlanName
        ? saasPlans
            .find((p) => p.name === academy.saasPlanName)
            ?.id.toString() || ""
        : "",
      isFreeTrial: false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "يرجى إدخال اسم الأكاديمية", variant: "destructive" });
      return;
    }
    if (
      !editingAcademy &&
      (!formData.adminEmail || !formData.adminName || !formData.adminPassword)
    ) {
      toast({ title: "يرجى إدخال بيانات المشرف", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        saasPlanId: parseInt(formData.saasPlanId) || undefined,
        isFreeTrial: formData.isFreeTrial,
      };
      if (editingAcademy) {
        await updateAcademy(editingAcademy.id, payload);
        toast({ title: "تم تحديث الأكاديمية" });
      } else {
        await createAcademy(payload);
        toast({ title: "تمت إضافة الأكاديمية" });
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteAcademy(deleteId);
      toast({ title: "تم حذف الأكاديمية" });
      setDeleteId(null);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            إدارة الأكاديميات
          </h1>
          <p className="text-muted-foreground">
            إدارة جميع الأكاديميات على المنصة
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 ml-2" /> إضافة أكاديمية
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم الأكاديمية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الأكاديمية</TableHead>
                  <TableHead>المشرف</TableHead>
                  <TableHead>الطلاب</TableHead>
                  <TableHead>المعلمين</TableHead>
                  <TableHead>الخطة</TableHead>
                  <TableHead>إجمالي الإيرادات</TableHead>
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
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{a.adminName || "—"}</TableCell>
                      <TableCell>{a.studentCount}</TableCell>
                      <TableCell>{a.tutorCount}</TableCell>
                      <TableCell>
                        {a.saasPlanName ? (
                          <Badge variant="outline">{a.saasPlanName}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(a.totalRevenue, "EGP")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/ar/dashboard/admin/academies/${a.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(a)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(a.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingAcademy ? "تعديل أكاديمية" : "إضافة أكاديمية جديدة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الأكاديمية</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {!editingAcademy && (
              <>
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">بيانات المشرف</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم</Label>
                      <Input
                        value={formData.adminName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adminName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adminEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>كلمة المرور</Label>
                      <Input
                        type="password"
                        value={formData.adminPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adminPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">الخطة</h3>
              <div className="space-y-2">
                <Label>اختر الخطة</Label>
                <Select
                  value={formData.saasPlanId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, saasPlanId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر خطة" />
                  </SelectTrigger>
                  <SelectContent>
                    {saasPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} - {formatCurrency(p.egyptianPrice, "EGP")}/
                        {p.billingPeriod} يوم
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="freeTrial"
                  checked={formData.isFreeTrial}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, isFreeTrial: v === true })
                  }
                />
                <Label htmlFor="freeTrial">فترة تجريبية مجانية لمدة شهر</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "جاري الحفظ..." : editingAcademy ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الأكاديمية؟ سيتم حذف جميع البيانات
              المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
