"use client";
import { useMessages, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Calendar,
  Wallet,
  MessageSquare,
  BarChart3,
  LayoutDashboard,
  FileText,
  Video,
  Smartphone,
  ShieldCheck,
} from "lucide-react";

// Each feature gets a specific icon and a `variant` for grid classes
const featuresConfig = [
  { icon: ShieldCheck, variant: "medium" }, // 8: Monitored Chat
  { icon: Smartphone, variant: "medium" }, // 7: PWA (full width)
  { icon: Calendar, variant: "small" }, // 0: Smart Schedule
  { icon: LayoutDashboard, variant: "large" }, // 4: Interfaces
  { icon: Wallet, variant: "medium" }, // 1: Financial
  { icon: MessageSquare, variant: "small" }, // 2: WhatsApp
  { icon: BarChart3, variant: "small" }, // 3: Dashboard
  { icon: FileText, variant: "medium" }, // 5: Auto Reports
  { icon: Video, variant: "medium" }, // 6: Zoom
];

const FeaturesSection = () => {
  const t = useTranslations();
  const messages = useMessages();
  const items = messages.features.items as {
    title: string;
    description: string;
  }[];

  // Map variants to Tailwind classes (for md+ screens)
  const gridClasses = (variant: string) => {
    switch (variant) {
      case "large":
        return "md:col-span-3";
      case "medium":
        return "md:col-span-2";
      case "full":
        return "md:col-span-4";
      default:
        return "";
    }
  };

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("features.title")}
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {items.map((item, index) => {
            const config = featuresConfig[index] || featuresConfig[0];
            const Icon = config.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`${gridClasses(config.variant)} bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex flex-col`}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
