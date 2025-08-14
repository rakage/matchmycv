import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { AnalysisResults } from "@/components/app/analysis-results";

interface AnalysisPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: AnalysisPageProps): Promise<Metadata> {
  return {
    title: "CV Analysis Results",
    description: "Your detailed CV analysis and optimization recommendations",
  };
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Fetch the analysis with related data
  const analysis = await db.analysis.findUnique({
    where: {
      id: params.id,
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
          rawText: true,
        },
      },
    },
  });

  if (!analysis) {
    notFound();
  }

  // Check if user owns this analysis
  if (analysis.userId !== user.id) {
    notFound();
  }

  // Parse JSON strings back to objects for display
  const parsedAnalysis = {
    ...analysis,
    subScores: JSON.parse(analysis.subScores),
    gaps: JSON.parse(analysis.gaps),
    suggestions: JSON.parse(analysis.suggestions),
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          CV Analysis Results
        </h1>
        <p className="mt-2 text-gray-600">
          Analysis of {analysis.document.title} for {analysis.jobTarget.title}
          {analysis.jobTarget.company && ` at ${analysis.jobTarget.company}`}
        </p>
      </div>

      <AnalysisResults analysis={parsedAnalysis} />
    </div>
  );
}
