"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLocale, useMessages, useTranslations } from "next-intl";

export function SuccessScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const messages = useMessages();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const successSteps = messages.register.success.steps as string[];

  return (
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
  );
}
