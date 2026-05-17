"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Gift, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Plan = {
  id: number;
  name: string;
  dollarPrice: number;
  egyptianPrice: number;
  maxStudents: number | null;
  maxTutors: number | null;
  billingPeriod: number;
  features: string[];
};

interface PricingSectionProps {
  plans: Plan[];
  exchangeRate: number;
}

const PricingSection = ({ plans }: PricingSectionProps) => {
  const t = useTranslations();
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "EGP">("EGP");

  const first20Remaining = 20;
  const isFirst20 = true;

  const getBaseMonthlyPrice = (plan: Plan): number => {
    if (currency === "USD") return plan.dollarPrice;
    return plan.egyptianPrice;
  };

  // Compute discounted price based on launch offer
  const getDiscountedPrice = (
    plan: Plan,
    baseMonthly: number,
  ): { original: number; final: number; hasDiscount: boolean } => {
    if (plan.name === "الباقة المجانية")
      return { original: 0, final: 0, hasDiscount: false };

    if (isYearly) {
      const yearlyOriginal = baseMonthly * 12;
      // 40% discount for everyone on yearly plans
      const yearlyFinal = yearlyOriginal * 0.6;
      return {
        original: yearlyOriginal,
        final: yearlyFinal,
        hasDiscount: true,
      };
    } else {
      return { original: baseMonthly, final: baseMonthly, hasDiscount: false };
    }
  };

  // Format price for display (adds currency symbol)
  const formatPrice = (price: number) => {
    if (currency === "USD") return `$${price.toFixed(0)}`;
    return `${price.toFixed(0)} EGP`;
  };

  // Get period text
  const periodText = () => {
    if (isYearly) return t("pricing.pro.yearlyPeriod");
    return t("pricing.pro.period");
  };

  // Special handling for Basic plan: show per tutor
  const isBasic = (plan: Plan) => plan.name === "الباقة الأساسية";

  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-muted/30 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
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

          {/* Toggles: Monthly/Yearly + Currency */}
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            {/* Period toggle */}
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className={cn(
                  "bg-primary/10 text-primary",
                  isYearly ? "opacity-100" : "opacity-0",
                )}
              >
                {t("pricing.yearlySave")}
              </Badge>
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
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards - 3 columns */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => {
            const baseMonthly = getBaseMonthlyPrice(plan);
            const { original, final, hasDiscount } = getDiscountedPrice(
              plan,
              baseMonthly,
            );
            const isPopular = isBasic(plan);
            const perTutorMode = isBasic(plan);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "bg-card flex flex-col rounded-2xl p-8 border relative transition-all hover:shadow-xl",
                  isPopular ? "border-primary shadow-md" : "border-border",
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Zap className="w-3 h-3 me-1" />
                      الأكثر طلباً
                    </Badge>
                  </div>
                )}

                {/* Plan badge */}
                <div className="flex gap-2 items-center mb-2">
                  <Badge variant="secondary" className="w-fit">
                    {plan.name === "الباقة المجانية" && (
                      <Sparkles className="w-3 h-3 me-1" />
                    )}
                    {plan.name === "الباقة الأساسية" && (
                      <Gift className="w-3 h-3 me-1" />
                    )}
                    {plan.name === "الباقة الاحترافية" && (
                      <Crown className="w-3 h-3 me-1" />
                    )}
                    {plan.name === "الباقة المجانية" && "مجاني للأبد"}
                    {plan.name === "الباقة الأساسية" && "الدفع لكل معلم"}
                    {plan.name === "الباقة الاحترافية" && "غير محدود"}
                  </Badge>

                  {hasDiscount && plan.name !== "الباقة الأساسية" && (
                    <Badge
                      variant="outline"
                      className="bg-gold/10 text-gold border-gold/30 w-fit"
                    >
                      {isFirst20 && !isYearly
                        ? "الشهر الأول مجاني"
                        : "خصم 40% على الاشتراك السنوي"}
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                {/* Price display */}
                <div className="mb-6">
                  {perTutorMode ? (
                    <>
                      <span className="text-4xl font-extrabold text-foreground">
                        {formatPrice(final)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {" "}
                        / معلم / {!isYearly ? "شهر" : "سنة"}
                      </span>
                      {hasDiscount && original > 0 && (
                        <div className="text-sm text-muted-foreground line-through mt-1">
                          كان {formatPrice(original)} / معلم /{" "}
                          {!isYearly ? "شهر" : "سنة"}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-primary">
                          {formatPrice(final)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {periodText()}
                        </span>
                      </div>
                      {hasDiscount && original > 0 && (
                        <div className="text-lg text-muted-foreground line-through">
                          {formatPrice(original)}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Launch offer note on card */}

                {/* Features list */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className=" flex flex-col gap-2">
                  <Link target="_blank" href="https://wa.me/201011214517">
                    <Button variant="outline" className="w-full py-4 text-base">
                      {t("pricing.contact-us")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full py-4 text-base bg-primary text-primary-foreground">
                      {t("pricing.pro.cta")}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Launch Offer Banners */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 max-w-3xl mx-auto space-y-4"
        >
          {/* First 20 offer */}
          <div className="flex items-start gap-4 bg-card border-2 border-gold/30 rounded-xl p-5">
            <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">
                🏆 عرض الـ {first20Remaining} الأولى – فقط {first20Remaining}{" "}
                مكان متبقي!
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                اشترك الآن واحصل على: شهر مجاني عند التسجيل + شهر إضافي مجاني
                عند ترك تقييم + خصم 40% على السنة الأولى.
              </p>
            </div>
          </div>

          {/* Offer for all others */}
          <div className="flex items-start gap-4 bg-card border border-primary/20 rounded-xl p-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">
                🎁 عرض الإطلاق للجميع
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                احصل على خصم 40% على الاشتراك السنوي لأي باقة (باستثناء
                المجانية). عرض لفترة محدودة.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Limited Time Banner */}
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
