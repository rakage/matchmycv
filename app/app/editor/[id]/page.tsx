import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { EditorPageClient } from "./client";

interface EditorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: EditorPageProps): Promise<Metadata> {
  return {
    title: "AI CV Editor",
    description: "Edit and optimize your CV with AI assistance",
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  // Fetch the document from database
  const document = await db.document.findUnique({
    where: { id },
    include: {
      cvAnalyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      versions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!document || document.userId !== user.id) {
    notFound();
  }

  // Parse structured CV data
  const structuredData = JSON.parse(document.structured);

  // Transform content for analysis APIs - extract the actual data from sections wrapper
  const analysisContent = structuredData.sections
    ? structuredData.sections
    : structuredData;

  // Get the latest analysis if it exists
  const latestAnalysis = document.cvAnalyses[0] || null;
  const existingAnalysis = latestAnalysis
    ? {
        id: latestAnalysis.id,
        overallGrade: latestAnalysis.overallGrade as "A" | "B" | "C" | "D",
        overallScore: latestAnalysis.overallScore,
        summary: latestAnalysis.summary,
      }
    : null;

  const existingExperienceAnalysis =
    latestAnalysis && latestAnalysis.experienceAnalysis
      ? JSON.parse(latestAnalysis.experienceAnalysis)
      : null;

  // Transform document data to match CVEditor interface
  const transformedDocument = {
    id: document.id,
    title: document.title,
    rawText: document.rawText,
    structured: document.structured,
    versions: document.versions.map((version) => ({
      id: version.id,
      label: version.label,
      content: version.content,
      isActive: version.isActive,
      createdAt: version.createdAt.toISOString(),
    })),
  };

  return (
    <EditorPageClient
      document={transformedDocument}
      structuredData={structuredData}
      analysisContent={analysisContent}
      user={user}
      existingAnalysis={existingAnalysis}
      existingExperienceAnalysis={existingExperienceAnalysis}
    />
  );
}
