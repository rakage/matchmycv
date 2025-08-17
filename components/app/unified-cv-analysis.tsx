"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  CheckCircle,
  X,
  Edit3,
  Zap,
} from "lucide-react";

interface UnifiedCVAnalysisProps {
  documentId: string;
  documentTitle: string;
  content: any;
  onExperienceAnalysisUpdate?: (
    experienceAnalysis: ExperienceAnalysis[] | null
  ) => void;
  existingAnalysis?: AnalysisResult | null;
  currentVersionId?: string | null;
  onVersionAnalyzed?: (versionId: string | null) => void;
}

interface AnalysisResult {
  id?: string;
  overallGrade: "A" | "B" | "C" | "D";
  overallScore: number;
  summary: string;
}

interface ExperienceAnalysis {
  experienceIndex: number;
  title: string;
  company: string;
  overallIssues: {
    urgent: number;
    critical: number;
    optional: number;
  };
  bulletIssues: BulletIssue[];
}

interface BulletIssue {
  bulletIndex: number;
  originalText: string;
  issues: string[];
  suggestedText: string;
  priority: "urgent" | "critical" | "optional";
  impact: string;
}

export function UnifiedCVAnalysis({
  documentId,
  documentTitle,
  content,
  onExperienceAnalysisUpdate,
  existingAnalysis,
  currentVersionId,
  onVersionAnalyzed,
}: UnifiedCVAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    existingAnalysis || null
  );
  const [experienceAnalysis, setExperienceAnalysis] = useState<
    ExperienceAnalysis[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [fixSidebarOpen, setFixSidebarOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceAnalysis | null>(null);
  const [selectedBulletIndex, setSelectedBulletIndex] = useState<number | null>(
    null
  );
  const [userEdits, setUserEdits] = useState<{ [key: string]: string }>({});

  // Load existing analysis on component mount and when version changes
  useEffect(() => {
    const loadExistingAnalysis = async () => {
      if (!existingAnalysis) {
        try {
          const queryParams = new URLSearchParams({ documentId });
          if (currentVersionId) {
            queryParams.append("versionId", currentVersionId);
          }

          const response = await fetch(
            `/api/get-cv-analysis?${queryParams.toString()}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.analysis) {
              setAnalysis(data.analysis);
            } else {
              setAnalysis(null);
            }
            if (data.experienceAnalysis) {
              setExperienceAnalysis(data.experienceAnalysis);
              if (onExperienceAnalysisUpdate) {
                onExperienceAnalysisUpdate(data.experienceAnalysis);
              }
            } else {
              setExperienceAnalysis(null);
              if (onExperienceAnalysisUpdate) {
                onExperienceAnalysisUpdate(null);
              }
            }
          }
        } catch (error) {
          console.error("Failed to load existing analysis:", error);
        }
      } else {
        // If existing analysis was provided, also notify parent about experience analysis
        if (experienceAnalysis && onExperienceAnalysisUpdate) {
          onExperienceAnalysisUpdate(experienceAnalysis);
        }
      }
    };

    loadExistingAnalysis();
  }, [
    documentId,
    currentVersionId, // Add currentVersionId as dependency
    existingAnalysis,
  ]);

  // Reset analysis when content changes (version switch) - removed this effect since it's handled above

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Analysis content:", content);

      // Always call CV analysis
      const analysisPromise = fetch("/api/cv-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          documentId,
          versionId: currentVersionId,
        }),
      });

      // Call experience analysis for each experience entry individually
      const experiencePromises: Promise<Response>[] = [];

      if (
        content.experience &&
        Array.isArray(content.experience) &&
        content.experience.length > 0
      ) {
        content.experience.forEach((exp: any, index: number) => {
          if (exp.bullets && exp.bullets.length > 0) {
            const experiencePromise = fetch("/api/experience-analysis", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                experience: exp,
                experienceIndex: index,
                documentId: documentId,
              }),
            });
            experiencePromises.push(experiencePromise);
          }
        });
      }

      // Wait for all API calls to complete
      const [analysisResponse, ...experienceResponses] = await Promise.all([
        analysisPromise,
        ...experiencePromises,
      ]);

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const analysisResult = await analysisResponse.json();
      setAnalysis(analysisResult);

      // Process experience analysis results
      const experienceResults: any[] = [];

      for (const experienceResponse of experienceResponses) {
        if (!experienceResponse.ok) {
          const errorData = await experienceResponse.json();
          console.error("Experience analysis failed:", errorData.error);
          continue; // Skip failed analyses but continue with others
        }

        const experienceResult = await experienceResponse.json();
        if (experienceResult.experienceAnalysis) {
          experienceResults.push(experienceResult.experienceAnalysis);
        }
      }

      // Sort by experienceIndex to maintain order
      experienceResults.sort((a, b) => a.experienceIndex - b.experienceIndex);

      setExperienceAnalysis(experienceResults);

      // Notify parent component about experience analysis update
      if (onExperienceAnalysisUpdate) {
        onExperienceAnalysisUpdate(experienceResults);
      }

      // Save combined experience analysis to database
      if (experienceResults.length > 0) {
        try {
          await fetch("/api/save-experience-analysis", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              documentId,
              versionId: currentVersionId,
              experienceAnalysis: experienceResults,
            }),
          });
        } catch (saveError) {
          console.error("Failed to save experience analysis:", saveError);
          // Don't throw error, as the analysis was successful even if saving failed
        }
      }

      // Mark this version as analyzed (so the UI can show it in the version selector)
      if (onVersionAnalyzed) {
        onVersionAnalyzed(currentVersionId ?? null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze CV");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixExperience = (exp: ExperienceAnalysis) => {
    setSelectedExperience(exp);
    setSelectedBulletIndex(0); // Auto-select first bullet point
    setFixSidebarOpen(true);
  };

  const handleApplyBulletFix = (
    bulletIssue: BulletIssue,
    customText?: string
  ) => {
    const textToApply = customText || bulletIssue.suggestedText;
    const fixId = `exp-${selectedExperience?.experienceIndex}-bullet-${bulletIssue.bulletIndex}`;

    // This functionality is now handled internally within the component
    // setAppliedFixes((prev) => new Set([...prev, fixId]));
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-50 text-green-700 border-green-200";
      case "B":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "C":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-red-50 text-red-700 border-red-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50";
      case "critical":
        return "text-orange-600 bg-orange-50";
      case "optional":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* CV Header with Score and Analysis Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold">{documentTitle}</h1>
          </div>
          {analysis && (
            <div className="flex items-center space-x-2">
              <div
                className={`px-3 py-1 rounded-full border font-bold text-lg ${getGradeColor(
                  analysis.overallGrade
                )}`}
              >
                {analysis.overallGrade}
              </div>
              <div className="text-left">
                <p
                  className={`text-xl font-bold ${getScoreColor(
                    analysis.overallScore
                  )}`}
                >
                  {analysis.overallScore}%
                </p>
                <p className="text-xs text-gray-600">CV Score</p>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BarChart3 className="h-4 w-4" />
          )}
          <span>{isLoading ? "Analyzing..." : "Analyze CV"}</span>
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Analysis results are now integrated into the CV editor tabs */}
          {analysis.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{analysis.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Experience Fix Sidebar */}
      {fixSidebarOpen && selectedExperience && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="bg-white w-2/3 h-full overflow-hidden flex shadow-2xl">
            {/* Left Sidebar - Bullet Point Navigation */}
            <div className="w-1/3 bg-gray-50 border-r overflow-y-auto">
              <div className="p-4 border-b bg-white">
                <h3 className="font-medium text-sm">Bullet Points</h3>
                <p className="text-xs text-gray-600">
                  Click to review each point
                </p>
              </div>
              <div className="p-2">
                {selectedExperience.bulletIssues.map((bulletIssue, index) => {
                  const bulletId = `exp-${selectedExperience.experienceIndex}-bullet-${bulletIssue.bulletIndex}`;
                  const isApplied = appliedFixes.has(bulletId);
                  const isSelected = selectedBulletIndex === index;

                  return (
                    <div
                      key={index}
                      className={`p-3 mb-2 rounded-lg cursor-pointer border transition-colors ${
                        isSelected
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedBulletIndex(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          className={`text-xs ${getPriorityColor(
                            bulletIssue.priority
                          )}`}
                        >
                          {bulletIssue.priority.toUpperCase()}
                        </Badge>
                        {isApplied && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {bulletIssue.originalText}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {bulletIssue.issues.length} issue
                        {bulletIssue.issues.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Fix Experience</h2>
                    <p className="text-sm text-gray-600">
                      {selectedExperience.title} at {selectedExperience.company}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFixSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedExperience.bulletIssues.length > 0 &&
                  selectedBulletIndex !== null && (
                    <div>
                      {(() => {
                        const bulletIssue =
                          selectedExperience.bulletIssues[selectedBulletIndex];
                        const bulletId = `exp-${selectedExperience.experienceIndex}-bullet-${bulletIssue.bulletIndex}`;
                        const isApplied = appliedFixes.has(bulletId);

                        return (
                          <Card className="border-l-4 border-l-blue-200">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    className={getPriorityColor(
                                      bulletIssue.priority
                                    )}
                                  >
                                    {bulletIssue.priority.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    Bullet Point {bulletIssue.bulletIndex + 1}
                                  </span>
                                </div>
                                {isApplied && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Original Text */}
                              <div>
                                <Label className="text-xs font-medium text-gray-600">
                                  Current Text:
                                </Label>
                                <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                  <span className="line-through text-red-600">
                                    {bulletIssue.originalText}
                                  </span>
                                </div>
                              </div>

                              {/* Issues */}
                              <div>
                                <Label className="text-xs font-medium text-gray-600">
                                  Issues Found:
                                </Label>
                                <ul className="mt-1 text-sm text-red-600 space-y-1">
                                  {bulletIssue.issues.map((issue, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start space-x-1"
                                    >
                                      <span>•</span>
                                      <span>{issue}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* AI Generated Suggestion */}
                              <div>
                                <Label className="text-xs font-medium text-gray-600">
                                  AI Suggestion:
                                </Label>
                                <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                                  {bulletIssue.suggestedText}
                                </div>
                              </div>

                              {/* User Custom Version */}
                              <div>
                                <Label className="text-xs font-medium text-gray-600">
                                  Your Version (Optional):
                                </Label>
                                <Textarea
                                  className="mt-1"
                                  placeholder="Write your own improved version..."
                                  value={userEdits[bulletId] || ""}
                                  onChange={(e) =>
                                    setUserEdits((prev) => ({
                                      ...prev,
                                      [bulletId]: e.target.value,
                                    }))
                                  }
                                  rows={3}
                                />
                              </div>

                              {/* Impact */}
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <Label className="text-xs font-medium text-blue-800">
                                  Impact:
                                </Label>
                                <p className="text-sm text-blue-700 mt-1">
                                  {bulletIssue.impact}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApplyBulletFix(bulletIssue)
                                  }
                                  disabled={isApplied}
                                  variant={isApplied ? "outline" : "default"}
                                >
                                  {isApplied ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Applied AI Version
                                    </>
                                  ) : (
                                    "Apply AI Version"
                                  )}
                                </Button>
                                {userEdits[bulletId] && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleApplyBulletFix(
                                        bulletIssue,
                                        userEdits[bulletId]
                                      )
                                    }
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Apply My Version
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
