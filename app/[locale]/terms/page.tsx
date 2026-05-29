import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === "ar";

  const englishSections = [
    {
      title: "1. Description of Service",
      content: (
        <p className="my-2">
          Academiyati System is a B2B software-as-a-service platform designed to
          help educational academies manage their operations. The Service
          includes features such as student and tutor management, financial
          analytics, scheduling, internal communication portals, and third-party
          application integrations (e.g., Zoom).
        </p>
      ),
    },
    {
      title: "2. Account Registration and Responsibility",
      content: (
        <>
          <p className="my-2">
            <strong>Account Creation:</strong> To use the Service, you must
            register for an administrative account. You agree to provide
            accurate, current, and complete information during registration.
          </p>
          <p className="my-2">
            <strong>Authorized Users:</strong> The Client is strictly
            responsible for all activities occurring under their account,
            including the actions of any tutors, staff, or students authorized
            by the Client to access the Service (&quot;End Users&quot;).
          </p>
          <p className="my-2">
            <strong>Disputes with End Users:</strong> We provide the software
            tools to manage your academy, including internal communication
            systems. However, we are not a party to any agreements between the
            Academy and its tutors or students. Any disputes regarding payments,
            stolen students, intellectual property, or breach of contract
            between the Academy and its End Users are solely the responsibility
            of the Academy.
          </p>
        </>
      ),
    },
    {
      title: "3. Subscriptions, Fees, and Payments",
      content: (
        <>
          <p className="my-2">
            <strong>Subscription Tiers:</strong> Access to certain features
            (such as the communication portal or white-glove onboarding) depends
            on your selected subscription tier.
          </p>
          <p className="my-2">
            <strong>Billing:</strong> Fees are billed in advance on a monthly
            basis. All payments are non-refundable unless otherwise specified in
            writing.
          </p>
          <p className="my-2">
            <strong>Changes in Fees:</strong> We reserve the right to change our
            pricing upon providing a minimum of 30 days&apos; notice. Continued
            use of the Service after the price change takes effect constitutes
            your agreement to pay the modified fees.
          </p>
        </>
      ),
    },
    {
      title: "4. Acceptable Use Policy",
      content: (
        <>
          <p className="my-2">You and your End Users agree not to:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Use the Service for any illegal, unauthorized, or fraudulent
              purpose.
            </li>
            <li className="text-muted-foreground">
              Interfere with or disrupt the integrity or performance of the
              Service.
            </li>
            <li className="text-muted-foreground">
              Attempt to gain unauthorized access to the Service, other
              accounts, or underlying systems.
            </li>
            <li className="text-muted-foreground">
              Upload or transmit any malicious code, viruses, or illegal
              content.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. Data and Intellectual Property Rights",
      content: (
        <>
          <p className="my-2">
            <strong>Your Data:</strong> The Client retains all ownership rights
            to the data inputted into the system (including student lists,
            financial records, and schedules). By using the Service, you grant
            us a worldwide, limited license to host, copy, and process this data
            solely to provide the Service to you.
          </p>
          <p className="my-2">
            <strong>Our Intellectual Property:</strong> The Service, including
            its original code, design, features, PWA architecture, and
            functionality, is owned entirely by Academiyati System and is
            protected by copyright, trademark, and other intellectual property
            laws. You may not copy, modify, or create derivative works from the
            Service.
          </p>
        </>
      ),
    },
    {
      title: "6. Third-Party Services and Integrations",
      content: (
        <>
          <p className="my-2">
            Our Service relies on integrations with third-party platforms,
            specifically Zoom, to function effectively.
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              We do not control these third-party platforms and are not
              responsible for their uptime, performance, or changes to their
              APIs.
            </li>
            <li className="text-muted-foreground">
              If a third-party provider experiences an outage or restricts our
              API access, it may temporarily impact related features within My
              Academy System. We are not liable for any resulting interruptions
              or losses.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "7. Limitation of Liability",
      content: (
        <p className="my-2">
          To the maximum extent permitted by law, Academiyati System and its
          affiliates, directors, or employees shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages,
          including without limitation, loss of profits, data, use, or goodwill,
          resulting from: (a) Your access to or use of (or inability to access
          or use) the Service; (b) Any unauthorized access to our secure servers
          and/or any personal information stored therein; (c) Any bugs, viruses,
          or downtime transmitted to or through our Service by any third party.
        </p>
      ),
    },
    {
      title: "8. Disclaimer of Warranties",
      content: (
        <p className="my-2">
          The Service is provided on an &quot;AS IS&quot; and &quot;AS
          AVAILABLE&quot; basis. We make no warranties, expressed or implied,
          regarding the reliability, accuracy, or availability of the Service.
          We do not warrant that the Service will perfectly prevent all
          unauthorized interactions between tutors and students; the platform is
          a tool to mitigate risk, not a guarantee.
        </p>
      ),
    },
    {
      title: "9. Termination",
      content: (
        <>
          <p className="my-2">
            <strong>By You:</strong> You may cancel your subscription at any
            time by contacting our support team or through your account
            settings.
          </p>
          <p className="my-2">
            <strong>By Us:</strong> We reserve the right to suspend or terminate
            your account at our sole discretion, without notice, for conduct
            that we believe violates these Terms or is harmful to other users of
            the Service, to us, or to third parties.
          </p>
        </>
      ),
    },
    {
      title: "10. Governing Law",
      content: (
        <p className="my-2">
          These Terms shall be governed and construed in accordance with the
          laws of Egypt, without regard to its conflict of law provisions.
        </p>
      ),
    },
    {
      title: "11. Contact Information",
      content: (
        <>
          <p className="my-2">
            For any questions regarding these Terms of Service, please contact
            us at:
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
      title: "1. وصف الخدمة",
      content: (
        <p className="my-2">
          &quot;نظام أكاديميتي&quot; هي منصة برمجيات كخدمة (B2B SaaS) مصممة
          لمساعدة الأكاديميات التعليمية في إدارة عملياتها. تشمل الخدمة ميزات
          مثل: إدارة الطلاب والمعلمين، التحليلات المالية، الجدولة الزمنية،
          بوابات الاتصال الداخلية، والربط مع تطبيقات الطرف الثالث (مثل Zoom).
        </p>
      ),
    },
    {
      title: "2. تسجيل الحساب والمسؤولية",
      content: (
        <>
          <p className="my-2">
            <strong>إنشاء الحساب:</strong> لاستخدام الخدمة، يجب عليك التسجيل
            لإنشاء حساب إداري. أنت توافق على تقديم معلومات دقيقة وحديثة وكاملة
            أثناء عملية التسجيل.
          </p>
          <p className="my-2">
            <strong>المستخدمون المصرح لهم:</strong> يتحمل العميل المسؤولية
            الكاملة عن جميع الأنشطة التي تحدث تحت حسابه، بما في ذلك تصرفات أي من
            المعلمين أو الموظفين أو الطلاب الذين يصرح لهم العميل بالوصول إلى
            الخدمة (&quot;المستخدمون النهائيون&quot;).
          </p>
          <p className="my-2">
            <strong>النزاعات مع المستخدمين النهائيين:</strong> نحن نقدم الأدوات
            البرمجية لإدارة أكاديميتك، بما في ذلك أنظمة الاتصال الداخلية. ومع
            ذلك، نحن لسنا طرفاً في أي اتفاقيات بين الأكاديمية ومعلميها أو
            طلابها. أي نزاعات تتعلق بالمدفوعات، أو تسريب الطلاب، أو الملكية
            الفكرية، أو خرق العقود بين الأكاديمية والمستخدمين النهائيين هي
            مسؤولية الأكاديمية وحدها.
          </p>
        </>
      ),
    },
    {
      title: "3. الاشتراكات والرسوم والمدفوعات",
      content: (
        <>
          <p className="my-2">
            <strong>فئات الاشتراك:</strong> يعتمد الوصول إلى ميزات معينة (مثل
            بوابة الاتصال أو الإعداد المتكامل للبيانات) على فئة الاشتراك التي
            تختارها.
          </p>
          <p className="my-2">
            <strong>الفوترة:</strong> يتم تحصيل الرسوم مقدماً على أساس شهري.
            جميع المدفوعات غير قابلة للاسترداد ما لم يُنص على خلاف ذلك كتابياً.
          </p>
          <p className="my-2">
            <strong>تغيير الرسوم:</strong> نحتفظ بالحق في تغيير أسعارنا بعد
            تقديم إشعار مسبق لا يقل عن 30 يوماً. استمرارك في استخدام الخدمة بعد
            سريان تغيير الأسعار يُعد موافقة منك على دفع الرسوم المعدلة.
          </p>
        </>
      ),
    },
    {
      title: "4. سياسة الاستخدام المقبول",
      content: (
        <>
          <p className="my-2">
            توافق أنت والمستخدمون النهائيون التابعون لك على عدم:
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              استخدام الخدمة لأي غرض غير قانوني أو غير مصرح به أو احتيالي.
            </li>
            <li className="text-muted-foreground">
              التدخل في أو الإخلال بسلامة أو أداء الخدمة.
            </li>
            <li className="text-muted-foreground">
              محاولة الوصول غير المصرح به إلى الخدمة، أو إلى حسابات أخرى، أو
              الأنظمة الأساسية.
            </li>
            <li className="text-muted-foreground">
              رفع أو نقل أي تعليمات برمجية ضارة، أو فيروسات، أو محتوى غير
              قانوني.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. البيانات وحقوق الملكية الفكرية",
      content: (
        <>
          <p className="my-2">
            <strong>بياناتك:</strong> يحتفظ العميل بجميع حقوق الملكية للبيانات
            التي يتم إدخالها في النظام (بما في ذلك قوائم الطلاب، والسجلات
            المالية، والجداول). باستخدامك للخدمة، فإنك تمنحنا ترخيصاً عالمياً
            ومحدوداً لاستضافة ونسخ ومعالجة هذه البيانات حصرياً لغرض تقديم الخدمة
            لك.
          </p>
          <p className="my-2">
            <strong>ملكيتنا الفكرية:</strong> الخدمة، بما في ذلك الكود الأصلي،
            والتصميم، والميزات، وهيكلية تطبيق (PWA)، والوظائف، مملوكة بالكامل لـ
            &quot;نظام أكاديميتي&quot; ومحمية بقوانين حقوق الطبع والنشر
            والعلامات التجارية وغيرها من قوانين الملكية الفكرية. لا يجوز لك نسخ
            الخدمة أو تعديلها أو إنشاء أعمال مشتقة منها.
          </p>
        </>
      ),
    },
    {
      title: "6. خدمات الطرف الثالث والربط الإلكتروني",
      content: (
        <>
          <p className="my-2">
            تعتمد خدمتنا على الربط مع منصات خارجية، وتحديداً Zoom، لتعمل بشكل
            فعال.
          </p>
          <ul className="list-disc pr-6 mr-4 space-y-1">
            <li className="text-muted-foreground">
              نحن لا نتحكم في هذه المنصات الخارجية ولسنا مسؤولين عن وقت تشغيلها
              أو أدائها أو التغييرات في واجهات برمجة التطبيقات (APIs) الخاصة
              بها.
            </li>
            <li className="text-muted-foreground">
              إذا واجه مزود الخدمة الخارجي انقطاعاً أو قيّد وصولنا إلى واجهة
              برمجة التطبيقات، فقد يؤثر ذلك مؤقتاً على الميزات ذات الصلة داخل
              &quot;نظام أكاديميتي&quot;. نحن لا نتحمل المسؤولية عن أي انقطاعات
              أو خسائر ناتجة عن ذلك.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "7. حدود المسؤولية",
      content: (
        <p className="my-2">
          إلى أقصى حد يسمح به القانون، لا تتحمل منصة &quot;نظام أكاديميتي&quot;
          أو الشركات التابعة لها أو مديروها أو موظفوها المسؤولية عن أي أضرار غير
          مباشرة أو عرضية أو خاصة أو تبعية أو تأديبية، بما في ذلك على سبيل
          المثال لا الحصر، خسارة الأرباح أو البيانات أو الاستخدام أو السمعة
          التجارية، والناتجة عن: (أ) وصولك إلى الخدمة أو استخدامك لها (أو عدم
          قدرتك على الوصول إليها أو استخدامها)؛ (ب) أي وصول غير مصرح به إلى
          خوادمنا الآمنة و/أو أي معلومات شخصية مخزنة فيها؛ (ج) أي أعطال برمجية،
          أو فيروسات، أو فترات توقف تنتقل إلى أو عبر خدمتنا بواسطة أي طرف ثالث.
        </p>
      ),
    },
    {
      title: "8. إخلاء المسؤولية من الضمانات",
      content: (
        <p className="my-2">
          تُقدم الخدمة على أساس &quot;كما هي&quot; (AS IS) و&quot;كما هي
          متوفرة&quot; (AS AVAILABLE). نحن لا نقدم أي ضمانات، صريحة أو ضمنية،
          فيما يتعلق بموثوقية الخدمة أو دقتها أو توفرها. نحن لا نضمن أن الخدمة
          ستمنع بشكل مثالي وكامل جميع التفاعلات غير المصرح بها بين المعلمين
          والطلاب؛ المنصة هي أداة لتقليل المخاطر وليست ضماناً قاطعاً.
        </p>
      ),
    },
    {
      title: "9. إنهاء الخدمة",
      content: (
        <>
          <p className="my-2">
            <strong>من قبلك:</strong> يمكنك إلغاء اشتراكك في أي وقت عن طريق
            الاتصال بفريق الدعم أو من خلال إعدادات حسابك.
          </p>
          <p className="my-2">
            <strong>من قبلنا:</strong> نحتفظ بالحق في تعليق أو إنهاء حسابك وفقاً
            لتقديرنا الخاص، دون إشعار مسبق، في حال رصد أي سلوك نعتقد أنه ينتهك
            هذه الشروط أو يضر بمستخدمين آخرين للخدمة، أو بنا، أو بأطراف ثالثة.
          </p>
        </>
      ),
    },
    {
      title: "10. القانون المعمول به",
      content: (
        <p className="my-2">
          تخضع هذه الشروط وتُفسر وفقاً لقوانين جمهورية مصر العربية، دون اعتبار
          لتعارضها مع أحكام وقوانين أخرى.
        </p>
      ),
    },
    {
      title: "11. معلومات الاتصال",
      content: (
        <>
          <p className="my-2">
            لأي أسئلة بخصوص شروط الخدمة هذه، يُرجى التواصل معنا عبر:
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
                {locale === "ar" ? "شروط الخدمة" : "Terms of Service"}
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
