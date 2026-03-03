"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  BookOpen,
  Gift,
  Star,
  Shield,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormWatch } from "react-hook-form";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { WaitlistData, waitlistSchema } from "@/lib/schemas/waitlist";

interface RegisterFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  serverError: string | null;
}

export function RegisterForm({ onSubmit, serverError }: RegisterFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const messages = useMessages();
  const isRTL = locale === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  type FormData = z.infer<typeof waitlistSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      reviewBonus: false,
      videoBonus: false,
      terms: true,
    },
  });

  const onFormSubmit = async (data: FormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    await onSubmit(formData);
  };

  const offerItemsRaw = messages.register.offers.items;
  const offerItems = Array.isArray(offerItemsRaw)
    ? (offerItemsRaw as string[])
    : [];
  const offerIcons = [Gift, Star, Shield];

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <BackArrow className="w-4 h-4" />
          {t("register.backHome")}
        </Link>
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {t("register.title")}
        </h1>

        <OfferHighlights items={offerItems} icons={offerIcons} />
      </motion.div>

      {/* Form */}
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

          <PersonalInfoFields register={register} errors={errors} />
          <AcademyInfoFields
            register={register}
            setValue={setValue}
            errors={errors}
          />
          <h3 className="text-lg font-bold text-foreground mb-5 pb-2 border-b border-border">
            {t("register.form.incentives")}
          </h3>
          <TermsField setValue={setValue} watch={watch} errors={errors} />
          <IncentivesFields setValue={setValue} watch={watch} />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-base bg-primary text-primary-foreground shadow-primary hover:opacity-90"
          >
            {isSubmitting
              ? t("register.form.submitting")
              : t("register.form.submit")}
          </Button>
        </form>
      </motion.div>
    </>
  );
}

interface PersonalInfoFieldsProps {
  register: UseFormRegister<WaitlistData>;
  errors: FieldErrors<WaitlistData>;
}

export function PersonalInfoFields({
  register,
  errors,
}: PersonalInfoFieldsProps) {
  const t = useTranslations();

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-foreground mb-5 pb-2 border-b border-border">
        {t("register.form.personalInfo")}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("register.form.fullName")} *</Label>
          <Input id="fullName" {...register("fullName")} className="py-5" />
          {errors.fullName && (
            <p className="text-destructive text-xs">
              {errors.fullName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("register.form.email")} *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="py-5"
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phone">{t("register.form.phone")} *</Label>
          <Input
            id="phone"
            type="tel"
            dir="ltr"
            {...register("phone")}
            className="py-5"
          />
          {errors.phone && (
            <p className="text-destructive text-xs">{errors.phone.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface AcademyInfoFieldsProps {
  register: UseFormRegister<WaitlistData>;
  setValue: UseFormSetValue<WaitlistData>;
  errors: FieldErrors<WaitlistData>;
}

export function AcademyInfoFields({
  register,
  setValue,
  errors,
}: AcademyInfoFieldsProps) {
  const t = useTranslations();

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-foreground mb-5 pb-2 border-b border-border">
        {t("register.form.academyInfo")}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="academyName">
            {t("register.form.academyName")} *
          </Label>
          <Input
            id="academyName"
            {...register("academyName")}
            className="py-5"
          />
          {errors.academyName && (
            <p className="text-destructive text-xs">
              {errors.academyName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("register.form.academySize")}</Label>
          <Select onValueChange={(val) => setValue("academySize", val)}>
            <SelectTrigger className="py-5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">
                {t("register.form.academySizeOptions.small")}
              </SelectItem>
              <SelectItem value="medium">
                {t("register.form.academySizeOptions.medium")}
              </SelectItem>
              <SelectItem value="large">
                {t("register.form.academySizeOptions.large")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("register.form.currentMethod")}</Label>
          <RadioGroup
            onValueChange={(val) => setValue("currentMethod", val)}
            className="flex flex-wrap justify-end gap-4 mt-1"
          >
            {(["excel", "paper", "software"] as const).map((method) => (
              <div key={method} className="flex items-center gap-2">
                <Label
                  htmlFor={`method-${method}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {t(`register.form.methodOptions.${method}`)}
                </Label>
                <RadioGroupItem value={method} id={`method-${method}`} />
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}

interface IncentivesFieldsProps {
  setValue: UseFormSetValue<WaitlistData>;
  watch: UseFormWatch<WaitlistData>;
}

export function IncentivesFields({ setValue, watch }: IncentivesFieldsProps) {
  const t = useTranslations();

  return (
    <div className="mb-8">
      <div className="mt-2 space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="reviewBonus"
            checked={watch("reviewBonus")}
            onCheckedChange={(checked) =>
              setValue("reviewBonus", checked === true)
            }
          />
          <Label
            htmlFor="reviewBonus"
            className="text-sm font-normal leading-relaxed cursor-pointer"
          >
            {t("register.form.reviewBonus")}
          </Label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="videoBonus"
            checked={watch("videoBonus")}
            onCheckedChange={(checked) =>
              setValue("videoBonus", checked === true)
            }
          />
          <Label
            htmlFor="videoBonus"
            className="text-sm font-normal leading-relaxed cursor-pointer"
          >
            {t("register.form.videoBonus")}
          </Label>
        </div>
      </div>
    </div>
  );
}

interface TermsFieldProps {
  setValue: UseFormSetValue<WaitlistData>;
  watch: UseFormWatch<WaitlistData>;
  errors: FieldErrors<WaitlistData>;
}

export function TermsField({ setValue, watch, errors }: TermsFieldProps) {
  const t = useTranslations();

  return (
    <div className="">
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={watch("terms") || false}
          onCheckedChange={(checked) => setValue("terms", checked === true)}
        />
        <Label
          htmlFor="terms"
          className="text-sm font-normal leading-relaxed cursor-pointer"
        >
          {t("register.form.termsAccept")} *
        </Label>
      </div>
      {errors.terms && (
        <p className="text-destructive text-xs mt-1">{errors.terms.message}</p>
      )}
    </div>
  );
}

interface OfferHighlightsProps {
  items: string[];
  icons: React.ElementType[];
}

export function OfferHighlights({ items, icons }: OfferHighlightsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {items.map((item, i) => {
        const Icon = icons[i] || Gift;
        return (
          <div
            key={i}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium"
          >
            <Icon className="w-4 h-4 text-primary" />
            {item}
          </div>
        );
      })}
    </div>
  );
}
