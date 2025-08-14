"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, X, Edit3, Zap, BarChart3 } from "lucide-react";

interface ExperienceAnalysisProps {
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  onApplyFix?: (fix: any) => void;
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

export function ExperienceAnalysis({
  experience,
  onApplyFix,
}: ExperienceAnalysisProps) {
  const [experienceAnalysis, setExperienceAnalysis] = useState<
    ExperienceAnalysis[]
  >([]);
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

  const handleAnalyzeExperience = async () => {
    setIsLoading(true);
    setError("");

    try {
      const analysis = analyzeExperience(experience);
      setExperienceAnalysis(analysis);
    } catch (err: any) {
      setError(err.message || "Failed to analyze experience");
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeExperience = (experienceData: any[]): ExperienceAnalysis[] => {
    const analysis: ExperienceAnalysis[] = [];

    experienceData.forEach((exp, index) => {
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

        analysis.push({
          experienceIndex: index,
          title: exp.title,
          company: exp.company,
          overallIssues,
          bulletIssues,
        });
      }
    });

    return analysis;
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

  // Get analysis for a specific experience
  const getExperienceAnalysis = (expIndex: number) => {
    return experienceAnalysis.find(
      (analysis) => analysis.experienceIndex === expIndex
    );
  };

  return (
    <div className="space-y-4">
      {/* Analysis Trigger */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Experience Analysis</span>
            </CardTitle>
            <Button
              onClick={handleAnalyzeExperience}
              disabled={isLoading || experience.length === 0}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {experienceAnalysis.length > 0
                ? "Re-analyze"
                : "Analyze Experience"}
            </Button>
          </div>
        </CardHeader>
        {experience.length === 0 && (
          <CardContent>
            <p className="text-sm text-gray-600">
              Add work experience entries to analyze their effectiveness
            </p>
          </CardContent>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Experience Analysis Integrated into Experience Cards */}
      {experienceAnalysis.length > 0 &&
        experience.map((exp, index) => {
          const analysis = getExperienceAnalysis(index);
          if (!analysis) return null;

          return (
            <Card key={index} className="border-l-4 border-l-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{exp.title}</h3>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2 text-xs">
                      {analysis.overallIssues.urgent > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {analysis.overallIssues.urgent} Urgent
                        </Badge>
                      )}
                      {analysis.overallIssues.critical > 0 && (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-200"
                        >
                          {analysis.overallIssues.critical} Critical
                        </Badge>
                      )}
                      {analysis.overallIssues.optional > 0 && (
                        <Badge
                          variant="outline"
                          className="text-blue-600 border-blue-200"
                        >
                          {analysis.overallIssues.optional} Optional
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleFixExperience(analysis)}
                      className="flex items-center space-x-1"
                    >
                      <Zap className="h-3 w-3" />
                      <span>FIX</span>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {analysis.bulletIssues.length} bullet points analyzed with
                  improvement suggestions
                </p>
              </CardContent>
            </Card>
          );
        })}

      {/* Fix Sidebar */}
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
