"use client";

import { useState } from "react";
import { CVEditor } from "@/components/app/cv-editor";
import { UnifiedCVAnalysis } from "@/components/app/unified-cv-analysis";

interface ExperienceAnalysis {
  experienceIndex: number;
  title: string;
  company: string;
  overallIssues: {
    urgent: number;
    critical: number;
    optional: number;
  };
  bulletIssues: Array<{
    bulletIndex: number;
    originalText: string;
    issues: string[];
    suggestedText: string;
    priority: "urgent" | "critical" | "optional";
    impact: string;
  }>;
}

interface EditorPageClientProps {
  document: any;
  structuredData: any;
  analysisContent: any;
  user: any;
  existingAnalysis: {
    id: string;
    overallGrade: "A" | "B" | "C" | "D";
    overallScore: number;
    summary: string;
  } | null;
  existingExperienceAnalysis: ExperienceAnalysis[] | null;
}

export function EditorPageClient({
  document,
  structuredData,
  analysisContent,
  user,
  existingAnalysis,
  existingExperienceAnalysis,
}: EditorPageClientProps) {
  const [experienceAnalysis, setExperienceAnalysis] = useState<
    ExperienceAnalysis[] | null
  >(existingExperienceAnalysis);

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [currentStructuredData, setCurrentStructuredData] =
    useState(structuredData);
  const [currentAnalysisContent, setCurrentAnalysisContent] =
    useState(analysisContent);

  // Track analyzed version ids. If there is existing analysis at load time, mark "original" as analyzed.
  const [analyzedVersionIds, setAnalyzedVersionIds] = useState<Set<string>>(
    () => new Set(existingAnalysis ? ["original"] : [])
  );

  const handleExperienceAnalysisUpdate = (
    analysis: ExperienceAnalysis[] | null
  ) => {
    setExperienceAnalysis(analysis);
  };

  const handleVersionAnalyzed = (versionId: string | null) => {
    setAnalyzedVersionIds((prev) => {
      const next = new Set(prev);
      next.add(versionId ?? "original");
      return next;
    });
  };

  const handleVersionChange = async (versionId: string | null) => {
    setSelectedVersionId(versionId);

    if (versionId === null) {
      // Use original document content
      setCurrentStructuredData(structuredData);
      setCurrentAnalysisContent(analysisContent);
      return;
    }

    try {
      // Always fetch the version from the API to avoid stale client state
      const res = await fetch(
        `/api/version?id=${encodeURIComponent(versionId)}`
      );
      if (!res.ok) {
        console.warn("Failed to fetch version, status:", res.status);
        return;
      }
      const version = await res.json();

      let parsed: any = null;
      try {
        parsed =
          typeof version.content === "string"
            ? JSON.parse(version.content)
            : version.content;
      } catch (e) {
        console.warn(
          "Fetched version content is not valid JSON. Aborting switch.",
          e
        );
        return;
      }

      if (!parsed || typeof parsed !== "object") {
        console.warn(
          "Parsed version content is not an object. Skipping switch."
        );
        return;
      }

      const versionStructuredData = { sections: parsed };

      setCurrentStructuredData(versionStructuredData);
      setCurrentAnalysisContent(parsed);
      // Keep existing experience analysis until user re-analyzes
    } catch (err) {
      console.warn("Error switching version:", err);
    }
  };

  // Helper: list of versions to show (only analyzed ones)
  // Show all versions; the editor will badge not-analyzed ones
  const allVersions = document.versions;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Unified CV Analysis Header */}
      <UnifiedCVAnalysis
        documentId={document.id}
        documentTitle={document.title}
        content={currentAnalysisContent}
        onExperienceAnalysisUpdate={handleExperienceAnalysisUpdate}
        existingAnalysis={existingAnalysis}
        currentVersionId={selectedVersionId}
        onVersionAnalyzed={handleVersionAnalyzed}
      />

      {/* CV Editor */}
      <div className="mt-8">
        <CVEditor
          document={{ ...document, versions: allVersions }}
          structuredData={currentStructuredData}
          latestAnalysis={null}
          user={user}
          experienceAnalysis={experienceAnalysis}
          selectedVersionId={selectedVersionId}
          onVersionChange={handleVersionChange}
          analyzedVersionIds={Array.from(analyzedVersionIds)}
        />
      </div>
    </div>
  );
}
