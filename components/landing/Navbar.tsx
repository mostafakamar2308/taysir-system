"use client";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo-transparent.png";

const Navbar = () => {
  const t = useTranslations();
  const locale = useLocale();

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathName = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t("nav.home"), href: "#" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.howItWorks"), href: "#how-it-works" },
  ];

  const isHome = pathName === `/${locale}`;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed w-full z-50 ${scrolled ? "glass shadow-md" : "bg-transparent"}`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              loading="eager"
              src={logo}
              width={60}
              height={60}
              alt="نظام أكاديميتي"
            />
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-foreground">
                {t("nav.brand")}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          {isHome && (
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* {locale === "en" ? (
              <Link
                href="/ar"
                locale="ar"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
              >
                <Globe className="w-4 h-4" />
                <span>{"عربي"}</span>
              </Link>
            ) : (
              <Link
                href="/en"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
              >
                <Globe className="w-4 h-4" />
                <span>{"English"}</span>
              </Link>
            )} */}

            <Link href="/login" className="hidden sm:block">
              <Button size="sm" variant={"outline"}>
                {t("nav.login")}
              </Button>
            </Link>

            <Link href="/register" className="hidden sm:block">
              <Button
                size="sm"
                className="bg-primary hover:opacity-90 text-primary-foreground shadow-primary"
              >
                {t("nav.joinWaitlist")}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {isHome &&
                navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              <Link href="/login">
                <Button size="sm" className="w-full" variant={"outline"}>
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-primary text-primary-foreground">
                  {t("nav.joinWaitlist")}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
