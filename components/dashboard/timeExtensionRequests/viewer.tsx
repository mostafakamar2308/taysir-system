"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Timer, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { decideTimeExtensionRequest } from "@/actions/timeExtensionRequests";
import {
  TimeExtensionRequestItem,
  TimeExtensionRequestStatus,
} from "@/types/timeExtension";
import { formatTime } from "@/lib/dates";
import dayjs from "@/lib/dayjs";

interface Props {
  initialRequests: TimeExtensionRequestItem[];
}

const tabs = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "accepted", label: "مقبولة" },
  { value: "rejected", label: "مرفوضة" },
];

const statusBadge: Record<TimeExtensionRequestStatus, { label: string; className: string }> = {
  [TimeExtensionRequestStatus.PENDING]: {
    label: "قيد المراجعة",
    className: "bg-amber-100 text-amber-700 border-amber-300",
  },
  [TimeExtensionRequestStatus.ACCEPTED]: {
    label: "مقبولة",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  [TimeExtensionRequestStatus.REJECTED]: {
    label: "مرفوضة",
    className: "bg-red-100 text-red-700 border-red-300",
  },
};

export default function TimeExtensionRequestsViewer({ initialRequests }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleDecide = async (requestId: number, accept: boolean) => {
    setLoadingId(requestId);
    try {
      const res = await decideTimeExtensionRequest(requestId, accept);
      if (!res.ok) throw new Error(res.error);
      toast({ title: accept ? "تم قبول الطلب" : "تم رفض الطلب" });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: accept ? TimeExtensionRequestStatus.ACCEPTED : TimeExtensionRequestStatus.REJECTED }
            : r,
        ),
      );
      router.refresh();
    } catch (err) {
      if (err instanceof Error)
        toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  const renderRequest = (r: TimeExtensionRequestItem) => {
    const badge = statusBadge[r.status];
    return (
      <Card key={r.id} className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{r.session.groupName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {r.session.tutorName}
              </p>
            </div>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>

          <div className="text-sm space-y-1">
            <p className="text-muted-foreground truncate">
              الطلاب: {r.session.studentNames.join("، ") || "—"}
            </p>
            {r.session.topic && (
              <p className="text-muted-foreground truncate">الموضوع: {r.session.topic}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المدة الأصلية</span>
              <span>{r.session.durationMinutes} دقيقة</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المدة المطلوب إضافتها</span>
              <span className="font-semibold text-primary">{r.addedMinutes} دقيقة</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <span className="text-muted-foreground">وقت الحصة الأصلي</span>
              <span>
                {formatTime(r.session.startTime)} – {formatTime(r.session.endTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">وقت الانتهاء المقترح</span>
              <span className="font-semibold">{formatTime(r.requestedEndTime)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                {dayjs(r.createdAt).format("YYYY/MM/DD HH:mm")}
              </span>
              {r.status !== TimeExtensionRequestStatus.PENDING && r.decidedByName && (
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  {r.decidedByName}
                </span>
              )}
            </div>

            {r.status === TimeExtensionRequestStatus.PENDING && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-700"
                  disabled={loadingId === r.id}
                  onClick={() => handleDecide(r.id, true)}
                >
                  <Check className="h-4 w-4 ml-1" />
                  قبول
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-700"
                  disabled={loadingId === r.id}
                  onClick={() => handleDecide(r.id, false)}
                >
                  <X className="h-4 w-4 ml-1" />
                  رفض
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 p-4 md:p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">طلبات تمديد الوقت</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مراجعة طلبات التمديد المقدمة من المعلمين بعد بدء الحصص
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="flex w-full sm:w-auto">
          {tabs.map((t) => {
            const count = requests.filter(
              (r) =>
                r.status ===
                (t.value === "pending"
                  ? TimeExtensionRequestStatus.PENDING
                  : t.value === "accepted"
                    ? TimeExtensionRequestStatus.ACCEPTED
                    : TimeExtensionRequestStatus.REJECTED),
            ).length;
            return (
              <TabsTrigger key={t.value} value={t.value} className="flex-1">
                {t.label}
                <Badge variant="secondary" className="mr-1 h-5 w-5 p-0 text-[10px] rounded-full flex items-center justify-center">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4 space-y-3">
            {requests
              .filter((r) =>
                t.value === "pending"
                  ? r.status === TimeExtensionRequestStatus.PENDING
                  : t.value === "accepted"
                    ? r.status === TimeExtensionRequestStatus.ACCEPTED
                    : r.status === TimeExtensionRequestStatus.REJECTED,
              )
              .map(renderRequest)}
            {requests.length === 0 && (
              <EmptyState label="لا توجد طلبات تمديد بعد" />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-muted-foreground">
      <Clock className="h-8 w-8 mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  );
}