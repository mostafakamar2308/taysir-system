"use client";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, Feather } from "lucide-react";
import Link from "next/link";

const FinalCTASection = () => {
  const t = useTranslations();

  const locale = useLocale();
  const isRTL = locale === "ar";

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary opacity-95" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 start-10 w-72 h-72 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 end-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <Feather className="w-10 h-10 text-primary-foreground/80 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            {t("finalCta.title")}
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-4 leading-relaxed italic">
            {t("finalCta.story")}
          </p>
          <p className="text-base text-primary-foreground/80 mb-4 font-semibold">
            {t("finalCta.subtitle")}
          </p>

          {/* Waitlist counter */}
          {/* <div className="inline-flex items-center gap-2 bg-primary-foreground/10 text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium mb-8">
            <Users className="w-4 h-4" />
            {t("finalCta.waitlistCount")}
          </div> */}

          <Link
            href={"/register"}
            type="submit"
            className="bg-gold flex items-center justify-center w-fit mx-auto rounded-xl text-gold-foreground hover:bg-gold/90 shadow-gold py-4 px-6"
          >
            {t("finalCta.cta")}
            {isRTL && <ArrowLeft className="ms-2 w-4 h-4" />}
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTASection;
