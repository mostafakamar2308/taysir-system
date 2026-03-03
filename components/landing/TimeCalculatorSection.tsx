"use client";
import { useState } from "react";
import { useMessages, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Clock, CalendarDays } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface TaskBreakdown {
  label: string;
  hours: number;
}

const TimeCalculatorSection = () => {
  const t = useTranslations();
  const [teachers, setTeachers] = useState(5);
  const [students, setStudents] = useState(50);
  const [branches, setBranches] = useState(1);
  const [calculated, setCalculated] = useState(false);
  const messages = useMessages();
  // Micro-task breakdown
  const getTaskBreakdown = (): TaskBreakdown[] => {
    const breakdownRaw = messages.calculator.breakdown;
    const labels = Array.isArray(breakdownRaw)
      ? (breakdownRaw as { label: string }[])
      : [];

    const hours = [
      Math.round(students * 0.08 + branches * 1), // payment notices
      Math.round(teachers * 0.5 + branches * 1), // schedule coordination
      Math.round(students * 0.04), // parent reports
      Math.round(teachers * 0.3 + students * 0.02), // attendance tracking
      Math.round(branches * 2 + teachers * 0.2), // financial reports
      Math.round(students * 0.03 + teachers * 0.2), // registration & inquiries
    ];

    return labels.map((item, i) => ({
      label: item.label,
      hours: Math.max(1, hours[i] || 1),
    }));
  };

  const tasks = getTaskBreakdown();
  const hoursSaved = tasks.reduce((sum, t) => sum + t.hours, 0);
  const daysSaved = Math.round((hoursSaved * 12) / 8);

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Calculator className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("calculator.title")}
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto bg-card rounded-2xl border border-border p-8 shadow-lg"
        >
          {/* Teachers */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <label className="font-semibold text-foreground">
                {t("calculator.teachers")}
              </label>
              <span className="text-primary font-bold text-lg">{teachers}</span>
            </div>
            <Slider
              value={[teachers]}
              onValueChange={(v) => {
                setTeachers(v[0]);
                setCalculated(false);
              }}
              min={1}
              max={50}
              step={1}
            />
          </div>

          {/* Students */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <label className="font-semibold text-foreground">
                {t("calculator.students")}
              </label>
              <span className="text-primary font-bold text-lg">{students}</span>
            </div>
            <Slider
              value={[students]}
              onValueChange={(v) => {
                setStudents(v[0]);
                setCalculated(false);
              }}
              min={10}
              max={500}
              step={10}
            />
          </div>

          {/* Branches */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              <label className="font-semibold text-foreground">
                {t("calculator.branches")}
              </label>
              <span className="text-primary font-bold text-lg">{branches}</span>
            </div>
            <Slider
              value={[branches]}
              onValueChange={(v) => {
                setBranches(v[0]);
                setCalculated(false);
              }}
              min={1}
              max={10}
              step={1}
            />
          </div>

          <Button
            onClick={() => setCalculated(true)}
            className="w-full bg-primary text-primary-foreground shadow-primary py-5 text-base"
          >
            {t("calculator.calculate")}
          </Button>

          <AnimatePresence>
            {calculated && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-accent rounded-xl p-5 text-center">
                    <Clock className="w-7 h-7 text-primary mx-auto mb-2" />
                    <p className="text-3xl font-extrabold text-primary">
                      {hoursSaved}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("calculator.hoursLabel")}
                    </p>
                  </div>
                  <div className="bg-accent rounded-xl p-5 text-center">
                    <CalendarDays className="w-7 h-7 text-primary mx-auto mb-2" />
                    <p className="text-3xl font-extrabold text-primary">
                      {daysSaved}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("calculator.daysLabel")}
                    </p>
                  </div>
                </div>

                {/* Task breakdown */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {t("calculator.breakdownTitle")}
                  </p>
                  {tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-sm text-muted-foreground">
                        {task.label}
                      </span>
                      <span className="text-sm font-bold text-destructive">
                        {task.hours} {t("calculator.hoursShort")}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default TimeCalculatorSection;
