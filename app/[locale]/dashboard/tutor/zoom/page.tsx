// app/ar/dashboard/tutor/settings/page.tsx
import { user } from "@/lib/auth";
import { Role } from "@/types/user";
import { redirect } from "next/navigation";
import db from "@/lib/prisma";
import { startZoomOAuth, unlinkZoom } from "@/actions/tutor/zoom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Unlink, Link } from "lucide-react";

const Page = async () => {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.Tutor) {
    redirect("/login");
  }

  const tutor = await db.tutor.findUnique({
    where: { id: currentUser.tutorId },
    select: {
      zoomAuthenticated: true,
      zoomUserId: true,
    },
  });

  const isConnected = tutor?.zoomAuthenticated ?? false;

  return (
    <div className="mx-auto space-y-6">
      <h1 className="text-2xl font-bold">إعدادات زووم</h1>

      <Card>
        <CardHeader>
          <CardTitle>حالة الاتصال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">الحالة:</span>
            {isConnected ? (
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 hover:bg-green-200"
              >
                متصل
              </Badge>
            ) : (
              <Badge variant="secondary">غير متصل</Badge>
            )}
          </div>

          {/* {isConnected && tutor?.zoomUserId && (
            <div className="text-sm text-muted-foreground">
              معرف المستخدم: {tutor.zoomUserId}
            </div>
          )} */}
          <p>
            {isConnected
              ? "حساب زووم الخاص بك مرتبط حالياً. يمكنك إلغاء الربط إذا كنت ترغب في ربط حساب آخر."
              : "لم تقم بربط حساب زووم بعد. قم بالربط لإنشاء روابط زووم تلقائياً لحصصك."}
          </p>
          <div className="pt-2 flex gap-3">
            {!isConnected ? (
              <form action={startZoomOAuth}>
                <Button type="submit" className="gap-2">
                  <Link className="h-4 w-4" />
                  ربط حساب زووم
                </Button>
              </form>
            ) : (
              <form action={unlinkZoom}>
                <Button variant="destructive" type="submit" className="gap-2">
                  <Unlink className="h-4 w-4" />
                  إلغاء الربط
                </Button>
              </form>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            عند الربط، سيتم إنشاء روابط زووم تلقائياً للحصص الجديدة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
