"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Zap,
  Loader2,
  CheckCircle,
  X,
  Edit3,
  BarChart3,
} from "lucide-react";

interface ExperienceCardProps {
  experience: {
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  };
  index: number;
  onUpdate: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  onAddBullet: (index: number) => void;
  onUpdateBullet: (index: number, bulletIndex: number, value: string) => void;
  onRemoveBullet: (index: number, bulletIndex: number) => void;
  onApplyFix?: (fix: any) => void;
  documentId?: string;
  analysis?: {
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
  } | null;
}

interface BulletIssue {
  bulletIndex: number;
  originalText: string;
  issues: string[];
  suggestedText: string;
  priority: "urgent" | "critical" | "optional";
  impact: string;
}

interface ExperienceAnalysis {
  overallIssues: {
    urgent: number;
    critical: number;
    optional: number;
  };
  bulletIssues: BulletIssue[];
}

export function ExperienceCard({
  experience,
  index,
  onUpdate,
  onRemove,
  onAddBullet,
  onUpdateBullet,
  onRemoveBullet,
  onApplyFix,
  analysis,
  documentId,
}: ExperienceCardProps) {
  const [fixSidebarOpen, setFixSidebarOpen] = useState(false);
  const [selectedBulletIndex, setSelectedBulletIndex] = useState<number | null>(
    null
  );
  const [userEdits, setUserEdits] = useState<{ [key: string]: string }>({});
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [updatedAnalysis, setUpdatedAnalysis] = useState(analysis);

  useEffect(() => {
    setUpdatedAnalysis(analysis);
  }, [analysis]);

  const handleFixExperience = () => {
    setSelectedBulletIndex(0); // Auto-select first bullet point
    setFixSidebarOpen(true);
  };

  const handleApplyBulletFix = async (
    bulletIssue: BulletIssue,
    customText?: string
  ) => {
    const textToApply = customText || bulletIssue.suggestedText;
    const fixId = `exp-${index}-bullet-${bulletIssue.bulletIndex}`;

    // Apply the fix to the actual bullet text
    onUpdateBullet(index, bulletIssue.bulletIndex, textToApply);

    // Track that this fix has been applied
    setAppliedFixes((prev) => new Set([...prev, fixId]));

    // Update local analysis to reduce the count for this priority
    if (updatedAnalysis) {
      setUpdatedAnalysis((prev) => {
        if (!prev) return prev;

        const newAnalysis = { ...prev };
        const priority =
          bulletIssue.priority as keyof typeof prev.overallIssues;

        // Decrease the count for this priority
        if (newAnalysis.overallIssues[priority] > 0) {
          newAnalysis.overallIssues[priority] -= 1;
        }

        return newAnalysis;
      });
    }

    // Update the database to track applied fix
    if (documentId) {
      try {
        await fetch("/api/update-applied-fixes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId,
            experienceIndex: index,
            bulletIndex: bulletIssue.bulletIndex,
            fixType: bulletIssue.priority,
          }),
        });
      } catch (error) {
        console.error("Failed to update applied fix in database:", error);
        // Continue anyway, as the local state has been updated
      }
    }

    if (onApplyFix) {
      onApplyFix({
        section: "experience",
        experienceIndex: index,
        bulletIndex: bulletIssue.bulletIndex,
        suggestedText: textToApply,
        issue: bulletIssue.issues.join(", "),
      });
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
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h4 className="font-medium">
              {experience.title || `Experience ${index + 1}`}
            </h4>
            {experience.company && (
              <span className="text-sm text-gray-600">
                {experience.company}
              </span>
            )}

            {/* Analysis Results */}
            {updatedAnalysis && (
              <div className="flex items-center space-x-2">
                {updatedAnalysis.overallIssues.urgent > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {updatedAnalysis.overallIssues.urgent} Urgent
                  </Badge>
                )}
                {updatedAnalysis.overallIssues.critical > 0 && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-200 text-xs"
                  >
                    {updatedAnalysis.overallIssues.critical} Critical
                  </Badge>
                )}
                {updatedAnalysis.overallIssues.optional > 0 && (
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200 text-xs"
                  >
                    {updatedAnalysis.overallIssues.optional} Optional
                  </Badge>
                )}
                {updatedAnalysis.overallIssues.urgent === 0 &&
                  updatedAnalysis.overallIssues.critical === 0 &&
                  updatedAnalysis.overallIssues.optional === 0 && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200 text-xs"
                    >
                      ✓ All Fixed
                    </Badge>
                  )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {updatedAnalysis && (
              <>
                {updatedAnalysis.overallIssues.urgent > 0 ||
                updatedAnalysis.overallIssues.critical > 0 ||
                updatedAnalysis.overallIssues.optional > 0 ? (
                  <Button
                    size="sm"
                    onClick={handleFixExperience}
                    className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                  >
                    <Zap className="h-3 w-3" />
                    <span>FIX</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled
                    className="flex items-center space-x-1 bg-green-100 text-green-700 border border-green-300"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>All Applied</span>
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={() => onRemove(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <Label>Job Title</Label>
            <Input
              value={experience.title}
              onChange={(e) => onUpdate(index, "title", e.target.value)}
              placeholder="Software Engineer"
            />
          </div>
          <div>
            <Label>Company</Label>
            <Input
              value={experience.company}
              onChange={(e) => onUpdate(index, "company", e.target.value)}
              placeholder="Company Name"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Duration</Label>
            <Input
              value={experience.duration}
              onChange={(e) => onUpdate(index, "duration", e.target.value)}
              placeholder="Jan 2020 - Present"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Key Achievements</Label>
            <Button
              onClick={() => onAddBullet(index)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Point
            </Button>
          </div>
          {experience.bullets.map((bullet, bulletIndex) => (
            <div key={bulletIndex} className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-500">•</span>
              <Input
                value={bullet}
                onChange={(e) =>
                  onUpdateBullet(index, bulletIndex, e.target.value)
                }
                placeholder="Describe your achievement or responsibility"
                className="flex-1"
              />
              <Button
                onClick={() => onRemoveBullet(index, bulletIndex)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Remove separate analysis status since it's now in the button */}
      </Card>

      {/* Fix Sidebar */}
      {fixSidebarOpen && updatedAnalysis && (
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
                {updatedAnalysis.bulletIssues.map((bulletIssue, idx) => {
                  const bulletId = `exp-${index}-bullet-${bulletIssue.bulletIndex}`;
                  const isApplied = appliedFixes.has(bulletId);
                  const isSelected = selectedBulletIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-3 mb-2 rounded-lg cursor-pointer border transition-colors ${
                        isSelected
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedBulletIndex(idx)}
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
                      {experience.title} at {experience.company}
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
                {updatedAnalysis.bulletIssues.length > 0 &&
                  selectedBulletIndex !== null && (
                    <div>
                      {(() => {
                        const bulletIssue =
                          updatedAnalysis.bulletIssues[selectedBulletIndex];
                        const bulletId = `exp-${index}-bullet-${bulletIssue.bulletIndex}`;
                        const isApplied = appliedFixes.has(bulletId);

                        return (
                          <Card className="border-l-4 border-l-blue-200">
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-4">
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

                              <div className="space-y-4">
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
                              </div>
                            </div>
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
    </>
  );
}
