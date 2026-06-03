"use client";

import { useState } from "react";
import { useTranslations, useMessages } from "next-intl";
import { motion } from "framer-motion";
import { Check, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

const PricingSection = () => {
  const t = useTranslations();
  const messages = useMessages();

  const [isYearly, setIsYearly] = useState(false);

  const MANAGEMENT_BASE_PRICE = 150; // EGP per active tutor / month
  const FULL_SUITE_BASE_PRICE = 300; // EGP per active tutor / month

  const getPrice = (base: number) => {
    if (isYearly) return base * 12 * 0.8; // 20% off yearly
    return base;
  };

  const formatPrice = (price: number) =>
    `${Math.round(price).toLocaleString("ar-EG")} ج.م`;

  // Retrieve features as raw arrays from the messages object
  const managementFeatures = messages.pricing.management.features as string[];

  const fullSuiteFeatures = messages.pricing.fullSuite.features as string[];

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

          <div className="flex items-center justify-center gap-4">
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
              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            >
              {t("pricing.yearlySave")}
            </Badge>
          </div>
        </motion.div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Management Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-8 border border-border flex flex-col"
          >
            <div className="mb-4">
              <Badge variant="secondary">{t("pricing.management.badge")}</Badge>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {t("pricing.management.name")}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t("pricing.management.description")}
            </p>

            <div className="mb-6">
              <span className="text-4xl font-extrabold text-foreground">
                {formatPrice(getPrice(MANAGEMENT_BASE_PRICE))}
              </span>
              <span className="text-muted-foreground text-sm">
                {isYearly
                  ? t("pricing.management.yearlyUnit")
                  : t("pricing.management.priceUnit")}
              </span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {managementFeatures.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link href="https://wa.me/201011214517" target="_blank">
              <Button variant="outline" className="w-full py-4 text-base">
                {t("pricing.contactUs")}
              </Button>
            </Link>
          </motion.div>

          {/* Full Suite Plan (featured) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-primary text-primary-foreground rounded-2xl p-8 border border-primary flex flex-col relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-yellow-300 hover:bg-yellow-500 text-yellow-950 px-4 py-1 font-bold">
                {t("pricing.fullSuite.badge")}
              </Badge>
            </div>
            <div className="mb-4 mt-2">
              <Badge
                variant="secondary"
                className="bg-primary-foreground/20 text-primary-foreground border-0"
              >
                {t("pricing.fullSuite.badge")}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {t("pricing.fullSuite.name")}
            </h3>
            <p className="text-primary-foreground/80 text-sm mb-6">
              {t("pricing.fullSuite.description")}
            </p>

            <div className="mb-6">
              <span className="text-4xl font-extrabold">
                {formatPrice(getPrice(FULL_SUITE_BASE_PRICE))}
              </span>
              <span className="text-primary-foreground/80 text-sm">
                {isYearly
                  ? t("pricing.fullSuite.yearlyUnit")
                  : t("pricing.fullSuite.priceUnit")}
              </span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {fullSuiteFeatures.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-primary-foreground/90"
                >
                  <Check className="w-4 h-4 text-yellow-300 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link href="https://wa.me/201011214517" target="_blank">
              <Button
                variant="secondary"
                className="w-full py-4 text-base bg-white text-primary hover:bg-gray-100"
              >
                {t("pricing.contactUs")}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Launch Offer Banners */}
        <div className="mt-12 max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-start gap-4 bg-card border-2 border-gold/30 rounded-xl p-5">
              <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">
                  {t("pricing.first20offer.title")}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("pricing.first20offer.description")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

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
