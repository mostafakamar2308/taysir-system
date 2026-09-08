"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateSessionRecordingLink } from "@/actions/tutor/session";
import { Loader2, Video } from "lucide-react";

interface RecordingLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sessionId: number;
  initialLink?: string | null;
}

export default function RecordingLinkDialog({
  open,
  onOpenChange,
  title,
  sessionId,
  initialLink,
}: RecordingLinkDialogProps) {
  const t = useTranslations("SessionDetail");
  const router = useRouter();
  const { toast } = useToast();
  const [link, setLink] = useState(initialLink ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = link.trim();
    if (value && !value.startsWith("https://")) {
      toast({ title: t("recording.invalidUrl"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await updateSessionRecordingLink(sessionId, {
        recordingLink: value || null,
      });
      if (!res.ok) throw new Error(res.error);
      toast({ title: t("toast.recordingSaved") });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      if (error instanceof Error)
        toast({
          title: t("toast.error"),
          description: error.message,
          variant: "destructive",
        });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setLink(initialLink ?? "");
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Video className="h-5 w-5" />
            <span className="font-semibold">{t("recording.title")}</span>
          </div>
          <div className="space-y-2">
            <Label>{t("recording.urlLabel")}</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("recording.helpText")}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
            {t("recording.saveButton")}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">{t("closeButton")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}