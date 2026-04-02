import db from "@/lib/prisma";
import { user } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";
import WaitlistClient from "@/components/dashboard/admin/wishlists/viewer";

export default async function WaitlistPage() {
  const currentUser = await user();
  if (!currentUser || currentUser.role !== Role.SuperAdmin) {
    redirect("/login");
  }

  const waitlist = await db.waitlist.findMany({
    orderBy: { createdAt: "desc" },
  });

  const transformed = waitlist.map((w) => ({
    id: w.id,
    fullName: w.fullName,
    email: w.email,
    phone: w.phone,
    academyName: w.academyName,
    academySize: w.academySize,
    currentMethod: w.currentMethod,
    reviewBonus: w.reviewBonus,
    videoBonus: w.videoBonus,
    terms: w.terms,
    createdAt: w.createdAt.toISOString(),
  }));

  return <WaitlistClient initialEntries={transformed} />;
}
