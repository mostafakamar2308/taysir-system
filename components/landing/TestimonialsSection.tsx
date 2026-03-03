"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";

const TestimonialsSection = () => {
  const t = useTranslations();

  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-muted/30 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("testimonials.title")}
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mb-10" />

          <div className="max-w-2xl mx-auto bg-card rounded-2xl p-10 border border-border shadow-sm">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-gold fill-gold" />
              ))}
            </div>
            <p className="text-lg text-muted-foreground mb-6 italic">
              {t("testimonials.comingSoon")}
            </p>
            <div className="flex items-center justify-center gap-2 text-primary font-semibold">
              <Users className="w-5 h-5" />
              {t("testimonials.subtitle")}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
