import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";

export default function UploadAssignmentForm({
  onSubmit,
  loading,
}: {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
}) {
  const t = useTranslations("SessionDetail");

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("homework.title")}</Label>
        <Input name="title" placeholder="عنوان الواجب" />
      </div>
      <div className="space-y-2">
        <Label>{t("homework.description")}</Label>
        <Textarea name="description" placeholder="وصف الواجب" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("homework.maxScore")}</Label>
          <Input
            name="maxScore"
            type="number"
            defaultValue={10}
            min={1}
            max={100}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("homework.deadline")}</Label>
          <Input name="deadline" type="datetime-local" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("homework.file")}</Label>
        <Input name="file" type="file" accept=".pdf,.doc,.docx" required />
        <p className="text-xs text-muted-foreground">
          PDF أو Word (حد أقصى 5 ميجابايت)
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "جاري الرفع..." : "رفع الواجب"}
      </Button>
    </form>
  );
}
