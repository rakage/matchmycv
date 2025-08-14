import { Metadata } from "next";
import { getCurrentUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { AnalysisHistory } from "@/components/app/analysis-history";

export const metadata: Metadata = {
  title: "Analysis History",
  description: "View all your past CV analyses and results",
};

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null; // This shouldn't happen due to layout protection
  }

  // Fetch user's analyses with related data
  const analyses = await db.analysis.findMany({
    where: {
      userId: user.id,
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          mimeType: true,
        },
      },
      jobTarget: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
        <p className="mt-2 text-gray-600">
          View all your past CV analyses and compare results across different
          job applications
        </p>
      </div>

      <AnalysisHistory analyses={analyses} />
    </div>
  );
}
