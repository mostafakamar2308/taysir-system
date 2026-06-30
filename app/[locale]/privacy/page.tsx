import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { getTranslations } from "next-intl/server";

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

  // ===== ENGLISH SECTIONS =====
  const englishSections = [
    {
      title: "1. Our Role in Data Processing",
      content: (
        <>
          <p className="my-2">
            Academiyati System provides integrated management tools for online
            educational academies. In this context:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>The Academy (our client):</strong> Is considered the
              actual owner of the student and teacher data. It is the entity
              that determines what data is collected, why it is collected, and
              how it is used. Legally, it is referred to as the{" "}
              <strong>Data Controller</strong>.
            </li>
            <li className="text-muted-foreground">
              <strong>Academiyati System:</strong> We provide the technical
              infrastructure to manage this data, processing it only on behalf
              of the Academy to deliver the service. Legally, we are referred to
              as the <strong>Data Processor</strong>.
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
            We may collect information from three main sources:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Information you provide directly to us
            </li>
            <li className="text-muted-foreground">
              Information entered into the platform
            </li>
            <li className="text-muted-foreground">
              Technical data generated from using the service
            </li>
          </ul>

          <p className="font-semibold mt-4">
            A. Information of Academy Administrators:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Identity and contact:</strong> Name, email, phone number,
              billing and payment data, academy settings data.
            </li>
            <li className="text-muted-foreground">
              <strong>Operational data:</strong> Schedules, subscriptions,
              salaries, financial reports, class settings, and other
              administrative inputs.
            </li>
          </ul>

          <p className="font-semibold mt-4">
            B. Information of Students and Teachers:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Account data:</strong> Name, email, phone or social media
              contact details.
            </li>
            <li className="text-muted-foreground">
              <strong>Educational data:</strong> Attendance records, performance
              reports, session logs, subscriptions, packages.
            </li>
            <li className="text-muted-foreground">
              <strong>Communications:</strong> Messages, notifications, and
              communications made through the system or through supported
              integration channels.
            </li>
          </ul>

          <p className="font-semibold mt-4">C. Technical and Usage Data:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>Automatically collected:</strong> IP address, browser
              type, operating system, error logs, performance data, and usage
              patterns within the platform.
            </li>
          </ul>
          <p className="my-2">
            This data is used to improve performance, security, and user
            experience.
          </p>
        </>
      ),
    },
    {
      title: "3. Integration with External Systems",
      content: (
        <>
          <p className="my-2">
            Academiyati System may integrate with external services to
            facilitate the educational process, including:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Zoom</li>
            <li className="text-muted-foreground">Notification services</li>
            <li className="text-muted-foreground">Messaging services</li>
          </ul>
          <p className="font-semibold mt-4">For Zoom integration:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              We may collect and process meeting links and session information
              necessary to operate the service.
            </li>
            <li className="text-muted-foreground">
              We do not record audio or video on our servers by default. Any
              recordings made through Zoom are also subject to Zoom’s own
              policies.
            </li>
          </ul>
          <p className="my-2">
            Your use of external services is also governed by the privacy
            policies of those service providers.
          </p>
        </>
      ),
    },
    {
      title: "4. How We Use the Information",
      content: (
        <>
          <p className="my-2">
            We use data only to operate and improve the system. This includes:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Creating and managing accounts
            </li>
            <li className="text-muted-foreground">
              Managing schedules and classes
            </li>
            <li className="text-muted-foreground">
              Calculating subscriptions and finances
            </li>
            <li className="text-muted-foreground">Calculating salaries</li>
            <li className="text-muted-foreground">Generating reports</li>
            <li className="text-muted-foreground">
              Sending reminders and notifications
            </li>
            <li className="text-muted-foreground">
              Operating internal communication portals
            </li>
            <li className="text-muted-foreground">
              Improving performance and user experience
            </li>
            <li className="text-muted-foreground">
              Detecting fraudulent or unauthorised activities
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. How We Share Information",
      content: (
        <>
          <p className="my-2">
            We do not sell, rent, or trade your personal data. Data may be
            shared only in the following cases:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              <strong>With the Academy:</strong> Students and teachers should be
              aware that the academy administration has access to data
              associated with the academy, including profiles, attendance,
              classes, reports, and subscriptions.
            </li>
            <li className="text-muted-foreground">
              <strong>With Service Providers:</strong> We may engage trusted
              service providers to help operate the system, such as cloud
              hosting, backup, and notification services, under appropriate
              contractual and security controls.
            </li>
            <li className="text-muted-foreground">
              <strong>Legal Compliance:</strong> We may disclose data if
              required by law, such as court orders, regulatory obligations, or
              official government requests.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "6. Data Security and Protection",
      content: (
        <>
          <p className="my-2">
            We consider protecting academy data a fundamental responsibility.
            Therefore, we implement multiple technical and administrative
            controls to minimise the risk of data loss or unauthorised access.
          </p>
          <p className="font-semibold mt-4">A. Secure Hosting</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              System data is stored on secure VPS servers within a hardened
              operating environment, with regular security updates and
              maintenance.
            </li>
          </ul>
          <p className="font-semibold mt-4">B. Data Isolation</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Each academy’s data is logically isolated within the system so
              that no academy can access another academy’s data.
            </li>
          </ul>
          <p className="font-semibold mt-4">C. Access Control</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Access to data within the system is governed by specific
              permissions based on the user’s role (e.g., academy admin,
              supervisor, teacher, student).
            </li>
            <li className="text-muted-foreground">
              Within the Academiyati System team, access to operational data is
              restricted to the minimum necessary.
            </li>
            <li className="text-muted-foreground">
              The system owner may have general administrative privileges to
              monitor system health and diagnose faults, but these privileges
              are not used to access sensitive detailed data except for
              legitimate technical necessity.
            </li>
          </ul>
          <p className="font-semibold mt-4">D. Encryption of Sensitive Data</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              We encrypt sensitive data where appropriate, especially data that
              could affect user privacy (such as sensitive contact details).
            </li>
            <li className="text-muted-foreground">
              Data transmission is secured using encrypted communication
              protocols such as HTTPS and TLS.
            </li>
          </ul>
          <p className="font-semibold mt-4">E. Backup</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              We create weekly backups to minimise the risk of data loss due to
              failures or unexpected incidents. Backups are used only for
              disaster recovery purposes.
            </li>
          </ul>
          <p className="font-semibold mt-4">F. System Monitoring</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              We monitor system logs and operational activities to detect
              unauthorised access attempts, abnormal activities, and potential
              security breaches.
            </li>
          </ul>
          <p className="font-semibold mt-4">G. Security Incident Reporting</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              In the event of a security incident that materially affects the
              confidentiality or integrity of data, we will endeavour to notify
              the affected academy within a reasonable time after detection.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "7. Data Retention",
      content: (
        <>
          <p className="my-2">
            We retain data only for as long as necessary to provide the service
            or to comply with legal requirements.
          </p>
          <p className="my-2">
            If an academy cancels its account, the associated data will be
            either deleted or anonymised, typically within 30 days of account
            termination, unless legal obligations require longer retention.
          </p>
        </>
      ),
    },
    {
      title: "8. User Rights",
      content: (
        <>
          <p className="my-2">
            Depending on the laws applicable in your geographic area, you may
            have certain rights regarding your data, such as:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Access to your data</li>
            <li className="text-muted-foreground">Modification</li>
            <li className="text-muted-foreground">Correction</li>
            <li className="text-muted-foreground">Request deletion</li>
          </ul>
          <p className="font-semibold mt-4">Students and Teachers</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Since we process data on behalf of the academy, data requests
              should be directed first to the academy administration.
            </li>
          </ul>
          <p className="font-semibold mt-4">Academy Administrators</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              You can update or delete your account data through system settings
              or by contacting us.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "9. Cookies",
      content: (
        <>
          <p className="my-2">
            We may use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Improve performance</li>
            <li className="text-muted-foreground">Maintain sessions</li>
            <li className="text-muted-foreground">Enhance user experience</li>
            <li className="text-muted-foreground">Analyse usage</li>
          </ul>
          <p className="my-2">
            You can disable cookies from your browser settings, but this may
            affect some platform functions.
          </p>
        </>
      ),
    },
    {
      title: "10. Changes to This Privacy Policy",
      content: (
        <>
          <p className="my-2">
            We may update this Privacy Policy from time to time. When we make
            material changes, we will notify users via:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">The platform</li>
            <li className="text-muted-foreground">Email</li>
            <li className="text-muted-foreground">Updating this page</li>
          </ul>
          <p className="my-2">
            The “Last Updated” date at the top of the page will always be
            updated accordingly.
          </p>
        </>
      ),
    },
    {
      title: "11. Contact Us",
      content: (
        <>
          <p className="my-2">
            If you have any questions or concerns about this Privacy Policy or
            data protection, you can contact us via:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Email: academiyatisystem@gmail.com
            </li>
            <li className="text-muted-foreground">Phone: +20 1011214517</li>
          </ul>
        </>
      ),
    },
  ];

  // ===== ARABIC SECTIONS (new content) =====
  const arabicSections = [
    {
      title: "1. دورنا في معالجة البيانات",
      content: (
        <>
          <p className="my-2">
            يقدم نظام أكاديميتي أدوات تشغيل وإدارة متكاملة للأكاديميات التعليمية
            الأونلاين. في هذا السياق:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              <strong>الأكاديمية (عميلنا):</strong> تُعتبر الأكاديمية المالكة
              الفعلية لبيانات الطلاب والمعلمين، وهي الجهة التي تحدد ما البيانات
              التي يتم جمعها، ولماذا يتم جمعها، وكيف يتم استخدامها. ويُشار إليها
              قانونيًا بـ <strong>مراقب البيانات</strong> (Data Controller).
            </li>
            <li className="text-muted-foreground">
              <strong>نظام أكاديميتي:</strong> نحن نوفر البنية التقنية اللازمة
              لإدارة هذه البيانات، ونعالجها فقط نيابة عن الأكاديمية بهدف تقديم
              الخدمة. ويُشار إلينا قانونيًا بـ <strong>معالج البيانات</strong>{" "}
              (Data Processor).
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "2. المعلومات التي نجمعها",
      content: (
        <>
          <p className="my-2">قد نقوم بجمع المعلومات من ثلاثة مصادر رئيسية:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              المعلومات التي تقدمها لنا مباشرة
            </li>
            <li className="text-muted-foreground">
              المعلومات التي تُدخل داخل المنصة
            </li>
            <li className="text-muted-foreground">
              البيانات التقنية الناتجة عن استخدام الخدمة
            </li>
          </ul>

          <p className="font-semibold mt-4">أ. معلومات مديري الأكاديمية:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              <strong>الهوية والتواصل:</strong> الاسم، البريد الإلكتروني، رقم
              الهاتف، بيانات الفواتير والدفع، بيانات إعدادات الأكاديمية.
            </li>
            <li className="text-muted-foreground">
              <strong>البيانات التشغيلية:</strong> الجداول، الاشتراكات، الرواتب،
              التقارير المالية، إعدادات الحصص، وغيرها من المدخلات الإدارية.
            </li>
          </ul>

          <p className="font-semibold mt-4">ب. معلومات الطلاب والمعلمين:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              <strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، رقم
              الهاتف أو وسائل التواصل.
            </li>
            <li className="text-muted-foreground">
              <strong>البيانات التعليمية:</strong> سجلات الحضور، تقارير الأداء،
              سجلات الحصص، الاشتراكات والباقات.
            </li>
            <li className="text-muted-foreground">
              <strong>بيانات التواصل:</strong> الرسائل والتنبيهات والاتصالات
              التي تتم من خلال النظام أو من خلال وسائل الربط المدعومة.
            </li>
          </ul>

          <p className="font-semibold mt-4">ج. البيانات التقنية والاستخدام:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              <strong>يتم جمعها تلقائيًا:</strong> عنوان IP، نوع المتصفح، نظام
              التشغيل، سجل الأخطاء، بيانات الأداء، أنماط الاستخدام داخل المنصة.
            </li>
          </ul>
          <p className="my-2">
            تُستخدم هذه البيانات لتحسين الأداء والأمان وتجربة الاستخدام.
          </p>
        </>
      ),
    },
    {
      title: "3. الربط مع الأنظمة الخارجية",
      content: (
        <>
          <p className="my-2">
            قد يتكامل نظام أكاديميتي مع خدمات خارجية لتسهيل العملية التعليمية،
            ويشمل ذلك خدمات مثل:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">Zoom</li>
            <li className="text-muted-foreground">خدمات الإشعارات</li>
            <li className="text-muted-foreground">خدمات الرسائل</li>
          </ul>
          <p className="font-semibold mt-4">بالنسبة لتكامل Zoom:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              قد نقوم بجمع ومعالجة روابط الاجتماعات ومعلومات الجلسات اللازمة
              لتشغيل الخدمة.
            </li>
            <li className="text-muted-foreground">
              لا نقوم بتسجيل الصوت أو الفيديو على خوادمنا بشكل افتراضي. أي
              تسجيلات تتم عبر Zoom تخضع أيضًا لسياسات Zoom الخاصة.
            </li>
          </ul>
          <p className="my-2">
            استخدامك للخدمات الخارجية يخضع كذلك لسياسات الخصوصية الخاصة بمزودي
            تلك الخدمات.
          </p>
        </>
      ),
    },
    {
      title: "4. كيف نستخدم المعلومات",
      content: (
        <>
          <p className="my-2">
            نستخدم البيانات فقط لتشغيل وتحسين النظام. يشمل ذلك:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">إنشاء الحسابات وإدارتها</li>
            <li className="text-muted-foreground">إدارة الجداول والحصص</li>
            <li className="text-muted-foreground">حساب الاشتراكات والماليات</li>
            <li className="text-muted-foreground">حساب الرواتب</li>
            <li className="text-muted-foreground">إصدار التقارير</li>
            <li className="text-muted-foreground">
              إرسال التذكيرات والتنبيهات
            </li>
            <li className="text-muted-foreground">
              تشغيل بوابات التواصل الداخلية
            </li>
            <li className="text-muted-foreground">
              تحسين الأداء وتجربة الاستخدام
            </li>
            <li className="text-muted-foreground">
              اكتشاف الأنشطة الاحتيالية أو غير المصرح بها
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. كيف نشارك المعلومات",
      content: (
        <>
          <p className="my-2">
            نحن لا نبيع أو نؤجر أو نتاجر ببياناتك الشخصية. قد تتم مشاركة
            البيانات فقط في الحالات التالية:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              <strong>مع الأكاديمية:</strong> يجب على الطلاب والمعلمين إدراك أن
              إدارة الأكاديمية لديها صلاحية الوصول إلى البيانات المرتبطة
              بالأكاديمية، بما في ذلك الملفات الشخصية، الحضور، الحصص، التقارير،
              والاشتراكات.
            </li>
            <li className="text-muted-foreground">
              <strong>مع مزودي الخدمات:</strong> قد نتعامل مع مزودي خدمات
              موثوقين للمساعدة في تشغيل النظام، مثل خدمات الاستضافة السحابية،
              خدمات النسخ الاحتياطي، خدمات الإشعارات، وذلك ضمن ضوابط تعاقدية
              وأمنية مناسبة.
            </li>
            <li className="text-muted-foreground">
              <strong>الامتثال القانوني:</strong> قد نفصح عن بيانات إذا كان ذلك
              مطلوبًا قانونيًا، مثل أوامر قضائية، التزامات تنظيمية، طلبات حكومية
              رسمية.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "6. أمن البيانات وحمايتها",
      content: (
        <>
          <p className="my-2">
            نعتبر حماية بيانات الأكاديميات مسؤولية أساسية، لذلك نطبق ضوابط تقنية
            وإدارية متعددة لتقليل مخاطر فقدان البيانات أو الوصول غير المصرح به.
          </p>
          <p className="font-semibold mt-4">أ. الاستضافة الآمنة</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              يتم تخزين بيانات النظام على خوادم افتراضية خاصة (Secure VPS) ضمن
              بيئة تشغيل مؤمنة، مع تحديثات أمنية وصيانة دورية.
            </li>
          </ul>
          <p className="font-semibold mt-4">ب. عزل بيانات الأكاديميات</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              يتم عزل بيانات كل أكاديمية منطقيًا داخل النظام بحيث لا يمكن لأي
              أكاديمية الوصول إلى بيانات أكاديمية أخرى.
            </li>
          </ul>
          <p className="font-semibold mt-4">ج. التحكم في صلاحيات الوصول</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              الوصول إلى البيانات داخل النظام يخضع لصلاحيات محددة حسب دور
              المستخدم (مثل: مدير الأكاديمية، المشرف، المعلم، الطالب).
            </li>
            <li className="text-muted-foreground">
              داخل فريق نظام أكاديميتي، يتم تقييد الوصول للبيانات التشغيلية لأقل
              حد ممكن.
            </li>
            <li className="text-muted-foreground">
              مالك النظام قد يمتلك صلاحيات إدارية عامة لمراقبة سلامة النظام
              وتشخيص الأعطال، لكن لا يتم استخدام هذه الصلاحيات للوصول إلى
              البيانات التفصيلية الحساسة إلا عند الضرورة الفنية المشروعة.
            </li>
          </ul>
          <p className="font-semibold mt-4">د. تشفير البيانات الحساسة</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              نقوم بتشفير البيانات الحساسة حيثما كان ذلك مناسبًا، خاصة البيانات
              التي قد تؤثر على خصوصية المستخدمين (مثل بيانات التواصل الحساسة).
            </li>
            <li className="text-muted-foreground">
              كما يتم تأمين نقل البيانات باستخدام بروتوكولات اتصال مشفرة مثل
              HTTPS و TLS.
            </li>
          </ul>
          <p className="font-semibold mt-4">هـ. النسخ الاحتياطي</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              نقوم بإنشاء نسخ احتياطية أسبوعية (Weekly Backups) بهدف تقليل مخاطر
              فقدان البيانات نتيجة الأعطال أو الحوادث غير المتوقعة. تُستخدم
              النسخ الاحتياطية فقط لأغراض الاستعادة في حالات الطوارئ.
            </li>
          </ul>
          <p className="font-semibold mt-4">و. مراقبة النظام</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              نراقب سجلات النظام والأنشطة التشغيلية لاكتشاف محاولات الوصول غير
              المصرح بها، الأنشطة غير الطبيعية، والأعطال الأمنية المحتملة.
            </li>
          </ul>
          <p className="font-semibold mt-4">ز. الإبلاغ عن الحوادث الأمنية</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              في حال وقوع حادث أمني قد يؤثر جوهريًا على سرية البيانات أو
              سلامتها، سنسعى لإخطار الأكاديمية المتأثرة خلال فترة زمنية معقولة
              بعد اكتشاف الحادث.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "7. الاحتفاظ بالبيانات",
      content: (
        <>
          <p className="my-2">
            نحتفظ بالبيانات فقط طوال المدة اللازمة لتقديم الخدمة أو للامتثال
            للمتطلبات القانونية.
          </p>
          <p className="my-2">
            في حال إلغاء الأكاديمية لحسابها: قد يتم حذف البيانات المرتبطة بها أو
            إخفاء هوية البيانات (Anonymization)، وذلك عادة خلال 30 يومًا من
            إنهاء الحساب، ما لم توجد التزامات قانونية تستوجب الاحتفاظ بها لفترة
            أطول.
          </p>
        </>
      ),
    },
    {
      title: "8. حقوق المستخدم",
      content: (
        <>
          <p className="my-2">
            بحسب القوانين المطبقة في منطقتك الجغرافية، قد تكون لديك حقوق معينة
            فيما يتعلق ببياناتك، مثل:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">الوصول إلى بياناتك</li>
            <li className="text-muted-foreground">تعديلها</li>
            <li className="text-muted-foreground">تصحيحها</li>
            <li className="text-muted-foreground">طلب حذفها</li>
          </ul>
          <p className="font-semibold mt-4">الطلاب والمعلمون:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              نظرًا لأننا نعالج البيانات نيابة عن الأكاديمية، يجب توجيه طلبات
              البيانات أولًا إلى إدارة الأكاديمية.
            </li>
          </ul>
          <p className="font-semibold mt-4">مدراء الأكاديميات:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              يمكنكم تحديث أو حذف بيانات حسابكم عبر إعدادات النظام أو بالتواصل
              معنا.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "9. ملفات تعريف الارتباط (Cookies)",
      content: (
        <>
          <p className="my-2">
            قد نستخدم ملفات تعريف الارتباط وتقنيات مشابهة من أجل:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">تحسين الأداء</li>
            <li className="text-muted-foreground">حفظ الجلسات</li>
            <li className="text-muted-foreground">تحسين تجربة المستخدم</li>
            <li className="text-muted-foreground">تحليل الاستخدام</li>
          </ul>
          <p className="my-2">
            يمكنك تعطيل ملفات تعريف الارتباط من إعدادات المتصفح، لكن قد يؤثر ذلك
            على بعض وظائف المنصة.
          </p>
        </>
      ),
    },
    {
      title: "10. التغييرات على سياسة الخصوصية",
      content: (
        <>
          <p className="my-2">
            قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. عند إجراء تغييرات جوهرية،
            سنقوم بإشعار المستخدمين عبر:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">المنصة</li>
            <li className="text-muted-foreground">البريد الإلكتروني</li>
            <li className="text-muted-foreground">تحديث هذه الصفحة</li>
          </ul>
          <p className="my-2">ويتم دائمًا تحديث تاريخ آخر تحديث أعلى الصفحة.</p>
        </>
      ),
    },
    {
      title: "11. التواصل معنا",
      content: (
        <>
          <p className="my-2">
            إذا كانت لديك أي أسئلة أو استفسارات حول سياسة الخصوصية أو حماية
            البيانات، يمكنك التواصل معنا عبر:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              البريد الإلكتروني: academiyatisystem@gmail.com
            </li>
            <li className="text-muted-foreground">الهاتف: +20 1011214517</li>
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
                  ? "سياسة الخصوصية لنظام أكاديميتي (Academiyati System)"
                  : "Privacy Policy for Academiyati System"}
              </h1>
              <p className="text-muted-foreground">
                {locale === "ar"
                  ? "آخر تحديث: 29 مايو 2026"
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
