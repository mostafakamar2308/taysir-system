"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Ban, KeyRound, Users } from "lucide-react";
import {
  createUser,
  updateUser,
  toggleUserActive,
  resetPassword,
} from "@/actions/user-management";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: number;
  timezone: string;
  preferredLanguage: string | null;
  active: boolean;
  createdAt: Date;
}

interface UserManagementClientProps {
  initialUsers: User[];
  academyId: number;
}

const roleLabels: Record<number, string> = {
  2: "مشرف",
  3: "معلم",
};

const roleBadgeColors: Record<number, string> = {
  2: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  3: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function UserManagementClient({
  initialUsers,
}: UserManagementClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [users] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("3");
  const [formPassword, setFormPassword] = useState("");
  const [formSendInvite, setFormSendInvite] = useState(true);
  const [loading, setLoading] = useState(false);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.includes(search) || u.email.includes(search);
    const matchRole = roleFilter === "all" || u.role === Number(roleFilter);
    return matchSearch && matchRole;
  });

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormEmail("");
    setFormRole("3");
    setFormPassword("");
    setFormSendInvite(true);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(String(user.role));
    setFormPassword("");
    setFormSendInvite(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formEmail) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", formName);
      formData.append("email", formEmail);
      formData.append("role", formRole);
      if (!editing) {
        formData.append("password", formPassword);
        // academyId is not added; the server action gets it from token
        await createUser(formData);
      } else {
        await updateUser(editing.id, formData);
      }
      toast({ title: editing ? "تم التحديث" : "تمت الإضافة" });
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

  const handleToggleActive = async (userId: string) => {
    try {
      await toggleUserActive(userId);
      toast({ title: "تم تحديث الحالة" });
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

  const handleResetPassword = async (userId: string) => {
    try {
      const result = await resetPassword(userId);
      // In a real app, you'd send an email; here we show the new password in a toast (for demo only)
      toast({
        title: "تم إعادة تعيين كلمة المرور",
        description: `كلمة المرور الجديدة: ${result.tempPassword}`,
      });
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
            <Users className="h-5 w-5" />
            إدارة المستخدمين
          </h1>
          <p className="text-sm text-muted-foreground">
            إدارة المعلمين والمشرفين في الأكاديمية
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="2">مشرف</SelectItem>
                <SelectItem value="3">معلم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    لا يوجد مستخدمين
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell
                      className="text-muted-foreground text-xs"
                      dir="ltr"
                    >
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={roleBadgeColors[u.role]}>
                        {roleLabels[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.active ? "default" : "secondary"}
                        className={u.active ? "bg-primary/10 text-primary" : ""}
                      >
                        {u.active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(u.id)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleResetPassword(u.id)}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
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
              {editing ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label>الدور *</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">مشرف</SelectItem>
                  <SelectItem value="3">معلم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <>
                <div className="space-y-2">
                  <Label>كلمة المرور *</Label>
                  <Input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="invite"
                    checked={formSendInvite}
                    onCheckedChange={(v) => setFormSendInvite(v === true)}
                  />
                  <Label
                    htmlFor="invite"
                    className="text-sm font-normal cursor-pointer"
                  >
                    إرسال دعوة بالبريد الإلكتروني
                  </Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "جاري الحفظ..." : editing ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
