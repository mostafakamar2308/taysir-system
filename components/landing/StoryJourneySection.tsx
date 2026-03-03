"use client";
import { useMessages, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

interface StoryCard {
  time: string;
  title: string;
  content: string;
  emoji: string;
  emoji2: string;
  period: string;
}

const StoryJourneySection = () => {
  const t = useTranslations();
  const messages = useMessages();
  const beforeRaw = messages.storyJourney.before;
  const afterRaw = messages.storyJourney.after;
  const beforeCards = Array.isArray(beforeRaw)
    ? (beforeRaw as StoryCard[])
    : [];
  const afterCards = Array.isArray(afterRaw) ? (afterRaw as StoryCard[]) : [];

  return (
    <section id="story" className="py-20 md:py-28 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("storyJourney.title")}
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </motion.div>

        {/* Split view: Before on left, After on right */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
          {/* Before column */}
          <div className="space-y-5">
            {beforeCards.map((card, i) => (
              <motion.div
                key={`before-${i}`}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-destructive/20 bg-card p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="text-2xl">{card.emoji2}</span>
                </div>
                <p className="text-xs text-destructive font-semibold mb-2 uppercase tracking-wide">
                  {card.period}
                </p>
                <h4 className="font-bold text-foreground text-base mb-1">
                  {card.time}: {card.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.content}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Center transition */}
          <div className="hidden md:flex flex-col items-center justify-center self-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-primary flex flex-col items-center justify-center p-6 text-primary-foreground shadow-lg w-44"
            >
              <ArrowDown className="w-8 h-8 mb-2 animate-bounce ltr:-rotate-90 rtl:rotate-90" />
              <p className="text-center font-bold text-sm leading-snug">
                {t("storyJourney.transition")}
              </p>
            </motion.div>
          </div>

          {/* Mobile transition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="md:hidden rounded-2xl bg-primary flex items-center justify-center p-5 text-primary-foreground shadow-lg"
          >
            <ArrowDown className="w-8 h-8 me-3 animate-bounce" />
            <p className="font-bold text-sm">{t("storyJourney.transition")}</p>
          </motion.div>

          {/* After column */}
          <div className="space-y-5">
            {afterCards.map((card, i) => (
              <motion.div
                key={`after-${i}`}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border-2 border-primary/30 bg-accent/50 p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="text-2xl">{card.emoji2}</span>
                </div>
                <p className="text-xs text-primary font-semibold mb-2 uppercase tracking-wide">
                  {card.period}
                </p>
                <h4 className="font-bold text-foreground text-base mb-1">
                  {card.time}: {card.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoryJourneySection;
