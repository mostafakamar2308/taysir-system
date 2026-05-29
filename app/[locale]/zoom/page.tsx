import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "zoomGuide" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ZoomIntegrationGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === "ar";

  const englishSections = [
    {
      title: "Prerequisites",
      content: (
        <>
          <p className="my-2">Before you begin, ensure you have:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              An active Admin or Tutor account on Academiyati System.
            </li>
            <li className="text-muted-foreground">A valid Zoom account.</li>
          </ul>
        </>
      ),
    },
    {
      title: "1. How to Add (Install) the Zoom App",
      content: (
        <>
          <p className="my-2">
            Connecting your Zoom account to Academiyati System takes just a few
            clicks.
          </p>
          <ol className="list-decimal pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Log In:</strong> Log into your Academiyati System Admin or
              Tutor Dashboard.
            </li>
            <li className="text-muted-foreground">
              <strong>Navigate to Integrations:</strong> Go to Settings &gt;
              Integrations (or your Profile Settings).
            </li>
            <li className="text-muted-foreground">
              <strong>Connect:</strong> Click the &quot;Connect to Zoom&quot;
              button.
            </li>
            <li className="text-muted-foreground">
              <strong>Authorize:</strong> You will be redirected to the Zoom
              login page. Enter your Zoom credentials and review the permissions
              requested by Academiyati System. Click &quot;Allow&quot; to grant
              permission.
            </li>
            <li className="text-muted-foreground">
              <strong>Success:</strong> You will be securely redirected back to
              your Academiyati System dashboard. Your Zoom account is now
              successfully linked!
            </li>
          </ol>
        </>
      ),
    },
    {
      title: "2. How to Use the Zoom Integration",
      content: (
        <>
          <p className="my-2">
            Once connected, the integration works seamlessly in the background
            to streamline your timetable management.
          </p>
          <p className="my-2">
            <strong>Automated Scheduling:</strong> When an Admin or Tutor
            schedules a new 1-on-1 session in the Timetable Management tool, a
            unique Zoom meeting is instantly generated in the background.
          </p>
          <p className="my-2">
            <strong>For Tutors (Starting a Session):</strong> At the scheduled
            time, navigate to your Daily Schedule in the dashboard and click
            &quot;Start Session&quot;. This will securely launch your Zoom
            application as the host.
          </p>
          <p className="my-2">
            <strong>For Students (Joining a Session):</strong> Students log into
            their secure Student Portal (PWA). At the time of the session, they
            simply click &quot;Join Session&quot;. The direct Zoom link is kept
            private to ensure all communications remain securely within the
            academy&apos;s ecosystem.
          </p>
        </>
      ),
    },
    {
      title: "3. How to Remove (Uninstall) the Zoom App",
      content: (
        <>
          <p className="my-2">
            If you wish to disconnect your Zoom account from Academiyati System,
            you can easily remove the app from your Zoom account.
          </p>
          <ol className="list-decimal pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Log in to Zoom:</strong> Go to the Zoom App Marketplace
              and log in with your Zoom account credentials.
            </li>
            <li className="text-muted-foreground">
              <strong>Manage Apps:</strong> In the top right corner, click on
              Manage, then select Added Apps from the left-hand menu.
            </li>
            <li className="text-muted-foreground">
              <strong>Locate the App:</strong> Find Academiyati System in your
              list of installed apps.
            </li>
            <li className="text-muted-foreground">
              <strong>Remove:</strong> Click the Remove button next to My
              Academy System.
            </li>
            <li className="text-muted-foreground">
              <strong>Confirm:</strong> A confirmation window will appear.
              Confirm the removal.
            </li>
          </ol>
          <p className="my-2 font-semibold">Data Deletion Information:</p>
          <p className="my-2">
            Upon removing the app, Academiyati System will lose access to create
            or manage Zoom meetings on your behalf. Any previously generated
            meeting links stored in your past schedules will remain in our
            database for historical attendance reporting, but we will no longer
            retrieve or process any new data from your Zoom account. If you wish
            to have your historical Zoom data completely purged from our
            servers, please contact our support team.
          </p>
        </>
      ),
    },
    {
      title: "Troubleshooting & Support",
      content: (
        <>
          <p className="my-2">
            Having trouble connecting your Zoom account or generating meeting
            links? We are here to help!
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Email Support: academiyatisystem@gmail.com
            </li>
            <li className="text-muted-foreground">
              Phone/WhatsApp Support: +201011214517
            </li>
            <li className="text-muted-foreground">
              Operating Hours: Sunday - Thursday, 9 AM to 5 PM EET
            </li>
          </ul>
        </>
      ),
    },
  ];

  const arabicSections = [
    {
      title: "المتطلبات الأساسية",
      content: (
        <>
          <p className="my-2">قبل أن تبدأ، تأكد من أن لديك:</p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              حساب نشط كمدير أو معلم في نظام أكاديميتي.
            </li>
            <li className="text-muted-foreground">حساب Zoom صالح.</li>
          </ul>
        </>
      ),
    },
    {
      title: "1. كيفية إضافة (تثبيت) تطبيق Zoom",
      content: (
        <>
          <p className="my-2">
            ربط حساب Zoom الخاص بك بنظام أكاديميتي لا يتطلب سوى بضع نقرات.
          </p>
          <ol className="list-decimal pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              <strong>تسجيل الدخول:</strong> قم بتسجيل الدخول إلى لوحة تحكم
              المدير أو المعلم في نظام أكاديميتي.
            </li>
            <li className="text-muted-foreground">
              <strong>الانتقال إلى الإعدادات:</strong> اذهب إلى الإعدادات &gt;
              التكاملات (أو إعدادات الملف الشخصي).
            </li>
            <li className="text-muted-foreground">
              <strong>الاتصال:</strong> انقر على زر &quot;الاتصال بـ Zoom&quot;.
            </li>
            <li className="text-muted-foreground">
              <strong>التفويض:</strong> سيتم إعادة توجيهك إلى صفحة تسجيل الدخول
              إلى Zoom. أدخل بيانات اعتماد Zoom الخاصة بك وراجع الأذونات
              المطلوبة من قبل نظام أكاديميتي. انقر &quot;السماح&quot; لمنح
              الإذن.
            </li>
            <li className="text-muted-foreground">
              <strong>النجاح:</strong> سيتم إعادة توجيهك بأمان إلى لوحة تحكم
              نظام أكاديميتي. تم ربط حساب Zoom الخاص بك بنجاح!
            </li>
          </ol>
        </>
      ),
    },
    {
      title: "2. كيفية استخدام تكامل Zoom",
      content: (
        <>
          <p className="my-2">
            بمجرد الاتصال، يعمل التكامل بسلاسة في الخلفية لتبسيط إدارة جدول
            مواعيدك.
          </p>
          <p className="my-2">
            <strong>الجدولة الآلية:</strong> عندما يقوم المدير أو المعلم بجدولة
            جلسة فردية جديدة في أداة إدارة الجدول الزمني، يتم إنشاء رابط اجتماع
            Zoom فريد تلقائياً في الخلفية.
          </p>
          <p className="my-2">
            <strong>للمعلمين (بدء الجلسة):</strong> في الوقت المحدد، انتقل إلى
            جدولك اليومي في لوحة التحكم وانقر على &quot;بدء الجلسة&quot;. سيؤدي
            هذا إلى تشغيل تطبيق Zoom الخاص بك كمضيف بشكل آمن.
          </p>
          <p className="my-2">
            <strong>للطلاب (الانضمام إلى الجلسة):</strong> يقوم الطلاب بتسجيل
            الدخول إلى بوابة الطلاب الآمنة (PWA). في وقت الجلسة، ينقرون ببساطة
            على &quot;الانضمام إلى الجلسة&quot;. يتم الاحتفاظ برابط Zoom المباشر
            خاصاً لضمان بقاء جميع الاتصالات بشكل آمن داخل بيئة الأكاديمية.
          </p>
        </>
      ),
    },
    {
      title: "3. كيفية إزالة (إلغاء تثبيت) تطبيق Zoom",
      content: (
        <>
          <p className="my-2">
            إذا كنت ترغب في فصل حساب Zoom الخاص بك عن نظام أكاديميتي، يمكنك
            بسهولة إزالة التطبيق من حساب Zoom الخاص بك.
          </p>
          <ol className="list-decimal pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              <strong>تسجيل الدخول إلى Zoom:</strong> اذهب إلى سوق تطبيقات Zoom
              وقم بتسجيل الدخول باستخدام بيانات اعتماد حساب Zoom الخاص بك.
            </li>
            <li className="text-muted-foreground">
              <strong>إدارة التطبيقات:</strong> في الزاوية العلوية اليمنى، انقر
              على &quot;إدارة&quot;، ثم اختر &quot;التطبيقات المضافة&quot; من
              القائمة اليسرى.
            </li>
            <li className="text-muted-foreground">
              <strong>تحديد موقع التطبيق:</strong> ابحث عن &quot;نظام
              أكاديميتي&quot; في قائمة التطبيقات المثبتة لديك.
            </li>
            <li className="text-muted-foreground">
              <strong>إزالة:</strong> انقر على زر &quot;إزالة&quot; بجانب
              &quot;نظام أكاديميتي&quot;.
            </li>
            <li className="text-muted-foreground">
              <strong>تأكيد:</strong> ستظهر نافذة تأكيد. قم بتأكيد الإزالة.
            </li>
          </ol>
          <p className="my-2 font-semibold">معلومات حذف البيانات:</p>
          <p className="my-2">
            عند إزالة التطبيق، سيفقد نظام أكاديميتي القدرة على إنشاء أو إدارة
            اجتماعات Zoom نيابة عنك. ستبقى أي روابط اجتماعات تم إنشاؤها مسبقاً
            والمخزنة في جداولك السابقة في قاعدة بياناتنا لأغراض تقارير الحضور
            التاريخية، لكننا لن نسترد أو نعالج أي بيانات جديدة من حساب Zoom
            الخاص بك. إذا كنت ترغب في مسح بيانات Zoom التاريخية الخاصة بك
            بالكامل من خوادمنا، يرجى الاتصال بفريق الدعم لدينا.
          </p>
        </>
      ),
    },
    {
      title: "استكشاف الأخطاء وإصلاحها والدعم",
      content: (
        <>
          <p className="my-2">
            تواجه مشكلة في ربط حساب Zoom الخاص بك أو إنشاء روابط الاجتماعات؟ نحن
            هنا للمساعدة!
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              الدعم عبر البريد الإلكتروني: academiyatisystem@gmail.com
            </li>
            <li className="text-muted-foreground">
              الدعم عبر الهاتف / WhatsApp: +201011214517
            </li>
            <li className="text-muted-foreground">
              ساعات العمل: الأحد - الخميس، 9 صباحاً - 5 مساءً (توقيت مصر)
            </li>
          </ul>
        </>
      ),
    },
  ];

  const sections = locale === "ar" ? arabicSections : englishSections;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />
      <main className="py-20 px-4 my-4">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {locale === "ar"
                  ? "دليل تكامل Zoom – نظام أكاديميتي"
                  : "Academiyati System – Zoom Integration Guide"}
              </h1>
              <p className="text-muted-foreground">
                {locale === "ar"
                  ? "مرحباً بك في دليل تكامل Zoom لنظام أكاديميتي"
                  : "Welcome to the Zoom Integration guide for Academiyati System (نظام أكاديميتي)."}
              </p>
            </div>

            <div className="prose prose-stone dark:prose-invert max-w-none">
              <p className="lead text-muted-foreground">
                {locale === "ar"
                  ? "من خلال ربط حساب Zoom الخاص بك بمنصتنا، يمكنك أتمتة عمليات الأكاديمية الفردية الخاصة بك. يقوم تكاملنا تلقائياً بإنشاء روابط اجتماعات Zoom آمنة عند جدولة جلسة، ويخفي الروابط المباشرة من بوابة الطلاب لحماية أعمالك، ويسمح للمعلمين ببدء الجلسات مباشرة من لوحة التحكم الخاصة بهم."
                  : "By connecting your Zoom account to our platform, you can automate your 1-on-1 academy operations. Our integration automatically generates secure Zoom meeting links when a session is scheduled, hides the direct links from the student portal to protect your business, and allows tutors to start sessions directly from their dashboard."}
              </p>

              {sections.map((section, idx) => (
                <div key={idx} className="mb-8">
                  <h2 className="text-xl font-bold mb-3 text-foreground">
                    {section.title}
                  </h2>
                  <div className="text-muted-foreground space-y-1">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
