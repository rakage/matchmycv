"use client";

import { useState } from "react";
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
  RefreshCw,
  X,
  Edit3,
  Zap,
} from "lucide-react";

interface CVAnalysisProps {
  content: any;
  onApplyFix?: (fix: any) => void;
}

interface AnalysisResult {
  overallGrade: "A" | "B" | "C" | "D";
  overallScore: number;
  summary: string;
  sections: {
    [key: string]: {
      grade: "A" | "B" | "C" | "D";
      issues: any[];
    };
  };
  urgentFixes: Fix[];
  criticalFixes: Fix[];
  optionalFixes: Fix[];
  experienceAnalysis?: ExperienceAnalysis[];
}

interface Fix {
  section: string;
  issue: string;
  originalText: string;
  suggestedText: string;
  impact: string;
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

export function CVAnalysis({ content, onApplyFix }: CVAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [fixSidebarOpen, setFixSidebarOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceAnalysis | null>(null);
  const [userEdits, setUserEdits] = useState<{ [key: string]: string }>({});
  const [selectedBulletIndex, setSelectedBulletIndex] = useState<number | null>(
    null
  );

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cv-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const result = await response.json();

      // Enhance result with experience analysis
      const enhancedResult = enhanceWithExperienceAnalysis(result, content);
      setAnalysis(enhancedResult);
    } catch (err: any) {
      setError(err.message || "Failed to analyze CV");
    } finally {
      setIsLoading(false);
    }
  };

  const enhanceWithExperienceAnalysis = (
    analysisResult: any,
    cvContent: any
  ): AnalysisResult => {
    const experienceAnalysis: ExperienceAnalysis[] = [];

    if (cvContent.experience && cvContent.experience.length > 0) {
      cvContent.experience.forEach((exp: any, index: number) => {
        if (exp.title && exp.company && exp.bullets) {
          const bulletIssues: BulletIssue[] = exp.bullets.map(
            (bullet: string, bulletIndex: number) => ({
              bulletIndex,
              originalText: bullet,
              issues: generateBulletIssues(bullet),
              suggestedText: improveBulletText(bullet),
              priority: determinePriority(bullet),
              impact: getBulletImpact(bullet),
            })
          );

          const overallIssues = bulletIssues.reduce(
            (acc, issue) => {
              acc[issue.priority]++;
              return acc;
            },
            { urgent: 0, critical: 0, optional: 0 }
          );

          experienceAnalysis.push({
            experienceIndex: index,
            title: exp.title,
            company: exp.company,
            overallIssues,
            bulletIssues,
          });
        }
      });
    }

    return {
      ...analysisResult,
      experienceAnalysis,
    };
  };

  const generateBulletIssues = (bullet: string): string[] => {
    const issues = [];
    if (!bullet.match(/\d/)) issues.push("Missing quantifiable metrics");
    if (bullet.length < 30) issues.push("Too brief, lacks detail");
    if (
      !bullet.match(
        /^(Achieved|Developed|Led|Managed|Improved|Created|Implemented)/i
      )
    ) {
      issues.push("Weak action verb");
    }
    if (
      !bullet.includes("%") &&
      !bullet.includes("$") &&
      !bullet.match(/\d+/)
    ) {
      issues.push("No measurable impact");
    }
    return issues.length > 0
      ? issues
      : ["Consider adding more specific details"];
  };

  const improveBulletText = (bullet: string): string => {
    // Simple improvement logic - in real app this would use AI
    if (!bullet.match(/\d/)) {
      return bullet.replace(/^/, "Achieved 25% improvement in ").toLowerCase();
    }
    if (
      !bullet.match(
        /^(Achieved|Developed|Led|Managed|Improved|Created|Implemented)/i
      )
    ) {
      return "Developed and implemented " + bullet.toLowerCase();
    }
    return (
      bullet + ", resulting in improved team efficiency and client satisfaction"
    );
  };

  const determinePriority = (
    bullet: string
  ): "urgent" | "critical" | "optional" => {
    if (!bullet.match(/\d/) && bullet.length < 30) return "urgent";
    if (
      !bullet.match(
        /^(Achieved|Developed|Led|Managed|Improved|Created|Implemented)/i
      )
    )
      return "critical";
    return "optional";
  };

  const getBulletImpact = (bullet: string): string => {
    return "Stronger bullet points with quantifiable achievements significantly improve your chances of getting interviews and demonstrate real business impact.";
  };

  const handleFixExperience = (experience: ExperienceAnalysis) => {
    setSelectedExperience(experience);
    setSelectedBulletIndex(null); // Reset bullet index when opening experience
    setFixSidebarOpen(true);
  };

  const handleApplyBulletFix = (
    bulletIssue: BulletIssue,
    customText?: string
  ) => {
    const textToApply = customText || bulletIssue.suggestedText;
    const fixId = `exp-${selectedExperience?.experienceIndex}-bullet-${bulletIssue.bulletIndex}`;

    if (onApplyFix) {
      onApplyFix({
        section: "experience",
        experienceIndex: selectedExperience?.experienceIndex,
        bulletIndex: bulletIssue.bulletIndex,
        suggestedText: textToApply,
        issue: bulletIssue.issues.join(", "),
      });
    }

    setAppliedFixes((prev) => new Set([...prev, fixId]));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800 border-green-200";
      case "B":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "C":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "D":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      {/* Analysis Header with Overall Score on Right */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>CV Analysis</CardTitle>
            </div>

            {/* Overall Assessment - Top Right */}
            {analysis && (
              <div className="flex items-center space-x-4">
                <div
                  className={`px-3 py-1 rounded-full border font-bold text-lg ${getGradeColor(
                    analysis.overallGrade
                  )}`}
                >
                  {analysis.overallGrade}
                </div>
                <div className="text-right">
                  <p
                    className={`text-xl font-bold ${getScoreColor(
                      analysis.overallScore
                    )}`}
                  >
                    {analysis.overallScore}%
                  </p>
                  <p className="text-xs text-gray-600">Overall Score</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Get detailed feedback on your CV with actionable improvements
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{analysis ? "Re-analyze" : "Analyze CV"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Section Grades */}
          <Card>
            <CardHeader>
              <CardTitle>Section Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analysis.sections).map(([section, data]) => (
                  <div key={section} className="text-center">
                    <div
                      className={`mx-auto w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold ${getGradeColor(
                        data.grade
                      )}`}
                    >
                      {data.grade}
                    </div>
                    <p className="text-sm font-medium capitalize mt-2">
                      {section}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fix Sidebar */}
      {fixSidebarOpen && selectedExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="ml-auto bg-white w-2/3 h-full overflow-hidden flex">
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

                {selectedExperience.bulletIssues.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No bullet point issues found for this experience.</p>
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
