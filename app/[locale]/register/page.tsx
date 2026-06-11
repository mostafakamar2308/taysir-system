"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { RegisterForm } from "@/components/register/RegisterForm";
import { registerLead } from "@/actions/lead";
import { LeadData } from "@/lib/schemas/lead";
import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (data: LeadData) => {
    setServerError(null);
    const result = await registerLead(data);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setServerError(result.error || "An error occurred");
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <SuccessScreen message="تم استلام طلبك بنجاح، سيتم التواصل معك عبر الواتساب قريباً." />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <RegisterForm onSubmit={handleSubmit} serverError={serverError} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function SuccessScreen({ message }: { message?: string }) {
  const t = useTranslations("register");
  return (
    <div className="text-center py-16 grow flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">{t("success")}</h2>
      <CheckCircle className="text-green-500 mt-6" size={48} />
      <p className="text-muted-foreground mt-4">
        {message || t("defaultMessage")}
      </p>
    </div>
  );
}
