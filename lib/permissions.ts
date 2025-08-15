import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { db } from "./db";
import { Plan } from "./types";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      credits: true,
      stripeId: true,
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }

  return user;
}

export function canAccessDocument(
  userId: string,
  documentOwnerId: string
): boolean {
  return userId === documentOwnerId;
}

export function canPerformAnalysis(plan: Plan, currentUsage: number): boolean {
  if (plan === "PRO") return true;

  // Free plan limit
  return currentUsage < 5;
}

export function canExport(plan: Plan, currentUsage: number): boolean {
  if (plan === "PRO") return true;

  // Free plan limit
  return currentUsage < 10;
}

export function canUseAIEditor(plan: Plan): boolean {
  return plan === "PRO";
}

export function getFeatureLimits(plan: Plan) {
  return {
    analyses: plan === "PRO" ? -1 : 599, // -1 means unlimited
    exports: plan === "PRO" ? -1 : 10,
    aiEdits: plan === "PRO" ? -1 : 0,
    versions: plan === "PRO" ? -1 : 1,
  };
}

export async function checkUsageLimit(
  userId: string,
  feature: "analyses" | "exports" | "aiEdits",
  plan: Plan
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = getFeatureLimits(plan);
  const limit = limits[feature];

  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  // Count usage for the current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let current = 0;

  switch (feature) {
    case "analyses":
      current = await db.analysis.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });
      break;

    case "exports":
      current = await db.usage.count({
        where: {
          userId,
          type: {
            in: ["EXPORT_PDF", "EXPORT_DOCX"],
          },
          createdAt: {
            gte: startOfMonth,
          },
        },
      });
      break;

    case "aiEdits":
      current = await db.usage.count({
        where: {
          userId,
          type: "AI_EDIT",
          createdAt: {
            gte: startOfMonth,
          },
        },
      });
      break;
  }

  return {
    allowed: current < limit,
    current,
    limit,
  };
}
