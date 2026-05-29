import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { getTranslations } from "next-intl/server";

// You can also generate metadata dynamically
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === "ar";

  const englishSections = [
    {
      title: "1. Our Role in Data Processing",
      content: (
        <>
          <p className="my-2">
            Our Service provides management tools for educational academies. In
            this context:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>The Academy (Our Client):</strong> Acts as the &quot;Data
              Controller.&quot; They decide what student and tutor data to
              collect and how to use it.
            </li>
            <li className="text-muted-foreground">
              <strong>Academiyati System:</strong> Acts as the &quot;Data
              Processor.&quot; We only process student and tutor data on behalf
              of the Academy to provide our Service.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "2. Information We Collect",
      content: (
        <>
          <p className="my-2">
            We collect information directly from you, automatically through your
            use of the Service, and from third-party integrations.
          </p>

          <p className="font-semibold mt-4">
            A. Information Provided by Academy Admins:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Account Data:</strong> Name, email address, phone number,
              and billing information.
            </li>
            <li className="text-muted-foreground">
              <strong>Platform Data:</strong> Data you input regarding your
              operations, including financial metrics, salaries, and scheduling
              information.
            </li>
          </ul>

          <p className="font-semibold mt-4">
            B. Information Collected from Tutors and Students:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Profile Data:</strong> Names, email addresses, and contact
              details provided by the Academy or the user.
            </li>
            <li className="text-muted-foreground">
              <strong>Educational Data:</strong> Attendance records, performance
              reports, session history, and subscription statuses.
            </li>
            <li className="text-muted-foreground">
              <strong>Communications:</strong> Messages sent through our
              internal student portal and communication systems.
            </li>
          </ul>

          <p className="font-semibold mt-4">C. Automatically Collected Data:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Device and Usage Data:</strong> IP addresses, browser
              types, operating systems, and interaction metrics (e.g., time
              spent on pages, clicks) to help us improve the platform.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "3. Third-Party Integrations (Zoom)",
      content: (
        <>
          <p className="my-2">
            To facilitate online learning, our Service integrates with
            third-party applications like Zoom.
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              We collect and process Zoom meeting links.
            </li>
            <li className="text-muted-foreground">
              We do not record video or audio of Zoom sessions on our servers
              unless explicitly configured by the Academy through Zoom&apos;s
              native recording features. Your use of Zoom is also governed by
              Zoom&apos;s Privacy Policy.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "4. How We Use Your Information",
      content: (
        <>
          <p className="my-2">
            We use the collected information strictly to operate and improve the
            Service:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              To create and manage your accounts.
            </li>
            <li className="text-muted-foreground">
              To facilitate scheduling, salary calculations, and financial
              reporting.
            </li>
            <li className="text-muted-foreground">
              To power the internal communication portal between students and
              tutors.
            </li>
            <li className="text-muted-foreground">
              To send administrative information, such as reminders, invoices,
              and security alerts.
            </li>
            <li className="text-muted-foreground">
              To identify and prevent fraudulent activity or unauthorized
              bypassing of the Academy&apos;s systems (e.g., monitoring
              communication logs for platform integrity).
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. How We Share Your Information",
      content: (
        <>
          <p className="my-2">
            We do not sell, rent, or trade your personal information. We only
            share information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>With the Academy:</strong> Tutors and students should be
              aware that the Academy (the Admin) has full access to their
              profiles, session history, and platform communications.
            </li>
            <li className="text-muted-foreground">
              <strong>Service Providers:</strong> We may share data with trusted
              third-party vendors who assist us in operating the platform (e.g.,
              cloud hosting providers) under strict confidentiality agreements.
            </li>
            <li className="text-muted-foreground">
              <strong>Legal Compliance:</strong> If required by law, court
              order, or governmental request, we may disclose your data to
              comply with legal obligations.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "6. Data Security",
      content: (
        <p className="my-2">
          We implement robust administrative, technical, and physical security
          measures to protect your personal information. This includes encrypted
          communications, secure database architecture, and restricted access
          protocols. However, no electronic transmission over the internet or
          information storage technology can be guaranteed to be 100% secure.
        </p>
      ),
    },
    {
      title: "7. Data Retention",
      content: (
        <p className="my-2">
          We retain personal information only for as long as necessary to
          fulfill the purposes outlined in this Privacy Policy or as required by
          law. When an Academy terminates its account, we will delete or
          anonymize the associated data within 30 days, subject to our legal
          obligations.
        </p>
      ),
    },
    {
      title: "8. User Rights",
      content: (
        <>
          <p className="my-2">
            Depending on your location, you may have rights regarding your
            personal data, including the right to access, correct, or delete
            your information.
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Students and Tutors:</strong> Because we process your data
              on behalf of the Academy, please direct any data requests (like
              deleting an account or accessing records) directly to your
              Academy&apos;s administrator.
            </li>
            <li className="text-muted-foreground">
              <strong>Academy Admins:</strong> You can update or delete your
              account information directly within the system settings or by
              contacting us.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "9. Changes to This Privacy Policy",
      content: (
        <p className="my-2">
          We may update this Privacy Policy from time to time. We will notify
          users of any material changes by posting the new Privacy Policy on
          this page and updating the &quot;Last Updated&quot; date.
        </p>
      ),
    },
    {
      title: "10. Contact Us",
      content: (
        <>
          <p className="my-2">
            If you have questions or comments about this Privacy Policy, please
            contact us at:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Email: academiyatisystem@gmail.com
            </li>
            <li className="text-muted-foreground">Phone: +201011214517</li>
          </ul>
        </>
      ),
    },
  ];

  const arabicSections = [
    {
      title: "1. دورنا في معالجة البيانات",
      content: (
        <>
          <p className="my-2">
            تقدم خدمتنا أدوات إدارية متكاملة للأكاديميات التعليمية. وفي هذا
            السياق:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              <strong>الأكاديمية (عميلنا):</strong> تعمل بصفتها &quot;مراقب
              البيانات&quot; (Data Controller). وهي الجهة التي تقرر طبيعة بيانات
              الطلاب والمعلمين التي يتم جمعها وكيفية استخدامها.
            </li>
            <li className="text-muted-foreground">
              <strong>نظام أكاديميتي:</strong> يعمل بصفته &quot;معالج
              البيانات&quot; (Data Processor). نحن نقوم فقط بمعالجة بيانات
              الطلاب والمعلمين نيابةً عن الأكاديمية لغرض تقديم خدمتنا.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "2. المعلومات التي نجمعها",
      content: (
        <>
          <p className="my-2">
            نحن نجمع المعلومات منك مباشرةً، وتلقائياً من خلال استخدامك للخدمة،
            ومن خلال عمليات الربط مع الأنظمة الخارجية.
          </p>

          <p className="font-semibold mt-4">
            أ. المعلومات المقدمة من مديري الأكاديمية:
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              <strong>بيانات الحساب:</strong> الاسم، وعنوان البريد الإلكتروني،
              ورقم الهاتف، ومعلومات الفواتير والدفع.
            </li>
            <li className="text-muted-foreground">
              <strong>بيانات المنصة:</strong> البيانات التي تدخلها والمتعلقة
              بسير العمليات الخاصة بك، بما في ذلك المقاييس المالية، والرواتب،
              ومعلومات الجداول الزمنية.
            </li>
          </ul>

          <p className="font-semibold mt-4">
            ب. المعلومات التي يتم جمعها من المعلمين والطلاب:
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              <strong>بيانات الملف الشخصي:</strong> الأسماء، وعناوين البريد
              الإلكتروني، وبيانات الاتصال التي توفرها الأكاديمية أو المستخدم.
            </li>
            <li className="text-muted-foreground">
              <strong>البيانات التعليمية:</strong> سجلات الحضور، وتقارير الأداء،
              وسجل الجلسات، وحالات الاشتراكات.
            </li>
            <li className="text-muted-foreground">
              <strong>الاتصالات:</strong> الرسائل التي يتم إرسالها من خلال بوابة
              الطلاب وأنظمة الاتصال الداخلية الخاصة بنا.
            </li>
          </ul>

          <p className="font-semibold mt-4">
            ج. البيانات التي يتم جمعها تلقائياً:
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              <strong>بيانات الجهاز والاستخدام:</strong> عناوين بروتوكول
              الإنترنت (IP)، وأنواع المتصفحات، وأنظمة التشغيل، ومقاييس التفاعل
              (مثل الوقت المستغرق في التصفح، والنقرات) وذلك لمساعدتنا في تحسين
              وتطوير المنصة.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "3. عمليات الربط مع الأنظمة الخارجية (Zoom)",
      content: (
        <>
          <p className="my-2">
            لتسهيل عمليات التعلم عبر الإنترنت، ترتبط خدمتنا بتطبيقات تابعة
            لأطراف خارجية مثل Zoom.
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              نقوم بجمع ومعالجة روابط اجتماعات Zoom.
            </li>
            <li className="text-muted-foreground">
              نحن لا نقوم بتسجيل مقاطع الفيديو أو الصوت لجلسات Zoom على خوادمنا،
              ما لم تقم الأكاديمية بتفعيل ذلك صراحةً من خلال ميزات التسجيل
              الأساسية المتاحة في تطبيق Zoom. يخضع استخدامك لـ Zoom أيضاً لسياسة
              الخصوصية الخاصة بشركة Zoom.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "4. كيف نستخدم معلوماتك",
      content: (
        <>
          <p className="my-2">
            نحن نستخدم المعلومات التي تم جمعها بشكل صارم لتشغيل الخدمة وتحسينها
            من أجل الأغراض التالية:
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">إنشاء حساباتك وإدارتها.</li>
            <li className="text-muted-foreground">
              تسهيل عمليات الجدولة، وحساب الرواتب، وإصدار التقارير المالية.
            </li>
            <li className="text-muted-foreground">
              تشغيل بوابة الاتصال الداخلية بين الطلاب والمعلمين.
            </li>
            <li className="text-muted-foreground">
              إرسال المعلومات الإدارية، مثل التذكيرات، والفواتير، والتنبيهات
              الأمنية.
            </li>
            <li className="text-muted-foreground">
              تحديد ومنع الأنشطة الاحتيالية أو التجاوزات غير المصرح بها لأنظمة
              الأكاديمية (مثل مراقبة سجلات الاتصال لضمان أمان وموثوقية المنصة).
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. كيف نشارك معلوماتك",
      content: (
        <>
          <p className="my-2">
            نحن لا نبيع أو نؤجر أو نتاجر بمعلوماتك الشخصية. نحن نشارك المعلومات
            فقط في الحالات التالية:
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              <strong>مع الأكاديمية:</strong> يجب أن يدرك المعلمون والطلاب أن
              الأكاديمية (المدير) لديها حق الوصول الكامل إلى ملفاتهم الشخصية،
              وسجلات الجلسات، ومراسلاتهم عبر المنصة.
            </li>
            <li className="text-muted-foreground">
              <strong>مقدمو الخدمات:</strong> قد نشارك البيانات مع أطراف خارجية
              موثوقة تساعدنا في تشغيل المنصة (مثل مزودي خدمات الاستضافة
              السحابية) وذلك بموجب اتفاقيات صارمة.
            </li>
            <li className="text-muted-foreground">
              <strong>الامتثال القانوني:</strong> قد نفصح عن بياناتك إذا لزم
              الأمر للامتثال للقانون، أو استجابة لأمر محكمة، أو طلب حكومي رسمي.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "6. أمن البيانات",
      content: (
        <p className="my-2">
          نحن نطبق تدابير أمنية وإدارية وتقنية قوية لحماية معلوماتك الشخصية.
          يشمل ذلك تشفير البيانات، وبنية آمنة لقواعد البيانات، وبروتوكولات صارمة
          لتقييد الوصول. ومع ذلك، لا يمكن ضمان أمان أي نقل إلكتروني عبر شبكة
          الإنترنت أو تقنية لتخزين المعلومات بنسبة 100٪.
        </p>
      ),
    },
    {
      title: "7. الاحتفاظ بالبيانات",
      content: (
        <p className="my-2">
          نحتفظ بالمعلومات الشخصية فقط طوال الفترة اللازمة لتحقيق الأغراض
          الموضحة في سياسة الخصوصية هذه، أو حسبما يقتضيه القانون. في حال قامت
          الأكاديمية بإلغاء حسابها، سنقوم بحذف البيانات المرتبطة بها أو إخفاء
          هويتها في غضون 30 يوماً، مع مراعاة التزاماتنا القانونية.
        </p>
      ),
    },
    {
      title: "8. حقوق المستخدم",
      content: (
        <>
          <p className="my-2">
            بناءً على موقعك الجغرافي، قد تكون لديك حقوق معينة فيما يتعلق
            ببياناتك الشخصية، بما في ذلك الحق في الوصول إلى معلوماتك أو تصحيحها
            أو حذفها.
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              <strong>الطلاب والمعلمون:</strong> نظراً لأننا نعالج بياناتكم
              نيابةً عن الأكاديمية، يُرجى توجيه أي طلبات متعلقة بالبيانات (مثل
              طلب حذف الحساب أو الوصول إلى السجلات) مباشرةً إلى إدارة الأكاديمية
              التابعين لها.
            </li>
            <li className="text-muted-foreground">
              <strong>مديرو الأكاديمية:</strong> يمكنكم تحديث أو حذف معلومات
              حسابكم مباشرة من خلال إعدادات النظام أو عن طريق التواصل معنا.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "9. التغييرات على سياسة الخصوصية",
      content: (
        <p className="my-2">
          قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإشعار المستخدمين
          بأي تغييرات جوهرية عن طريق نشر سياسة الخصوصية الجديدة على هذه الصفحة
          وتحديث تاريخ &quot;آخر تحديث&quot; المذكور أعلاه.
        </p>
      ),
    },
    {
      title: "10. اتصل بنا",
      content: (
        <>
          <p className="my-2">
            إذا كانت لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه، يُرجى
            التواصل معنا عبر:
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              البريد الإلكتروني: academiyatisystem@gmail.com
            </li>
            <li className="text-muted-foreground">رقم الهاتف: +201011214517</li>
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
                  ? "سياسة الخصوصية لـ نظام أكاديميتي (Academiyati System)"
                  : "Privacy Policy for Academiyati System"}
              </h1>
              <p className="text-muted-foreground">
                {locale === "ar"
                  ? "آخر تحديث: 29/5/2026"
                  : "Last Updated: May 29, 2026"}
              </p>
            </div>

            <div className="prose prose-stone dark:prose-invert max-w-none">
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
