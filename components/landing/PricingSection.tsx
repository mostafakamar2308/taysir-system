"use client";
import { useState } from "react";
import { useMessages, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Gift, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PricingSection = () => {
  const t = useTranslations();
  const [isYearly, setIsYearly] = useState(false);
  const messages = useMessages();
  const rawFree = messages.pricing.free.features;
  const rawPro = messages.pricing.pro.features;
  const freeFeatures = Array.isArray(rawFree) ? (rawFree as string[]) : [];
  const proFeatures = Array.isArray(rawPro) ? (rawPro as string[]) : [];

  const monthlyPrice = 59;
  const yearlyPrice = Math.round(monthlyPrice * 10); // 2 months free
  const originalMonthly = 99;
  const originalYearly = Math.round(originalMonthly * 12);

  const displayPrice = isYearly ? `$${yearlyPrice}` : `$${monthlyPrice}`;
  const displayOriginal = isYearly
    ? `$${originalYearly}`
    : `$${originalMonthly}`;
  const displayPeriod = t(
    isYearly ? "pricing.pro.yearlyPeriod" : "pricing.pro.period",
  );

  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-muted/30 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("pricing.title")}
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mb-8" />

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}
            >
              {t("pricing.monthly")}
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span
              className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}
            >
              {t("pricing.yearly")}
            </span>

            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                isYearly
                  ? "bg-primary/10 text-primary"
                  : "bg-transparent text-transparent",
              )}
            >
              {t("pricing.yearlySave")}
            </Badge>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow"
          >
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 me-1" />
              {t("pricing.free.badge")}
            </Badge>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {t("pricing.free.name")}
            </h3>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-foreground">
                {t("pricing.free.price")}
              </span>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/register" className="mb-auto block">
              <Button variant="outline" className="w-full py-5 text-base">
                {t("pricing.free.cta")}
              </Button>
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl p-8 border-2 border-primary relative hover:shadow-xl shadow-primary transition-shadow"
          >
            <div className="absolute -top-3 inset-x-0 flex justify-center">
              <Badge className="bg-gold text-gold-foreground px-4 py-1 shadow-gold">
                <Zap className="w-3 h-3 me-1" />
                {t("pricing.pro.badge")}
              </Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {t("pricing.pro.name")}
              </h3>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground line-through">
                  {displayOriginal}
                </span>
                <span className="text-4xl font-extrabold text-primary">
                  {displayPrice}
                </span>
                <span className="text-muted-foreground text-sm">
                  {displayPeriod}
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {proFeatures.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full py-5 text-base bg-primary text-primary-foreground shadow-primary hover:opacity-90">
                  {t("pricing.pro.cta")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Early Bird Incentives */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-2xl mx-auto space-y-4"
        >
          {/* First 10 */}
          <div className="flex items-start gap-4 bg-card border-2 border-gold/30 rounded-xl p-5">
            <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">
                {t("pricing.earlyBird.first10.title")}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("pricing.earlyBird.first10.description")}
              </p>
            </div>
          </div>

          {/* After first 10 */}
          <div className="flex items-start gap-4 bg-card border border-primary/20 rounded-xl p-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">
                {t("pricing.earlyBird.others.title")}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("pricing.earlyBird.others.description")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Limited Offer Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 text-gold border border-gold/20 px-6 py-3 rounded-full text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            {t("pricing.limitedOffer")}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
