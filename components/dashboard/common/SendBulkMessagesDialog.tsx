"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWhatsApp } from "@/lib/contexts/whatsapp"; // استيراد الخطاف

interface SendBulkMessagesDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  users: { phone: string }[];
}

const SendBulkMessagesDialog: React.FC<SendBulkMessagesDialogProps> = ({
  open, users, setOpen,
}) => {
  const [bulkMessage, setBulkMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { status } = useWhatsApp(); // الحصول على حالة الاتصال
  const router = useRouter();

  const isConnected = status === "connected";

  const handleSendBulkMessage = async () => {
    if (!isConnected) {
      toast({
        title: "واتساب غير متصل",
        description: "يجب ربط حساب واتساب أولاً قبل إرسال الرسائل",
        variant: "destructive",
      });
      return;
    }

    if (!bulkMessage.trim()) {
      toast({
        title: "الرجاء كتابة رسالة",
        variant: "destructive",
      });
      return;
    }

    const messages = users.map((user) => ({
      phoneNumber: user.phone,
      message: bulkMessage.trim(),
    }));

    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title: `تم إرسال ${data.jobs.length} رسالة بنجاح`,
          description: "ستصل الرسائل إلى المستلمين خلال لحظات",
        });
        setOpen(false);
        setBulkMessage("");
      } else {
        toast({
          title: "فشل الإرسال",
          description: data.error || "حدث خطأ ما",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ في الشبكة",
        description: "تعذر الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إرسال رسالة جماعية</DialogTitle>
          <DialogDescription>
            سيتم إرسال هذه الرسالة إلى {users.length} مستخدم
          </DialogDescription>
        </DialogHeader>

        {/* تنبيه إذا لم يكن واتساب متصلاً */}
        {!isConnected && (
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span>يجب ربط واتساب أولاً قبل إرسال الرسائل.</span>
              <Button
                variant="link"
                className="h-auto p-0 text-amber-900 underline justify-start"
                onClick={() => {
                  setOpen(false);
                  router.push("/ar/dashboard/settings/whatsapp");
                }}
              >
                <ExternalLink className="ml-1 h-3 w-3" />
                الذهاب إلى صفحة ربط واتساب
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="اكتب رسالتك هنا..."
            value={bulkMessage}
            onChange={(e) => setBulkMessage(e.target.value)}
            rows={5}
            className="resize-none"
            disabled={!isConnected}
          />
          <p className="text-xs text-muted-foreground">
            سيتم إرسال الرسالة عبر واتساب لكل مستخدم على حدة
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
            إلغاء
          </Button>
          <Button onClick={handleSendBulkMessage} disabled={isSending || !isConnected}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 ml-2" />
                إرسال
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendBulkMessagesDialog;