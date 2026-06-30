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

  // ===== ENGLISH SECTIONS (updated to match new Arabic content) =====
  const englishSections = [
    {
      title: "1. Description of Service",
      content: (
        <>
          <p className="my-2">
            &quot;Academiyati System&quot; is a software‑as‑a‑service (SaaS)
            platform designed to help educational academies manage and operate
            their daily operations more efficiently.
          </p>
          <p className="my-2">The Service includes, but is not limited to:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Student and teacher management
            </li>
            <li className="text-muted-foreground">
              Attendance tracking and scheduling
            </li>
            <li className="text-muted-foreground">
              Financial reporting and collection
            </li>
            <li className="text-muted-foreground">
              Internal communication tools
            </li>
            <li className="text-muted-foreground">
              Integration with external services such as Zoom
            </li>
            <li className="text-muted-foreground">
              Additional features that may be launched or developed in the
              future
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "2. Registration, Accounts, and Client Responsibility",
      content: (
        <>
          <p className="font-semibold mt-4">Account Creation</p>
          <p className="my-2">
            To use the Service, you must create an administrative account and
            provide accurate, up‑to‑date, and complete information.
          </p>

          <p className="font-semibold mt-4">Account Responsibility</p>
          <p className="my-2">
            The Client bears full responsibility for all activities that occur
            under their account, including activities performed by teachers,
            staff, or students authorised to use the system.
          </p>

          <p className="font-semibold mt-4">
            Password and Permission Responsibility
          </p>
          <p className="my-2">The Client is responsible for:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Maintaining the confidentiality of login credentials
            </li>
            <li className="text-muted-foreground">
              Managing access permissions for their subordinate users
            </li>
            <li className="text-muted-foreground">
              Revoking permissions for unauthorised users when necessary
            </li>
          </ul>
          <p className="my-2">
            Any use resulting from sharing login details or mismanagement of
            permissions falls under the Client&apos;s responsibility.
          </p>

          <p className="font-semibold mt-4">Disputes with End Users</p>
          <p className="my-2">
            Academiyati System provides management tools for the academy only
            and is not a party to agreements or disputes between the academy and
            its teachers or students.
          </p>
          <p className="my-2">This includes, for example:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Payment disputes</li>
            <li className="text-muted-foreground">Student poaching</li>
            <li className="text-muted-foreground">Breach of contracts</li>
            <li className="text-muted-foreground">
              Disputes related to intellectual property
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "3. Subscriptions and Payments",
      content: (
        <>
          <p className="font-semibold mt-4">Subscription</p>
          <p className="my-2">
            The available features depend on the plan to which the Client
            subscribes.
          </p>

          <p className="font-semibold mt-4">Billing</p>
          <p className="my-2">
            Subscription fees are billed in advance on a monthly basis or
            according to the agreed plan.
          </p>

          <p className="font-semibold mt-4">Overdue Payment Policy</p>
          <p className="my-2">
            In the event of late payment, we reserve the right to:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Send payment reminders</li>
            <li className="text-muted-foreground">
              Temporarily suspend some or all Service features
            </li>
            <li className="text-muted-foreground">
              Restrict account access until outstanding amounts are settled
            </li>
          </ul>
          <p className="my-2">
            We may grant a grace period at our discretion before full
            suspension.
          </p>

          <p className="font-semibold mt-4">Refunds</p>
          <p className="my-2">
            Payments for used periods are non‑refundable. However, we may
            consider exceptional refund requests at our sole discretion.
          </p>

          <p className="font-semibold mt-4">Price Changes</p>
          <p className="my-2">
            We reserve the right to change pricing with at least 30 days&apos;
            prior notice. Continued use of the Service after the new prices take
            effect constitutes acceptance.
          </p>
        </>
      ),
    },
    {
      title: "4. Acceptable Use",
      content: (
        <>
          <p className="my-2">
            The Client and its authorised users agree not to:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Use the Service for any illegal or fraudulent purpose
            </li>
            <li className="text-muted-foreground">
              Attempt unauthorised access to systems or other accounts
            </li>
            <li className="text-muted-foreground">
              Disrupt or impair the performance of the Service
            </li>
            <li className="text-muted-foreground">
              Upload or send malicious software or illegal content
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. Data and Intellectual Property",
      content: (
        <>
          <p className="font-semibold mt-4">Client Data Ownership</p>
          <p className="my-2">
            The Client retains full ownership rights to all data entered into
            the system, including:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Student data</li>
            <li className="text-muted-foreground">Teacher data</li>
            <li className="text-muted-foreground">Financial records</li>
            <li className="text-muted-foreground">Schedules and reports</li>
          </ul>
          <p className="my-2">
            By using the Service, the Client grants Academiyati System a limited
            licence to process this data solely for the purpose of providing and
            operating the Service.
          </p>

          <p className="font-semibold mt-4">Data Export Rights</p>
          <p className="my-2">
            Upon subscription termination, the Client has the right to request
            an exportable copy of their data (e.g., Excel or CSV) within a
            period not exceeding 30 days from the cancellation date.
          </p>

          <p className="font-semibold mt-4">Our Intellectual Property</p>
          <p className="my-2">
            All intellectual property rights related to the system, including:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Source code</li>
            <li className="text-muted-foreground">Design</li>
            <li className="text-muted-foreground">Technical architecture</li>
            <li className="text-muted-foreground">User interfaces</li>
            <li className="text-muted-foreground">Trademarks</li>
          </ul>
          <p className="my-2">
            are fully owned by Academiyati System. Copying, reselling, or
            modifying the system without prior written permission is prohibited.
          </p>
        </>
      ),
    },
    {
      title: "6. Security and Data Protection",
      content: (
        <>
          <p className="my-2">
            We are committed to implementing reasonable technical and
            administrative measures to protect client data.
          </p>
          <p className="my-2">This includes:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Hosting data on secure VPS servers
            </li>
            <li className="text-muted-foreground">
              Logically isolating each academy&apos;s data from others
            </li>
            <li className="text-muted-foreground">
              Encrypting sensitive data such as contact information
            </li>
            <li className="text-muted-foreground">Regular backups</li>
            <li className="text-muted-foreground">
              Restricting administrative access to data
            </li>
          </ul>
          <p className="my-2">
            Internal administrative access to data is limited to what is
            necessary to operate the platform, provide customer support, or
            address technical issues. Nevertheless, no electronic system can be
            100% secure.
          </p>
        </>
      ),
    },
    {
      title: "7. Third‑Party Services",
      content: (
        <>
          <p className="my-2">
            Some platform features may rely on external services such as Zoom.
          </p>
          <p className="my-2">
            We do not control these services and are not responsible for:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Their failures</li>
            <li className="text-muted-foreground">Downtime</li>
            <li className="text-muted-foreground">Changes to their APIs</li>
            <li className="text-muted-foreground">
              Restrictions they may impose in the future
            </li>
          </ul>
          <p className="my-2">
            Any interruption from these services may temporarily affect certain
            features.
          </p>
        </>
      ),
    },
    {
      title: "8. Beta Features",
      content: (
        <>
          <p className="my-2">
            We may offer some features in a beta stage. These features may:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Change</li>
            <li className="text-muted-foreground">Be improved</li>
            <li className="text-muted-foreground">Be discontinued</li>
            <li className="text-muted-foreground">
              Contain temporary limitations
            </li>
          </ul>
          <p className="my-2">
            Using beta features implies acceptance of their developmental
            nature.
          </p>
        </>
      ),
    },
    {
      title: "9. Service Availability and Maintenance",
      content: (
        <>
          <p className="my-2">
            We strive to provide the Service with the highest possible stability
            and reliability.
          </p>
          <p className="my-2">Occasionally, we may need to perform:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Scheduled maintenance</li>
            <li className="text-muted-foreground">Technical updates</li>
            <li className="text-muted-foreground">
              Infrastructure improvements
            </li>
          </ul>
          <p className="my-2">
            These may result in temporary service interruptions. We will try to
            give as much prior notice as possible.
          </p>
        </>
      ),
    },
    {
      title: "10. Limitation of Liability",
      content: (
        <>
          <p className="my-2">
            To the maximum extent permitted by law, Academiyati System, its
            employees, or partners shall not be liable for any indirect,
            incidental, or consequential damages, including:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Loss of profits</li>
            <li className="text-muted-foreground">Loss of data</li>
            <li className="text-muted-foreground">Loss of use</li>
            <li className="text-muted-foreground">Commercial damages</li>
          </ul>
          <p className="my-2">This includes damages arising from:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">
              Use of the Service or inability to use it
            </li>
            <li className="text-muted-foreground">
              Unauthorised access to the systems
            </li>
            <li className="text-muted-foreground">Software failures</li>
            <li className="text-muted-foreground">External interruptions</li>
          </ul>
        </>
      ),
    },
    {
      title: "11. Disclaimer of Warranties",
      content: (
        <>
          <p className="my-2">
            The Service is provided on an &quot;AS IS&quot; and &quot;AS
            AVAILABLE&quot; basis. We make no express or implied warranty that
            the Service will completely prevent all operational risks.
          </p>
          <p className="my-2">For example, the platform reduces risks of:</p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Revenue leakage</li>
            <li className="text-muted-foreground">Student poaching</li>
            <li className="text-muted-foreground">Operational errors</li>
          </ul>
          <p className="my-2">
            but it does not guarantee their complete prevention in all cases.
          </p>
        </>
      ),
    },
    {
      title: "12. Force Majeure",
      content: (
        <>
          <p className="my-2">
            We are not liable for any delay or interruption caused by
            circumstances beyond our reasonable control, including but not
            limited to:
          </p>
          <ul className="list-disc pl-6 my-2 space-y-1">
            <li className="text-muted-foreground">Internet outages</li>
            <li className="text-muted-foreground">Data centre failures</li>
            <li className="text-muted-foreground">Natural disasters</li>
            <li className="text-muted-foreground">Large‑scale cyberattacks</li>
            <li className="text-muted-foreground">
              Governmental or regulatory actions
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "13. Termination of Service",
      content: (
        <>
          <p className="font-semibold mt-4">By the Client</p>
          <p className="my-2">
            The Client may cancel the subscription at any time by contacting us
            or through account settings (if available).
          </p>

          <p className="font-semibold mt-4">By Us</p>
          <p className="my-2">
            We reserve the right to suspend or terminate the account in case of
            a material breach of these Terms or if use harms the system or other
            users. We will provide prior notice when reasonably possible.
          </p>
        </>
      ),
    },
    {
      title: "14. Governing Law",
      content: (
        <p className="my-2">
          These Terms are governed by and interpreted in accordance with the
          laws of the Arab Republic of Egypt.
        </p>
      ),
    },
    {
      title: "15. Contact Us",
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
            <li className="text-muted-foreground">Phone: +20 1011214517</li>
          </ul>
        </>
      ),
    },
  ];

  // ===== ARABIC SECTIONS (new content as provided) =====
  const arabicSections = [
    {
      title: "1. وصف الخدمة",
      content: (
        <>
          <p className="my-2">
            &quot;نظام أكاديميتي&quot; هو منصة برمجية بنظام الاشتراك (Software
            as a Service - SaaS) مصممة لمساعدة الأكاديميات التعليمية على إدارة
            وتشغيل عملياتها اليومية بكفاءة أعلى.
          </p>
          <p className="my-2">تشمل الخدمة، على سبيل المثال لا الحصر:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">إدارة الطلاب والمعلمين</li>
            <li className="text-muted-foreground">متابعة الحضور والجداول</li>
            <li className="text-muted-foreground">التقارير المالية والتحصيل</li>
            <li className="text-muted-foreground">أدوات التواصل الداخلية</li>
            <li className="text-muted-foreground">
              التكامل مع خدمات خارجية مثل Zoom
            </li>
            <li className="text-muted-foreground">
              ميزات إضافية قد يتم إطلاقها أو تطويرها مستقبلاً
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "2. التسجيل والحسابات ومسؤولية العميل",
      content: (
        <>
          <p className="font-semibold mt-4">إنشاء الحساب</p>
          <p className="my-2">
            لاستخدام الخدمة، يجب إنشاء حساب إداري وتقديم معلومات صحيحة ومحدثة
            وكاملة.
          </p>

          <p className="font-semibold mt-4">مسؤولية الحساب</p>
          <p className="my-2">
            يتحمل العميل المسؤولية الكاملة عن جميع الأنشطة التي تتم من خلال
            حسابه، بما في ذلك الأنشطة التي يقوم بها المعلمون أو الموظفون أو
            الطلاب المصرح لهم باستخدام النظام.
          </p>

          <p className="font-semibold mt-4">مسؤولية كلمات المرور والصلاحيات</p>
          <p className="my-2">يتحمل العميل مسؤولية:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              الحفاظ على سرية بيانات تسجيل الدخول
            </li>
            <li className="text-muted-foreground">
              إدارة صلاحيات الوصول للمستخدمين التابعين له
            </li>
            <li className="text-muted-foreground">
              إزالة صلاحيات المستخدمين غير المصرح لهم عند الحاجة
            </li>
          </ul>
          <p className="my-2">
            أي استخدام ناتج عن مشاركة بيانات الدخول أو سوء إدارة الصلاحيات يقع
            ضمن مسؤولية العميل.
          </p>

          <p className="font-semibold mt-4">النزاعات مع المستخدمين النهائيين</p>
          <p className="my-2">
            نظام أكاديميتي يوفر أدوات لإدارة الأكاديمية فقط، ولا يعتبر طرفًا في
            الاتفاقيات أو النزاعات بين الأكاديمية وبين معلميها أو طلابها.
          </p>
          <p className="my-2">يشمل ذلك، على سبيل المثال:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">نزاعات المدفوعات</li>
            <li className="text-muted-foreground">تسريب الطلاب</li>
            <li className="text-muted-foreground">خرق العقود</li>
            <li className="text-muted-foreground">
              النزاعات المتعلقة بالملكية الفكرية
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "3. الاشتراكات والمدفوعات",
      content: (
        <>
          <p className="font-semibold mt-4">الاشتراك</p>
          <p className="my-2">
            تعتمد الميزات المتاحة على الخطة التي يشترك بها العميل.
          </p>

          <p className="font-semibold mt-4">الفوترة</p>
          <p className="my-2">
            يتم تحصيل رسوم الاشتراك مقدمًا على أساس شهري أو حسب الخطة المتفق
            عليها.
          </p>

          <p className="font-semibold mt-4">التأخر في السداد</p>
          <p className="my-2">
            في حال التأخر عن سداد الاشتراك، نحتفظ بالحق في:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">إرسال تنبيهات بالسداد</li>
            <li className="text-muted-foreground">
              تعليق بعض أو جميع ميزات الخدمة مؤقتًا
            </li>
            <li className="text-muted-foreground">
              تقييد الوصول إلى الحساب لحين تسوية المستحقات
            </li>
          </ul>
          <p className="my-2">
            قد نمنح فترة سماح وفقًا لتقديرنا قبل التعليق الكامل للخدمة.
          </p>

          <p className="font-semibold mt-4">الاسترداد</p>
          <p className="my-2">
            المدفوعات الخاصة بالفترات المستخدمة غير قابلة للاسترداد. ومع ذلك، قد
            ننظر في طلبات الاسترداد الاستثنائية وفقًا لتقديرنا الخاص.
          </p>

          <p className="font-semibold mt-4">تغيير الأسعار</p>
          <p className="my-2">
            نحتفظ بحق تعديل الأسعار مع إشعار مسبق لا يقل عن 30 يومًا. استمرار
            استخدام الخدمة بعد سريان الأسعار الجديدة يعد موافقة عليها.
          </p>
        </>
      ),
    },
    {
      title: "4. الاستخدام المقبول",
      content: (
        <>
          <p className="my-2">يوافق العميل والمستخدمون التابعون له على عدم:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              استخدام الخدمة لأي غرض غير قانوني أو احتيالي
            </li>
            <li className="text-muted-foreground">
              محاولة الوصول غير المصرح به للأنظمة أو الحسابات الأخرى
            </li>
            <li className="text-muted-foreground">
              تعطيل أو الإضرار بأداء الخدمة
            </li>
            <li className="text-muted-foreground">
              رفع أو إرسال برمجيات ضارة أو محتوى غير قانوني
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "5. البيانات والملكية الفكرية",
      content: (
        <>
          <p className="font-semibold mt-4">ملكية بيانات العميل</p>
          <p className="my-2">
            يحتفظ العميل بكامل حقوق ملكية البيانات التي يدخلها إلى النظام، بما
            في ذلك:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">بيانات الطلاب</li>
            <li className="text-muted-foreground">بيانات المعلمين</li>
            <li className="text-muted-foreground">السجلات المالية</li>
            <li className="text-muted-foreground">الجداول والتقارير</li>
          </ul>
          <p className="my-2">
            باستخدام الخدمة، يمنح العميل &quot;نظام أكاديميتي&quot; ترخيصًا
            محدودًا لمعالجة هذه البيانات فقط لغرض تقديم الخدمة وتشغيلها.
          </p>

          <p className="font-semibold mt-4">تصدير البيانات</p>
          <p className="my-2">
            في حال إنهاء الاشتراك، يحق للعميل طلب نسخة قابلة للتصدير من بياناته
            (مثل Excel أو CSV) خلال مدة لا تتجاوز 30 يومًا من تاريخ الإلغاء.
          </p>

          <p className="font-semibold mt-4">ملكيتنا الفكرية</p>
          <p className="my-2">
            جميع حقوق الملكية الفكرية الخاصة بالنظام، بما في ذلك:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">الكود البرمجي</li>
            <li className="text-muted-foreground">التصميم</li>
            <li className="text-muted-foreground">البنية التقنية</li>
            <li className="text-muted-foreground">الواجهات</li>
            <li className="text-muted-foreground">العلامات التجارية</li>
          </ul>
          <p className="my-2">
            مملوكة بالكامل لنظام أكاديميتي. لا يجوز نسخ أو إعادة بيع أو تعديل
            النظام دون إذن كتابي مسبق.
          </p>
        </>
      ),
    },
    {
      title: "6. الأمان وحماية البيانات",
      content: (
        <>
          <p className="my-2">
            نلتزم باتخاذ تدابير تقنية وإدارية معقولة لحماية بيانات العملاء.
          </p>
          <p className="my-2">يشمل ذلك:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              استضافة البيانات داخل خوادم آمنة (Secure VPS)
            </li>
            <li className="text-muted-foreground">
              فصل بيانات كل أكاديمية منطقيًا عن غيرها
            </li>
            <li className="text-muted-foreground">
              تشفير البيانات الحساسة مثل معلومات الاتصال
            </li>
            <li className="text-muted-foreground">النسخ الاحتياطي الدوري</li>
            <li className="text-muted-foreground">
              تقييد الوصول الإداري للبيانات
            </li>
          </ul>
          <p className="my-2">
            يقتصر الوصول الإداري الداخلي إلى البيانات على ما يلزم لتشغيل المنصة
            أو دعم العملاء أو معالجة الأعطال الفنية. ورغم ذلك، لا يمكن ضمان أمان
            أي نظام إلكتروني بنسبة 100%.
          </p>
        </>
      ),
    },
    {
      title: "7. خدمات الطرف الثالث",
      content: (
        <>
          <p className="my-2">
            قد تعتمد بعض وظائف المنصة على خدمات خارجية مثل Zoom.
          </p>
          <p className="my-2">نحن لا نتحكم في هذه الخدمات ولسنا مسؤولين عن:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">أعطالها</li>
            <li className="text-muted-foreground">توقفها</li>
            <li className="text-muted-foreground">تغييرات APIs الخاصة بها</li>
            <li className="text-muted-foreground">
              القيود التي تفرضها مستقبلاً
            </li>
          </ul>
          <p className="my-2">
            أي انقطاع من طرف هذه الخدمات قد يؤثر مؤقتًا على بعض الميزات.
          </p>
        </>
      ),
    },
    {
      title: "8. الميزات التجريبية (Beta Features)",
      content: (
        <>
          <p className="my-2">
            قد نوفر بعض الميزات في مرحلة تجريبية (Beta). هذه الميزات قد:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">تتغير</li>
            <li className="text-muted-foreground">يتم تحسينها</li>
            <li className="text-muted-foreground">يتم إيقافها</li>
            <li className="text-muted-foreground">تحتوي على قيود مؤقتة</li>
          </ul>
          <p className="my-2">
            استخدام الميزات التجريبية يعني قبول طبيعتها التطويرية.
          </p>
        </>
      ),
    },
    {
      title: "9. توفر الخدمة والصيانة",
      content: (
        <>
          <p className="my-2">
            نسعى لتوفير الخدمة بأعلى قدر ممكن من الاستقرار والموثوقية.
          </p>
          <p className="my-2">قد نحتاج أحيانًا إلى إجراء:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">صيانة دورية</li>
            <li className="text-muted-foreground">تحديثات تقنية</li>
            <li className="text-muted-foreground">تحسينات للبنية التحتية</li>
          </ul>
          <p className="my-2">
            وقد يترتب على ذلك توقف مؤقت للخدمة. سنحاول الإشعار المسبق قدر
            الإمكان.
          </p>
        </>
      ),
    },
    {
      title: "10. حدود المسؤولية",
      content: (
        <>
          <p className="my-2">
            إلى أقصى حد يسمح به القانون، لا يتحمل نظام أكاديميتي أو موظفوه أو
            شركاؤه المسؤولية عن أي أضرار غير مباشرة أو تبعية، بما يشمل:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">خسارة الأرباح</li>
            <li className="text-muted-foreground">خسارة البيانات</li>
            <li className="text-muted-foreground">فقدان الاستخدام</li>
            <li className="text-muted-foreground">الأضرار التجارية</li>
          </ul>
          <p className="my-2">يشمل ذلك الأضرار الناتجة عن:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">
              استخدام الخدمة أو تعذر استخدامها
            </li>
            <li className="text-muted-foreground">وصول غير مصرح به للأنظمة</li>
            <li className="text-muted-foreground">أعطال برمجية</li>
            <li className="text-muted-foreground">انقطاعات خارجية</li>
          </ul>
        </>
      ),
    },
    {
      title: "11. إخلاء الضمانات",
      content: (
        <>
          <p className="my-2">
            يتم تقديم الخدمة على أساس: &quot;كما هي&quot; (AS IS) و &quot;حسب
            التوفر&quot; (AS AVAILABLE). لا نقدم ضمانًا صريحًا أو ضمنيًا بأن
            الخدمة ستمنع بشكل كامل جميع المخاطر التشغيلية.
          </p>
          <p className="my-2">على سبيل المثال، المنصة تقلل مخاطر:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">تسرب الإيرادات</li>
            <li className="text-muted-foreground">تسريب الطلاب</li>
            <li className="text-muted-foreground">الأخطاء التشغيلية</li>
          </ul>
          <p className="my-2">لكنها لا تضمن منعها بالكامل في جميع الحالات.</p>
        </>
      ),
    },
    {
      title: "12. الظروف الخارجة عن الإرادة (Force Majeure)",
      content: (
        <>
          <p className="my-2">
            لا نتحمل المسؤولية عن أي تأخير أو انقطاع ناتج عن ظروف خارجة عن
            إرادتنا، بما في ذلك على سبيل المثال لا الحصر:
          </p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
            <li className="text-muted-foreground">انقطاع الإنترنت</li>
            <li className="text-muted-foreground">أعطال مراكز البيانات</li>
            <li className="text-muted-foreground">الكوارث الطبيعية</li>
            <li className="text-muted-foreground">
              الهجمات الإلكترونية واسعة النطاق
            </li>
            <li className="text-muted-foreground">
              القرارات الحكومية أو التنظيمية
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "13. إنهاء الخدمة",
      content: (
        <>
          <p className="font-semibold mt-4">من طرف العميل</p>
          <p className="my-2">
            يمكن للعميل إلغاء الاشتراك في أي وقت عبر التواصل معنا أو من خلال
            إعدادات الحساب إن توفرت.
          </p>

          <p className="font-semibold mt-4">من طرفنا</p>
          <p className="my-2">
            نحتفظ بالحق في تعليق أو إنهاء الحساب في حال وجود انتهاك جوهري لهذه
            الشروط أو وجود استخدام يضر بالنظام أو بالمستخدمين الآخرين. سنقوم
            بالإشعار المسبق متى كان ذلك ممكنًا عمليًا.
          </p>
        </>
      ),
    },
    {
      title: "14. القانون المعمول به",
      content: (
        <p className="my-2">
          تخضع هذه الشروط وتفسر وفقًا لقوانين جمهورية مصر العربية.
        </p>
      ),
    },
    {
      title: "15. التواصل معنا",
      content: (
        <>
          <p className="my-2">لأي استفسارات بخصوص شروط الخدمة:</p>
          <ul
            className="list-disc pr-6 mr-4 space-y-1"
            style={{ listStylePosition: "outside" }}
          >
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
                  ? "آخر تحديث: 27/06/2026"
                  : "Last Updated: June 27, 2026"}
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
