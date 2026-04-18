import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const SendBulkMessagesDialog: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  users: { phone: string }[];
}> = ({ open, users, setOpen }) => {
  const [bulkMessage, setBulkMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendBulkMessage = async () => {
    if (!bulkMessage.trim()) {
      toast({
        title: "الرجاء كتابة رسالة",
        variant: "destructive",
      });
      return;
    }

    // Build messages array for all filtered students
    const messages = users.map((student) => ({
      phoneNumber: student.phone,
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
          description: "ستصل الرسائل إلى الطلاب خلال لحظات",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إرسال رسالة جماعية</DialogTitle>
          <DialogDescription>
            سيتم إرسال هذه الرسالة إلى {users.length} طالب
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="اكتب رسالتك هنا..."
            value={bulkMessage}
            onChange={(e) => setBulkMessage(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            سيتم إرسال الرسالة عبر واتساب لكل طالب على حدة
          </p>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSending}
          >
            إلغاء
          </Button>
          <Button onClick={handleSendBulkMessage} disabled={isSending}>
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
