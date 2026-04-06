"use client";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardImage from "@/assets/dashboard-hero.png";
import Link from "next/link";

const HeroSection = () => {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden pt-10 md:pt-30 pb-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 end-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-10 relative z-10">
        {/* <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Users className="w-4 h-4" />
            {t("hero.trust")}
          </div>
        </motion.div> */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-tight">
            {t("hero.mainHeadline")}
          </h1>
          <p className="text-lg md:text-xl text-primary font-semibold mb-3">
            {t("hero.mainSubheadline")}
          </p>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {t("hero.mainDescription")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:items-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-primary w-full md:w-fit text-primary-foreground shadow-primary text-base px-8 py-6 hover:opacity-90 transition-opacity"
              >
                {t("hero.cta")}
                {isRTL ? (
                  <ArrowLeft className="ms-2 w-5 h-5" />
                ) : (
                  <ArrowLeft className="ms-2 w-5 h-5 rotate-180" />
                )}
              </Button>
            </Link>{" "}
            <Link target="_blank" href="https://wa.me/+201011214517">
              <Button
                size="lg"
                className="w-full md:w-fit"
                variant={"secondary"}
              >
                {t("hero.contact")}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Dashboard mockup image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="relative border-2 border-primary rounded-2xl overflow-hidden shadow-xl bg-card">
            <img
              src={dashboardImage.src}
              alt={t("hero.mainSubheadline")}
              className="w-full h-auto"
              loading="eager"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background/20 to-transparent pointer-events-none" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center mt-12"
        >
          <ArrowDown className="w-6 h-6 text-muted-foreground animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
