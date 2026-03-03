"use client";
import { useState } from "react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Gift,
  Star,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";

const Register = () => {
  const t = useTranslations();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const locale = useLocale();
  const messages = useMessages();
  const isRTL = locale === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const schema = z.object({
    fullName: z
      .string()
      .trim()
      .min(1, t("register.validation.nameRequired"))
      .max(100, t("register.validation.nameMax")),
    email: z
      .string()
      .trim()
      .min(1, t("register.validation.emailRequired"))
      .email(t("register.validation.emailInvalid")),
    phone: z
      .string()
      .trim()
      .min(1, t("register.validation.phoneRequired"))
      .regex(/^[\d\s\+\-\(\)]+$/, t("register.validation.phoneInvalid")),
    academyName: z
      .string()
      .trim()
      .min(1, t("register.validation.academyRequired")),
    academySize: z.string().optional(),
    currentMethod: z.string().optional(),
    reviewBonus: z.boolean().optional(),
    videoBonus: z.boolean().optional(),
    terms: z.boolean({
      error: t("register.validation.termsRequired"),
    }),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      reviewBonus: false,
      videoBonus: false,
      terms: undefined,
    },
  });

  const onSubmit = async (_data: FormData) => {
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitted(true);
  };

  const offerItemsRaw = messages.register.offers.items;
  const offerItems = Array.isArray(offerItemsRaw)
    ? (offerItemsRaw as string[])
    : [];

  const offerIcons = [Gift, Star, Shield];

  if (isSubmitted) {
    const successSteps = messages.register.success.steps as string[];
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              {t("register.success.title")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("register.success.subtitle")}
            </p>
            <div className="bg-card rounded-xl p-6 border border-border mb-8 text-start">
              <ul className="space-y-4">
                {successSteps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <BackArrow className="w-4 h-4" />
                {t("register.success.backHome")}
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
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

              {/* Offer Highlights */}
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {offerItems.map((item, i) => {
                  const Icon = offerIcons[i] || Gift;
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
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-sm max-w-2xl mx-auto"
              >
                {/* Personal Info */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-foreground mb-5 pb-2 border-b border-border">
                    {t("register.form.personalInfo")}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        {t("register.form.fullName")} *
                      </Label>
                      <Input
                        id="fullName"
                        {...register("fullName")}
                        className="py-5"
                      />
                      {errors.fullName && (
                        <p className="text-destructive text-xs">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {t("register.form.email")} *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        className="py-5"
                      />
                      {errors.email && (
                        <p className="text-destructive text-xs">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="phone">
                        {t("register.form.phone")} *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        dir="ltr"
                        {...register("phone")}
                        className="py-5"
                      />
                      {errors.phone && (
                        <p className="text-destructive text-xs">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Academy Info */}
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
                      <Select
                        onValueChange={(val) => setValue("academySize", val)}
                      >
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
                        className="flex flex-wrap gap-4 mt-1"
                      >
                        {(["excel", "paper", "software"] as const).map(
                          (method) => (
                            <div
                              key={method}
                              className="flex items-center gap-2"
                            >
                              <RadioGroupItem
                                value={method}
                                id={`method-${method}`}
                              />
                              <Label
                                htmlFor={`method-${method}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {t(`register.form.methodOptions.${method}`)}
                              </Label>
                            </div>
                          ),
                        )}
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                {/* Incentives */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-foreground mb-5 pb-2 border-b border-border">
                    {t("register.form.incentives")}
                  </h3>
                  <div className="space-y-4">
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

                <div className="mb-8">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={watch("terms") || false}
                      onCheckedChange={(checked) =>
                        setValue("terms", checked === true ? true : false)
                      }
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm font-normal leading-relaxed cursor-pointer"
                    >
                      {t("register.form.termsAccept")} *
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.terms.message}
                    </p>
                  )}
                </div>

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
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
