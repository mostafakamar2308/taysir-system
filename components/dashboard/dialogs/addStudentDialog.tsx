"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createStudent } from "@/actions/student";
import { Plus, User } from "lucide-react";
import { StudentStatus } from "@/types/student";
import { useTranslations } from "next-intl";

interface AddStudentDialogProps {
  tutors: { id: number; name: string | null }[];
  currencies: { id: number; name: string }[];
  academyId?: number;
  children?: React.ReactNode;
}

export default function AddStudentDialog({
  tutors,
  currencies,
  academyId,
  children,
}: AddStudentDialogProps) {
  const t = useTranslations("AddStudentDialog");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (!academyId) return;
      formData.append("academyId", academyId.toString());
      await createStudent(formData);
      toast({ title: t("toast.success") });
      setOpen(false);
      router.refresh();
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> {t("triggerLabel")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
              <User className="h-4 w-4" /> {t("personalInfo")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>
              <div>
                <Label htmlFor="email">{t("email")} *</Label>
                <Input
                  id="email"
                  name="email"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>
              <div>
                <Label htmlFor="age">{t("age")} *</Label>
                <Input id="age" name="age" type="number" required />
              </div>
              <div>
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  name="phone"
                  autoComplete="off"
                  autoCorrect="off"
                />
                <span className="text-xs text-slate-600">{t("phoneHint")}</span>
              </div>
              <div>
                <Label htmlFor="password">{t("password")} *</Label>
                <Input
                  id="password"
                  name="password"
                  minLength={6}
                  placeholder={t("passwordPlaceholder")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">{t("country")}</Label>
                <Input id="country" name="country" />
              </div>
              <div>
                <Label htmlFor="timezone">{t("timezone-label")} *</Label>
                <Select name="timezone" defaultValue="Africa/Cairo">
                  <SelectTrigger>
                    <SelectValue placeholder={t("timezonePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Cairo">
                      {t("timezone.cairo")}
                    </SelectItem>
                    <SelectItem value="Asia/Riyadh">
                      {t("timezone.riyadh")}
                    </SelectItem>
                    <SelectItem value="Asia/Dubai">
                      {t("timezone.dubai")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="preferredLanguage">
                  {t("preferredLanguage")}
                </Label>
                <Input id="preferredLanguage" name="preferredLanguage" />
              </div>
              <div>
                <Label htmlFor="source">{t("source")}</Label>
                <Input id="source" name="source" />
              </div>
              <div>
                <Label htmlFor="currencyId">{t("currency-label")}</Label>
                <Select
                  name="currencyId"
                  defaultValue={currencies[0]?.id.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("currencyPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tutorId">{t("tutor-label")}</Label>
                <Select name="tutorId" defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder={t("tutorPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("tutor.none")}</SelectItem>
                    {tutors.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">{t("status-label")}</Label>
                <Select
                  name="status"
                  defaultValue={StudentStatus.lead.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StudentStatus.lead.toString()}>
                      {t("status.lead")}
                    </SelectItem>
                    <SelectItem value={StudentStatus.trial.toString()}>
                      {t("status.trial")}
                    </SelectItem>
                    <SelectItem value={StudentStatus.subscribed.toString()}>
                      {t("status.subscribed")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("saving") : t("add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
