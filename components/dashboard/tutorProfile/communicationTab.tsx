"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Mail, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TutorProfile } from "@/types/tutor";

interface CommunicationTabProps {
  tutor: TutorProfile;
  onAddNote: (content: string) => Promise<void>;
}

export default function CommunicationTab({
  tutor,
  onAddNote,
}: CommunicationTabProps) {
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await onAddNote(noteText);
    setNoteText("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">رسالة جماعية للطلاب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="اكتب رسالتك لجميع طلاب هذا المعلم..."
            className="min-h-25"
          />
          <div className="flex gap-2">
            <Button onClick={() => toast({ title: "تم الإرسال عبر واتساب" })}>
              <MessageSquare className="h-4 w-4" /> واتساب جماعي
            </Button>
            <Button
              variant="outline"
              onClick={() => toast({ title: "تم الإرسال عبر البريد" })}
            >
              <Mail className="h-4 w-4" /> بريد جماعي
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الملاحظات الداخلية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="أضف ملاحظة..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddNote}>
              <Plus className="h-4 w-4" /> إضافة
            </Button>
          </div>
          <div className="space-y-3">
            {tutor.notes.map((n) => (
              <div key={n.id} className="p-4 rounded-lg border bg-card">
                <p className="text-sm">{n.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {n.authorName} • {formatDate(n.createdAt)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toast({ title: "حذف" })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
