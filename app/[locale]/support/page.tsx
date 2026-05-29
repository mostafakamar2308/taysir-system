import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "support" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === "ar";

  const email = "academiyatisystem@gmail.com";
  const phone = "+201011214517";
  const whatsappNumber = "201011214517"; // Without + for WhatsApp URL
  const whatsappMessage = isRTL
    ? "مرحباً، أحتاج مساعدة بخصوص نظام أكاديميتي"
    : "Hello, I need help with My Academy System";

  const englishContent = {
    title: "Support Center",
    description:
      "Get help with My Academy System. Contact our support team via email or WhatsApp.",
    intro:
      "Having trouble with your account, Zoom integration, or any other feature? We're here to help! Choose your preferred way to reach us.",
    emailTitle: "Email Support",
    emailDesc:
      "Send us an email and we'll get back to you within 24 hours on business days.",
    emailButton: "Send Email",
    whatsappTitle: "WhatsApp Support",
    whatsappDesc:
      "Chat with us on WhatsApp for quick responses. Usually replies within a few hours.",
    whatsappButton: "Start WhatsApp Chat",
    phoneTitle: "Phone Support",
    phoneDesc:
      "Call us during business hours for urgent matters. If we're busy, please leave a message or try WhatsApp.",
    phoneButton: "Call Us",
    businessHours: "Business Hours: Sunday - Thursday, 9 AM - 5 PM EET",
    responseTime: "Response time: Usually within 24 hours",
  };

  const arabicContent = {
    title: "مركز الدعم",
    description:
      "احصل على مساعدة بخصوص نظام أكاديميتي. تواصل مع فريق الدعم عبر البريد الإلكتروني أو WhatsApp.",
    intro:
      "تواجه مشكلة في حسابك، أو تكامل Zoom، أو أي ميزة أخرى؟ نحن هنا للمساعدة! اختر الطريقة المفضلة للتواصل معنا.",
    emailTitle: "الدعم عبر البريد الإلكتروني",
    emailDesc:
      "أرسل لنا بريداً إلكترونياً وسنرد عليك في غضون 24 ساعة في أيام العمل.",
    emailButton: "إرسال بريد إلكتروني",
    whatsappTitle: "الدعم عبر WhatsApp",
    whatsappDesc:
      "تحدث معنا على WhatsApp للحصول على ردود سريعة. عادةً ما نرد في غضون ساعات قليلة.",
    whatsappButton: "بدء محادثة WhatsApp",
    phoneTitle: "الدعم الهاتفي",
    phoneDesc:
      "اتصل بنا خلال ساعات العمل للأمور العاجلة. إذا كنا مشغولين، يرجى ترك رسالة أو تجربة WhatsApp.",
    phoneButton: "اتصل بنا",
    businessHours:
      "ساعات العمل: الأحد - الخميس، 9 صباحاً - 5 مساءً (توقيت مصر)",
    responseTime: "وقت الرد: عادةً خلال 24 ساعة",
  };

  const content = locale === "ar" ? arabicContent : englishContent;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <main className="py-20 px-4 my-4">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {content.title}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {content.intro}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {/* Email Card */}
              <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">{content.emailTitle}</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {content.emailDesc}
                </p>
                <a href={`mailto:${email}`}>
                  <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                    {content.emailButton}
                  </button>
                </a>
                <p className="text-sm text-muted-foreground mt-3 break-all">
                  {email}
                </p>
              </div>

              {/* WhatsApp Card */}
              <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-green-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {content.whatsappTitle}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {content.whatsappDesc}
                </p>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    whatsappMessage,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors">
                    {content.whatsappButton}
                  </button>
                </a>
                <p className="text-sm text-muted-foreground mt-3">{phone}</p>
              </div>
            </div>

            {/* Phone Option - Full Width (Optional) */}
            <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow mt-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">{content.phoneTitle}</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {content.phoneDesc}
              </p>
              <a href={`tel:${phone}`}>
                <button className="w-full md:w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
                  {content.phoneButton}
                </button>
              </a>
              <p className="text-sm text-muted-foreground mt-3">{phone}</p>
            </div>

            {/* Business Hours & Response Time */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {content.businessHours}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {content.responseTime}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
