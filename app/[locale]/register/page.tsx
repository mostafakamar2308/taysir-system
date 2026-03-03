"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { SuccessScreen } from "@/components/register/SuccessScreen";
import { RegisterForm } from "@/components/register/RegisterForm";
import { addToWaitlist } from "@/actions/waitlist";

export default function RegisterPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setServerError(null);
    const result = await addToWaitlist(formData);

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
        <SuccessScreen />
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
