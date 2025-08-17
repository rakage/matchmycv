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

  // Parse structured CV data with error handling
  let structuredData;
  let analysisContent;

  try {
    structuredData = JSON.parse(document.structured);

    // Ensure structuredData has the expected structure
    if (!structuredData || typeof structuredData !== "object") {
      throw new Error("Invalid structured data");
    }

    // Transform content for analysis APIs - extract the actual data from sections wrapper
    analysisContent = structuredData.sections
      ? structuredData.sections
      : structuredData;

    // Ensure analysisContent has proper fallback values
    if (!analysisContent || typeof analysisContent !== "object") {
      analysisContent = {
        contact: {},
        summary: "",
        experience: [],
        education: [],
        skills: [],
      };
    }

    // Ensure contact object exists
    if (!analysisContent.contact) {
      analysisContent.contact = {};
    }
  } catch (error) {
    console.error("Error parsing structured data:", error);
    // Fallback to basic structure
    structuredData = {
      contact: {},
      summary: "",
      experience: [],
      education: [],
      skills: [],
    };
    analysisContent = structuredData;
  }

  // Get the latest analysis if it exists - but don't pass it to client
  // Let the client-side component fetch version-specific analysis
  const latestAnalysis = document.cvAnalyses[0] || null;

  // Don't pass existing analysis to client - let it fetch version-specific analysis
  const existingAnalysis = null;

  const existingExperienceAnalysis = null;

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

  // Ensure structuredData has all required properties for the client component
  const safeStructuredData = {
    contact: structuredData.contact || {},
    summary: structuredData.summary || "",
    experience: Array.isArray(structuredData.experience)
      ? structuredData.experience
      : [],
    education: Array.isArray(structuredData.education)
      ? structuredData.education
      : [],
    skills: Array.isArray(structuredData.skills) ? structuredData.skills : [],
    // Include sections if it exists for backward compatibility
    ...(structuredData.sections && { sections: structuredData.sections }),
  };

  return (
    <EditorPageClient
      document={transformedDocument}
      structuredData={safeStructuredData}
      analysisContent={analysisContent}
      user={user}
      existingAnalysis={existingAnalysis}
      existingExperienceAnalysis={existingExperienceAnalysis}
    />
  );
}
