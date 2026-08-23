"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setZoomLink, unlinkZoom } from "@/actions/tutor/zoom";

interface Props {
  isConnected: boolean;
  currentZoomUrl: string | null;
}

export default function ZoomSettingsPage({
  isConnected,
  currentZoomUrl,
}: Props) {
  const t = useTranslations("ZoomSettings");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await setZoomLink(formData);
      if (!res.ok) throw new Error(res.error);
      toast({ title: "تم حفظ رابط Zoom" });
    } catch (err) {
      if (err instanceof Error)
        toast({
          title: "خطأ",
          description: err.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    try {
      const res = await unlinkZoom();
      if (!res.ok) throw new Error(res.error);
      toast({ title: "تم إلغاء رابط Zoom" });
    } catch (err) {
      if (err instanceof Error)
        toast({
          title: "خطأ",
          description: err.message,
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t("statusLabel")}</span>
            {isConnected ? (
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 hover:bg-green-200"
              >
                {t("statusConnected")}
              </Badge>
            ) : (
              <Badge variant="secondary">{t("statusDisconnected")}</Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {isConnected
              ? "رابط Zoom الحالي: " + (currentZoomUrl || "—")
              : "أدخل رابط Zoom الثابت الخاص بك (يمكنك الحصول عليه من إعدادات Zoom)"}
          </p>

          <form action={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>رابط Zoom الثابت</Label>
              <Input
                name="zoomUrl"
                placeholder="https://zoom.us/j/1234567890"
                defaultValue={currentZoomUrl ?? ""}
                dir="ltr"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="gap-2" disabled={loading}>
                {loading
                  ? "جاري الحفظ..."
                  : isConnected
                    ? "تحديث الرابط"
                    : "حفظ الرابط"}
              </Button>
              {isConnected && (
                <Button
                  variant="destructive"
                  onClick={handleUnlink}
                  disabled={loading}
                  className="gap-2"
                >
                  <Unlink className="h-4 w-4" />
                  {t("unlinkButton")}
                </Button>
              )}
            </div>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            يمكنك إنشاء اجتماع متكرر في Zoom بدون تاريخ انتهاء، ثم نسخ رابط
            الانضمام ولصقه هنا. سيتم استخدام نفس الرابط لجميع حصصك.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
