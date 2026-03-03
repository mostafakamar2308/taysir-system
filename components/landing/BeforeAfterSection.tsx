"use client";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Bell, BellOff } from "lucide-react";

const BeforeAfterSection = () => {
  const t = useTranslations();
  const locale = useLocale();
  const messages = useMessages();
  const isRTL = locale === "ar";
  const beforeRaw = messages.hero.before.items;
  const afterRaw = messages.hero.after.items;
  const beforeItems = Array.isArray(beforeRaw) ? (beforeRaw as string[]) : [];
  const afterItems = Array.isArray(afterRaw) ? (afterRaw as string[]) : [];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t("hero.headline")}
          </h2>
          <p className="text-lg text-primary font-semibold">
            {t("hero.subheadline")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl p-8 bg-muted border border-border overflow-hidden"
          >
            <div className="top-4 end-4 relative inline-flex">
              <Bell className="w-8 h-8 text-destructive" />
              <span className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                22
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-5 mt-2">
              {t("hero.before.label")}
            </h3>
            <ul className="space-y-3">
              {beforeItems.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl p-8 bg-accent border-2 border-primary/30 overflow-hidden"
          >
            <div className="top-4 end-4 relative inline-flex">
              <BellOff className="w-8 h-8 text-primary" />
              <span className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                1
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-5 mt-2">
              {t("hero.after.label")}
            </h3>
            <ul className="space-y-3">
              {afterItems.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 text-foreground"
                >
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
