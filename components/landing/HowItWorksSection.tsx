"use client";
import { useMessages, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ClipboardList,
  MessageCircle,
  Play,
  TrendingUp,
  Star,
} from "lucide-react";

const icons = [ClipboardList, MessageCircle, Play, TrendingUp, Star];

interface Step {
  title: string;
  description: string;
  day: string;
}

const HowItWorksSection = () => {
  const t = useTranslations();
  const messages = useMessages();
  const steps = messages.howItWorks.steps as Step[];

  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("howItWorks.title")}
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 start-[10%] end-[10%] h-0.5 bg-border z-0" />

            {steps.map((step, index) => {
              const Icon = icons[index] || ClipboardList;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative z-10 text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-md">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
                    {step.day}
                  </span>
                  <h3 className="text-sm md:text-base font-bold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
