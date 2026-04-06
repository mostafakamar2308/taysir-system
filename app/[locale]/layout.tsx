import { Cairo } from "next/font/google";
import "@/app/globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import MixpanelProvider from "@/components/providers/mixpanelProvider";
import { GoogleTagManager } from "@next/third-parties/google";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("title"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html className="scroll-smooth" data-scroll-behavior="smooth" lang={locale}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={`${cairo.className} relative`}
      >
        <MixpanelProvider>
          <GoogleTagManager gtmId="G-JSL523EC4W" />
          <NextIntlClientProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </NextIntlClientProvider>
        </MixpanelProvider>
      </body>
    </html>
  );
}
