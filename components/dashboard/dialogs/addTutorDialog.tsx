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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createTutor } from "@/actions/tutor";
import { Plus } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { useTranslations } from "next-intl";

interface AddTutorDialogProps {
  specialities: { id: number; title: string }[];
  currencies: { id: number; name: string }[];
  academyId: number;
  children?: React.ReactNode;
}

export default function AddTutorDialog({
  specialities,
  currencies,
  academyId,
  children,
}: AddTutorDialogProps) {
  const t = useTranslations("AddTutorDialog");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [specialitiesSelected, setSpecilitiesSelected] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      formData.append("academyId", academyId.toString());
      formData.append("specialities", specialitiesSelected.join(","));
      await createTutor(formData);
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
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t("name")} *</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">{t("email")} *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="phone">{t("phone")} *</Label>
              <Input id="phone" name="phone" required />
              <span className="text-xs text-slate-600">{t("phoneHint")}</span>
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
              <Label htmlFor="pricePerHour">{t("pricePerHour")}</Label>
              <Input
                id="pricePerHour"
                name="pricePerHour"
                type="number"
                step="0.01"
                required
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="currencyId">{t("currency")}</Label>
              <Select name="currencyId">
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

            <div className="col-span-2">
              <Label htmlFor="specialities">{t("specialities")}</Label>
              <MultiSelect
                options={specialities.map((s) => ({
                  value: s.id.toString(),
                  label: s.title,
                }))}
                selected={specialitiesSelected}
                onChange={setSpecilitiesSelected}
                placeholder={t("specialitiesPlaceholder")}
                searchPlaceholder={t("searchSpecialities")}
              />
            </div>
            <div>
              <Label htmlFor="bio">{t("bio")}</Label>
              <Textarea id="bio" name="bio" />
            </div>
            <div>
              <Label htmlFor="qualifications">{t("qualifications")}</Label>
              <Textarea id="qualifications" name="qualifications" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="active" name="active" defaultChecked />
            <Label htmlFor="active">{t("active")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="zoom" name="zoomAuthenticated" />
            <Label htmlFor="zoom">{t("zoomEnabled")}</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zoomUrl">{t("zoomUrl")}</Label>
            <Input
              id="zoomUrl"
              name="zoomUrl"
              placeholder="https://zoom.us/j/..."
            />
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
