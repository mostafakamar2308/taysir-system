"use client";
import { useTranslations, useLocale } from "next-intl";
import { Mail, Globe, Facebook } from "lucide-react";
import Link from "next/link";
import logo from "@/assets/logo-transparent.png";
import Image from "next/image";

const Footer = () => {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Helper to build localized URLs
  const getLocalizedPath = (path: string) => {
    return locale === "ar" ? `/ar${path}` : path;
  };

  return (
    <footer className="bg-foreground text-primary-foreground/80 py-16">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Image
                  alt="Academiyati System Logo"
                  src={logo}
                  width={20}
                  height={20}
                  className="invert"
                />
              </div>
              <span className="font-bold text-lg text-primary-foreground">
                {t("footer.brand")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/60">
              {t("footer.vision")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-primary-foreground mb-4">
              {t("footer.quickLinks")}
            </h4>
            <div className="flex justify-between">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/#"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.home")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#features"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.features")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.pricing")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.register")}
                  </Link>
                </li>
              </ul>
              <div className="flex flex-col gap-2 justify-center gap-x-6 gap-y-2 mt-10 text-sm text-primary-foreground/50">
                <Link
                  href={getLocalizedPath("/privacy")}
                  className="hover:text-primary transition-colors"
                >
                  {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
                <Link
                  href={getLocalizedPath("/terms")}
                  className="hover:text-primary transition-colors"
                >
                  {isRTL ? "شروط الخدمة" : "Terms of Service"}
                </Link>
                <Link
                  href={getLocalizedPath("/zoom")}
                  className="hover:text-primary transition-colors"
                >
                  {isRTL ? "دليل تكامل Zoom" : "Zoom Integration Guide"}
                </Link>
                <Link
                  href={getLocalizedPath("/support")}
                  className="hover:text-primary transition-colors"
                >
                  {isRTL ? "الدعم" : "Support"}
                </Link>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-primary-foreground mb-4">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <Link
                  href="mailto:academiyatisystem@gmail.com"
                  className="hover:text-primary transition-colors"
                >
                  {t("footer.email")}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span>{t("footer.website")}</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold text-primary-foreground mb-4">
              {t("footer.followUs")}
            </h4>
            <div className="flex gap-3">
              {[Facebook].map((Icon, i) => (
                <Link
                  key={i}
                  href="https://www.facebook.com/profile.php?id=61575448018616"
                  className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Links Row */}

        <div className="border-t border-primary-foreground/10 mt-6 pt-6 text-center text-sm text-primary-foreground/40">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
