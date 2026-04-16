"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Smartphone,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

export function WhatsAppConnect() {
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/instance/status");
      const data = await res.json();
      setStatus(data.status);
      return data.status;
    } catch (err) {
      console.error(err);
      setError("فشل التحقق من حالة الاتصال");
      setStatus("error");
      return "error";
    }
  }, []);

  const createInstance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/instance/create", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setStatus("connecting");
        pollQR();
      } else {
        setError(data.error || "فشل إنشاء اتصال واتساب");
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setError("خطأ في الشبكة أثناء إنشاء الاتصال");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const disconnectInstance = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/instance/disconnect", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setStatus("disconnected");
        setQrCode(null);
      } else {
        setError(data.error || "فشل قطع الاتصال");
      }
    } catch (err) {
      console.error(err);
      setError("خطأ في الشبكة أثناء قطع الاتصال");
    } finally {
      setDisconnecting(false);
    }
  };

  const pollQR = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      const currentStatus = await checkStatus();

      if (currentStatus === "connecting") {
        try {
          const qrRes = await fetch("/api/whatsapp/instance/qr");
          const qrData = await qrRes.json();

          if (qrData.ready && qrData.qr) {
            setQrCode(qrData.qr);
            attempts = 0;
          } else {
            attempts++;
            if (attempts >= maxAttempts) {
              setError("انتهت مهلة إنشاء رمز QR. يرجى المحاولة مرة أخرى.");
              setStatus("error");
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error(err);
          attempts++;
        }
      } else if (currentStatus === "connected") {
        setQrCode(null);
        clearInterval(interval);
      } else if (
        currentStatus === "disconnected" ||
        currentStatus === "error"
      ) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (status === "connecting") {
      cleanup = pollQR();
    }
    return cleanup;
  }, [status, pollQR]);

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
            <CheckCircle className="ml-1 h-3 w-3" />
            متصل
          </Badge>
        );
      case "connecting":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400"
          >
            <Loader2 className="ml-1 h-3 w-3 animate-spin" />
            جاري الاتصال
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="ml-1 h-3 w-3" />
            خطأ
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <XCircle className="ml-1 h-3 w-3" />
            غير متصل
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full max-w-md border-border/50 shadow-sm" dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl">ربط واتساب</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          اربط حساب واتساب الخاص بالأكاديمية لإرسال الرسائل التلقائية والتذكيرات
          والإشعارات للطلاب والمعلمين.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status === "disconnected" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              اضغط على الزر أدناه لإنشاء رمز QR وربط حساب واتساب الخاص بك.
            </p>
            <Button
              onClick={createInstance}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري إنشاء الاتصال...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  ربط واتساب
                </>
              )}
            </Button>
          </div>
        )}

        {status === "connecting" && (
          <div className="space-y-4">
            {!qrCode ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  جاري إنشاء رمز QR...
                </p>
                <Skeleton className="h-48 w-48 rounded-lg" />
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative rounded-lg border-2 border-dashed border-primary/30 p-4 bg-primary/5">
                  <Image
                    src={qrCode}
                    alt="رمز QR للواتساب"
                    width={200}
                    height={200}
                    className="rounded-md"
                  />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                    <Badge variant="outline" className="bg-background">
                      <RefreshCw className="ml-1 h-3 w-3 animate-spin" />
                      في انتظار المسح
                    </Badge>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">
                    امسح رمز QR باستخدام تطبيق واتساب على هاتفك
                  </p>
                  <p className="text-xs text-muted-foreground">
                    افتح واتساب &gt; الإعدادات &gt; الأجهزة المرتبطة &gt; ربط
                    جهاز
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={async () => {
                setQrCode(null);
                await checkStatus();
                pollQR();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              تحديث رمز QR
            </Button>
          </div>
        )}

        {status === "connected" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-1.5">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-green-800 dark:text-green-300">
                    واتساب متصل بنجاح
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    يمكن للأكاديمية الآن إرسال واستقبال رسائل واتساب.
                  </p>
                </div>
              </div>
            </div>

            {/* Warning about proper disconnect */}
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <strong>تنبيه هام:</strong> إذا رغبت في إلغاء ربط التطبيق، يجب
                عليك قطع الاتصال من هنا أولاً. لا تقم بإلغاء الربط أولا من تطبيق
                واتساب، حيث قد يؤدي ذلك إلى مشاكل في الاتصال لاحقا.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={disconnectInstance}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                قطع الاتصال
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={async () => {
                  await checkStatus();
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                تحديث الحالة
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              حدث خطأ ما. يرجى محاولة قطع الاتصال ثم إعادة الربط.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={disconnectInstance}>
                قطع الاتصال
              </Button>
              <Button onClick={createInstance} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "إعادة المحاولة"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          <span>
            بيانات واتساب الخاصة بك مشفرة وتستخدم فقط لاتصالات الأكاديمية.
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
