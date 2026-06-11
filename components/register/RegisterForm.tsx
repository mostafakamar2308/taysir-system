"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslations } from "next-intl";
import { leadSchema, LeadData } from "@/lib/schemas/lead";

const COUNTRY_CODES = [
  { code: "2", name: "مصر (+2)" },
  { code: "966", name: "السعودية (+966)" },
  { code: "971", name: "الإمارات (+971)" },
  { code: "965", name: "الكويت (+965)" },
  { code: "974", name: "قطر (+974)" },
  { code: "973", name: "البحرين (+973)" },
  { code: "968", name: "عُمان (+968)" },
  { code: "962", name: "الأردن (+962)" },
  { code: "964", name: "العراق (+964)" },
  { code: "961", name: "لبنان (+961)" },
  { code: "970", name: "فلسطين (+970)" },
  { code: "963", name: "سوريا (+963)" },
  { code: "967", name: "اليمن (+967)" },
  { code: "212", name: "المغرب (+212)" },
  { code: "213", name: "الجزائر (+213)" },
  { code: "216", name: "تونس (+216)" },
  { code: "218", name: "ليبيا (+218)" },
  { code: "249", name: "السودان (+249)" },
  { code: "222", name: "موريتانيا (+222)" },
  { code: "252", name: "الصومال (+252)" },
];

interface RegisterFormProps {
  onSubmit: (data: LeadData) => Promise<void>;
  serverError: string | null;
}

export function RegisterForm({ onSubmit, serverError }: RegisterFormProps) {
  const t = useTranslations("register");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      countryCode: "20",
    },
  });

  const onFormSubmit = async (data: LeadData) => {
    const fullPhone = `+${data.countryCode}${data.phoneNumber}`;
    await onSubmit({ ...data, phoneNumber: fullPhone });
  };

  const renderRadioGroup = (
    name: keyof LeadData,
    options: Record<string, string>,
    label: string,
  ) => (
    <div className="space-y-2">
      <Label className="text-base font-semibold">{label}</Label>
      <RadioGroup
        onValueChange={(val) => setValue(name, val)}
        className="space-y-2"
      >
        {Object.entries(options).map(([value, optionLabel]) => (
          <div key={value} className="flex items-center gap-2">
            <RadioGroupItem value={value} id={`${name}-${value}`} />
            <Label
              htmlFor={`${name}-${value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {optionLabel}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {errors[name] && (
        <p className="text-destructive text-xs">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-sm max-w-2xl mx-auto"
      >
        {serverError && (
          <div className="mb-6 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {serverError}
          </div>
        )}

        {/* Section 1: Basic Info */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-foreground mb-5 pb-2 border-b border-border">
            {t("form.personalInfo")}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("form.fullName")} *</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && (
                <p className="text-destructive text-xs">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="academyName">{t("form.academyName")} *</Label>
              <Input id="academyName" {...register("academyName")} />
              {errors.academyName && (
                <p className="text-destructive text-xs">
                  {errors.academyName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("form.country")} *</Label>
              <Select
                defaultValue="20"
                onValueChange={(val) => setValue("countryCode", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t("form.phone")} *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                dir="ltr"
                {...register("phoneNumber")}
                placeholder="رقم الهاتف بدون مفتاح الدولة"
              />
              {errors.phoneNumber && (
                <p className="text-destructive text-xs">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Qualification */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-foreground mb-5 pb-2 border-b border-border">
            {t("form.qualification")}
          </h3>
          <div className="space-y-6">
            {renderRadioGroup(
              "studentCategory",
              t.raw("form.studentCategoryOptions"),
              t("form.studentCategory"),
            )}
            {renderRadioGroup(
              "teacherCount",
              t.raw("form.teacherCountOptions"),
              t("form.teacherCount"),
            )}
            {renderRadioGroup(
              "currentMethod",
              t.raw("form.currentMethodOptions"),
              t("form.currentMethod"),
            )}
          </div>
        </div>

        {/* Section 3: Biggest Challenge & Urgency */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-foreground mb-5 pb-2 border-b border-border">
            التحدي الأكبر والاستعجال
          </h3>
          <div className="space-y-6">
            {renderRadioGroup(
              "biggestChallenge",
              t.raw("form.biggestChallengeOptions"),
              t("form.biggestChallenge"),
            )}
            {renderRadioGroup(
              "urgency",
              t.raw("form.urgencyOptions"),
              t("form.urgency"),
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-6 text-base bg-primary text-primary-foreground shadow-primary hover:opacity-90"
        >
          {isSubmitting ? t("form.submitting") : t("form.submit")}
        </Button>
      </form>
    </motion.div>
  );
}
