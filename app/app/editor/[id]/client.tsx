"use client";

import { useState, useEffect } from "react";
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
    () => {
      // Select the latest version by default (first in the array since they're ordered by createdAt desc)
      if (document.versions && document.versions.length > 0) {
        return document.versions[0].id;
      }
      return null; // Fall back to original document if no versions exist
    }
  );

  // Ensure structuredData has proper fallback structure
  const safeStructuredData = structuredData || {
    contact: {},
    summary: "",
    experience: [],
    education: [],
    skills: [],
  };

  const [currentStructuredData, setCurrentStructuredData] =
    useState(safeStructuredData);

  const safeAnalysisContent = analysisContent || {
    contact: {},
    summary: "",
    experience: [],
    education: [],
    skills: [],
  };

  const [currentAnalysisContent, setCurrentAnalysisContent] =
    useState(safeAnalysisContent);

  // Track analyzed version ids. If there is existing analysis at load time, mark "original" as analyzed.
  const [analyzedVersionIds, setAnalyzedVersionIds] = useState<Set<string>>(
    () => new Set()
  );

  // Check for existing analyses on mount
  useEffect(() => {
    const checkExistingAnalyses = async () => {
      const analysisChecks = [];

      // Check original document
      analysisChecks.push(
        fetch(`/api/get-cv-analysis?documentId=${document.id}`)
          .then((res) => res.json())
          .then((data) => ({
            versionId: "original",
            hasAnalysis: !!data.analysis,
          }))
          .catch(() => ({ versionId: "original", hasAnalysis: false }))
      );

      // Check each version
      for (const version of document.versions) {
        analysisChecks.push(
          fetch(
            `/api/get-cv-analysis?documentId=${document.id}&versionId=${version.id}`
          )
            .then((res) => res.json())
            .then((data) => ({
              versionId: version.id,
              hasAnalysis: !!data.analysis,
            }))
            .catch(() => ({ versionId: version.id, hasAnalysis: false }))
        );
      }

      const results = await Promise.all(analysisChecks);
      const analyzedIds = results
        .filter((result) => result.hasAnalysis)
        .map((result) => result.versionId);

      if (analyzedIds.length > 0) {
        setAnalyzedVersionIds(new Set(analyzedIds));
      }
    };

    checkExistingAnalyses();
  }, [document.id, document.versions]);

  // Load the selected version's content on initial mount
  useEffect(() => {
    if (selectedVersionId) {
      handleVersionChange(selectedVersionId);
    }
  }, []); // Only run on mount

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
      // Use original document content with safe fallbacks
      setCurrentStructuredData(safeStructuredData);
      setCurrentAnalysisContent(safeAnalysisContent);
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

      // Ensure parsed data has proper structure with fallbacks
      const safeParsed = {
        contact: parsed.contact || {},
        summary: parsed.summary || "",
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        ...parsed, // Include any other properties
      };

      const versionStructuredData = { sections: safeParsed };

      setCurrentStructuredData(versionStructuredData);
      setCurrentAnalysisContent(safeParsed);
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
          structuredData={currentStructuredData || safeStructuredData}
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
