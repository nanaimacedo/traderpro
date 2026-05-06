import { prisma } from "@/lib/prisma";

export const PLANS = {
  free: {
    name: "Free",
    maxTradesPerDay: Infinity,
    mentorMessagesPerDay: Infinity,
    analyticsAccess: true,
    exportAccess: true,
    pdfReports: true,
    leaderboard: true,
    price: 0,
  },
  pro: {
    name: "Pro",
    maxTradesPerDay: 10,
    mentorMessagesPerDay: Infinity,
    analyticsAccess: true,
    exportAccess: true,
    pdfReports: true,
    leaderboard: true,
    price: 4990, // R$ 49,90 in centavos
  },
} as const;

export type PlanId = keyof typeof PLANS;

export async function getUserPlan(userId: string): Promise<PlanId> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return (user?.plan as PlanId) || "free";
}

export async function checkPlanLimit(
  userId: string,
  feature: keyof typeof PLANS.free
): Promise<{ allowed: boolean; limit?: number; current?: number }> {
  const plan = await getUserPlan(userId);
  const config = PLANS[plan];

  if (feature === "analyticsAccess" || feature === "exportAccess" || feature === "pdfReports" || feature === "leaderboard") {
    return { allowed: !!config[feature] };
  }

  if (feature === "maxTradesPerDay") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.trade.count({
      where: { userId, date: { gte: today, lt: tomorrow } },
    });

    return {
      allowed: count < config.maxTradesPerDay,
      limit: config.maxTradesPerDay,
      current: count,
    };
  }

  if (feature === "mentorMessagesPerDay") {
    if (config.mentorMessagesPerDay === Infinity) return { allowed: true };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const conversations = await prisma.mentorConversation.findMany({
      where: { userId },
      select: { id: true },
    });
    const convIds = conversations.map(c => c.id);

    if (convIds.length === 0) return { allowed: true, limit: config.mentorMessagesPerDay, current: 0 };

    const count = await prisma.mentorMessage.count({
      where: {
        conversationId: { in: convIds },
        role: "user",
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    return {
      allowed: count < config.mentorMessagesPerDay,
      limit: config.mentorMessagesPerDay,
      current: count,
    };
  }

  return { allowed: true };
}
