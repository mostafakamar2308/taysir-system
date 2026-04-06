import db from "@/lib/prisma";
import PricingSection from "@/components/landing/PricingSection";

// Fallback plans if database is empty (matching your description)
const defaultPlans = [
  {
    id: 1,
    name: "Free",
    dollarPrice: 0,
    egyptianPrice: 0,
    maxStudents: 30,
    maxTutors: 3,
    billingPeriod: 1,
    features: [
      "حتى 3 معلمين",
      "حتى 30 طالباً",
      "إدارة أساسية للحلقات",
      "تقارير أداء شهرية",
      "دعم عبر الواتساب",
      "وصول لمجموعة خاصة مع مديرين آخرين",
    ],
  },
  {
    id: 2,
    name: "Basic",
    dollarPrice: 10,
    egyptianPrice: 500,
    maxStudents: 200,
    maxTutors: 15,
    billingPeriod: 1,
    features: [
      "جميع مميزات الباقة المجانية",
      "الدفع بعدد المعلمين، بحد أقصى 30 معلم (الدفع لكل معلم مضاف)",
      "طلاب بلا حدود",
      "النظام المالي المتكامل",
      "التواصل التلقائي باستخدام واتساب",
      "إرسال تلقائي لتقارير الأداء",
      "تقارير مالية مفصلة",
      "دعم فني هاتفي",
    ],
  },
  {
    id: 3,
    name: "Professional",
    dollarPrice: 99,
    egyptianPrice: 4950,
    maxStudents: null,
    maxTutors: null,
    billingPeriod: 1,
    features: [
      "جميع مميزات الباقة الاحترافية",
      "معلمون وطلاب غير محدودين بدون رسوم إضافية",
      "صفحة هبوط مخصصة مجانا",
      "موقع منفصل بدومين منفصل",
      "أولوية الدعم على مدار الساعة",
      "تكامل مخصص مع أنظمتك",
    ],
  },
];

export default async function PricingSectionWrapper() {
  const dbPlans = await db.saasPlan.findMany({ orderBy: { id: "asc" } });

  let plans;
  if (dbPlans.length === 0) {
    plans = defaultPlans;
  } else {
    plans = dbPlans.map((plan, index) => {
      let features: string[] = [];
      if (Array.isArray(plan.features)) {
        features = plan.features as string[];
      } else if (defaultPlans[index]) {
        features = defaultPlans[index].features;
      }

      return {
        id: plan.id,
        name: plan.name,
        dollarPrice: plan.dollarPrice,
        egyptianPrice: plan.egyptianPrice,
        maxStudents: plan.maxStudents,
        maxTutors: plan.maxTutors,
        billingPeriod: plan.billingPeriod,
        features,
      };
    });
  }

  const exchangeRate = 50;

  return <PricingSection plans={plans} exchangeRate={exchangeRate} />;
}
