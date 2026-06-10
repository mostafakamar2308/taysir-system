"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWhatsApp } from "@/lib/contexts/whatsapp";
import { useTranslations } from "next-intl";

interface SendBulkMessagesDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  users: { phone: string }[];
}

const SendBulkMessagesDialog: React.FC<SendBulkMessagesDialogProps> = ({
  open,
  users,
  setOpen,
}) => {
  const t = useTranslations("SendBulkMessagesDialog");
  const [bulkMessage, setBulkMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { status } = useWhatsApp();
  const router = useRouter();

  const isConnected = status === "connected";

  const handleSendBulkMessage = async () => {
    if (!isConnected) {
      toast({
        title: t("toast.notConnected"),
        description: t("toast.connectFirst"),
        variant: "destructive",
      });
      return;
    }

    if (!bulkMessage.trim()) {
      toast({
        title: t("toast.emptyMessage"),
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
          title: t("toast.sentSuccess", { count: data.jobs.length }),
          description: t("toast.sentDescription"),
        });
        setOpen(false);
        setBulkMessage("");
      } else {
        toast({
          title: t("toast.failed"),
          description: data.error || t("toast.defaultError"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t("toast.networkError"),
        description: t("toast.networkDescription"),
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
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { count: users.length })}
          </DialogDescription>
        </DialogHeader>

        {!isConnected && (
          <Alert
            variant="destructive"
            className="border-amber-500 bg-amber-50 text-amber-800"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span>{t("notConnectedAlert")}</span>
              <Button
                variant="link"
                className="h-auto p-0 text-amber-900 underline justify-start"
                onClick={() => {
                  setOpen(false);
                  router.push("/ar/dashboard/settings/whatsapp");
                }}
              >
                <ExternalLink className="ml-1 h-3 w-3" />
                {t("goToWhatsappSettings")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <Textarea
            placeholder={t("messagePlaceholder")}
            value={bulkMessage}
            onChange={(e) => setBulkMessage(e.target.value)}
            rows={5}
            className="resize-none"
            disabled={!isConnected}
          />
          <p className="text-xs text-muted-foreground">{t("messageHint")}</p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSending}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSendBulkMessage}
            disabled={isSending || !isConnected}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                {t("sending")}
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 ml-2" />
                {t("send")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendBulkMessagesDialog;
