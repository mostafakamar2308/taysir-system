"use client";
import { useMessages, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  CalendarX,
  CreditCard,
  MessageCircleOff,
  FileWarning,
  TrendingDown,
} from "lucide-react";

const icons = [
  CalendarX,
  CreditCard,
  MessageCircleOff,
  FileWarning,
  TrendingDown,
];

const ProblemsSection = () => {
  const t = useTranslations();
  const messages = useMessages();
  const rawItems = messages.problems.items;
  const items = Array.isArray(rawItems)
    ? (rawItems as Array<{ title: string; description: string }>)
    : [];

  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-muted/50 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("problems.title")}
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {items.map((item, index) => {
            const Icon = icons[index] || FileWarning;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-start gap-4 bg-card rounded-xl p-5 border border-border hover:border-destructive/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 group-hover:bg-destructive/20 transition-colors mt-0.5">
                  <Icon className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
