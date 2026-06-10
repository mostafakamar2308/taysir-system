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
import { Plus, User, CreditCard } from "lucide-react";
import { StudentStatus } from "@/types/student";
import { useTranslations } from "next-intl";

interface AddStudentDialogProps {
  tutors: { id: number; name: string | null }[];
  plans: { id: number; title: string }[];
  currencies: { id: number; name: string }[];
  academyId?: number;
  children?: React.ReactNode;
}

export default function AddStudentDialog({
  tutors,
  plans,
  currencies,
  academyId,
  children,
}: AddStudentDialogProps) {
  const t = useTranslations("AddStudentDialog");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(StudentStatus.lead.toString());
  const router = useRouter();
  const { toast } = useToast();

  const isLead = status === StudentStatus.lead.toString();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (!academyId) return;
      formData.append("academyId", academyId.toString());
      await createStudent(formData);
      toast({ title: t("toast.success") });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.log({ error });
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
          {/* Group 1: Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
              <User className="h-4 w-4" /> {t("personalInfo")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t("name")} *</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div>
                <Label htmlFor="age">{t("age")} *</Label>
                <Input id="age" name="age" type="number" required />
              </div>
              <div>
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input id="phone" name="phone" />
                <span className="text-xs text-slate-600">{t("phoneHint")}</span>
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
                <Label htmlFor="currentProgram">{t("currentProgram")}</Label>
                <Input id="currentProgram" name="currentProgram" />
              </div>
            </div>
          </div>

          {!isLead && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                <CreditCard className="h-4 w-4" /> {t("subscriptionInfo")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">{t("status-label")}</Label>
                  <Select
                    name="status"
                    value={status}
                    onValueChange={setStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("statusPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StudentStatus.trial.toString()}>
                        {t("status.trial")}
                      </SelectItem>
                      <SelectItem value={StudentStatus.subscribed.toString()}>
                        {t("status.subscribed")}
                      </SelectItem>
                      <SelectItem value={StudentStatus.lead.toString()}>
                        {t("status.lead")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="planId">{t("plan-label")}</Label>
                  <Select name="planId" defaultValue={String(plans[0]?.id)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("planPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("plan.none")}</SelectItem>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="none">{t("currency.none")}</SelectItem>
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
                  <Select name="tutorId" defaultValue={String(tutors[0]?.id)}>
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
              </div>
            </div>
          )}

          {/* If lead, still show status selector (in a minimal group) */}
          {isLead && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                <CreditCard className="h-4 w-4" /> {t("status-label")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">{t("status-label")}</Label>
                  <Select
                    name="status"
                    value={status}
                    onValueChange={setStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("statusPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StudentStatus.trial.toString()}>
                        {t("status.trial")}
                      </SelectItem>
                      <SelectItem value={StudentStatus.subscribed.toString()}>
                        {t("status.subscribed")}
                      </SelectItem>
                      <SelectItem value={StudentStatus.lead.toString()}>
                        {t("status.lead")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="none">{t("currency.none")}</SelectItem>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogTrigger asChild>
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
          </DialogTrigger>
        </form>
      </DialogContent>
    </Dialog>
  );
}
