"use client";
import { useTranslations } from "next-intl";
import { BookOpen, Mail, Globe, Facebook } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  const t = useTranslations();

  return (
    <footer className="bg-foreground text-primary-foreground/80 py-16">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
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
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  {t("footer.home")}
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="hover:text-primary transition-colors"
                >
                  {t("footer.features")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-primary transition-colors"
                >
                  {t("footer.pricing")}
                </a>
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
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-primary-foreground mb-4">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <a
                  href="mailto:academiyatisystem@gmail.com"
                  className="hover:text-primary transition-colors"
                >
                  {t("footer.email")}
                </a>
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
                <a
                  key={i}
                  href="https://www.facebook.com/profile.php?id=61575448018616"
                  className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-6 text-center text-sm text-primary-foreground/40">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
