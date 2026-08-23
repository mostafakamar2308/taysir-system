"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCheck, UserX, Pencil, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { toggleSupervisorActive } from "@/actions/supervisor";
import AddSupervisorDialog from "@/components/dashboard/supervisors/addSupervisorDialog";
import EditSupervisorDialog from "@/components/dashboard/supervisors/editSupervisorDialog";
import AssignTutorsDialog, {
  AssignableTutor,
} from "@/components/dashboard/supervisors/assignTutorsDialog";

export interface DashboardSupervisor {
  id: number;
  name: string;
  email: string;
  phone: string;
  timezone: string;
  active: boolean;
  createdAt: Date;
  tutors: { id: number; name: string; active: boolean }[];
}

interface SupervisorsViewerProps {
  supervisors: DashboardSupervisor[];
  tutors: AssignableTutor[];
  academyId: number;
}

export default function SupervisorsViewer({
  supervisors,
  tutors,
}: SupervisorsViewerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [assigningSupervisor, setAssigningSupervisor] =
    useState<DashboardSupervisor | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const activeCount = supervisors.filter((s) => s.active).length;
  const assignedTutorsCount = supervisors.reduce(
    (sum, s) => sum + s.tutors.length,
    0,
  );

  async function handleToggleActive(supervisor: DashboardSupervisor) {
    setTogglingId(supervisor.id);
    try {
      const res = await toggleSupervisorActive(supervisor.id);
      if (!res.ok) throw new Error(res.error);
      toast({
        title: supervisor.active
          ? "تم تعطيل المشرف"
          : "تم تفعيل المشرف",
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            المشرفين
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {supervisors.length} مشرف · {activeCount} نشط
          </p>
        </div>
        <AddSupervisorDialog />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{supervisors.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي المشرفين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">مشرفين نشطين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assignedTutorsCount}</p>
              <p className="text-xs text-muted-foreground">معلمين معيّنين</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>المعلمين المعيّنين</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisors.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10"
                  >
                    لا يوجد مشرفين بعد، ابدأ بإضافة أول مشرف
                  </TableCell>
                </TableRow>
              )}
              {supervisors.map((supervisor) => (
                <TableRow key={supervisor.id}>
                  <TableCell className="font-medium">
                    {supervisor.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supervisor.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supervisor.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {supervisor.tutors.length} معلم
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={supervisor.active ? "default" : "secondary"}
                      className={
                        supervisor.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {supervisor.active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => setAssigningSupervisor(supervisor)}
                      >
                        <UserCog className="h-4 w-4" /> تعيين المعلمين
                      </Button>
                      <EditSupervisorDialog supervisor={supervisor}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Pencil className="h-4 w-4" /> تعديل
                        </Button>
                      </EditSupervisorDialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        disabled={togglingId === supervisor.id}
                        onClick={() => handleToggleActive(supervisor)}
                      >
                        {supervisor.active ? (
                          <UserX className="h-4 w-4 text-destructive" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                        {supervisor.active ? "تعطيل" : "تفعيل"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {assigningSupervisor && (
        <AssignTutorsDialog
          supervisorId={assigningSupervisor.id}
          supervisorName={assigningSupervisor.name}
          tutors={tutors}
          open={!!assigningSupervisor}
          onOpenChange={(open) => !open && setAssigningSupervisor(null)}
        />
      )}
    </div>
  );
}
