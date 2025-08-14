"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AnalysisResultsProps {
  analysis: {
    id: string;
    overallScore: number;
    subScores: {
      skillsFit: number;
      experience: number;
      keywordsATS: number;
      readability: number;
      seniority: number;
    };
    gaps: {
      missingSkills: string[];
      weakAreas: string[];
      keywordOps: Array<{
        keyword: string;
        importance: string;
        currentMentions: number;
      }>;
    };
    suggestions: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      section: string;
      impact: string;
    }>;
    createdAt: Date;
    document: {
      id: string;
      title: string;
      mimeType: string;
    };
    jobTarget: {
      id: string;
      title: string;
      company: string | null;
    };
  };
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <Target className="h-4 w-4" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const handleExport = () => {
    // Placeholder for export logic
    alert("Export functionality not yet implemented.");
  };

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Overall Match Score</CardTitle>
          <CardDescription>
            How well your CV matches the job requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div
            className={`text-6xl font-bold ${getScoreColor(
              analysis.overallScore
            )}`}
          >
            {analysis.overallScore}%
          </div>
          <Progress value={analysis.overallScore} className="mt-4 h-3" />
          <p className="mt-2 text-gray-600">
            {analysis.overallScore >= 80 &&
              "Excellent match! Your CV is well-aligned with this role."}
            {analysis.overallScore >= 60 &&
              analysis.overallScore < 80 &&
              "Good match with room for improvement."}
            {analysis.overallScore < 60 &&
              "Significant improvements needed to better match this role."}
          </p>
        </CardContent>
      </Card>

      {/* Sub Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>
            Individual scoring categories and their contributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Object.entries(analysis.subScores).map(([category, score]) => (
              <div key={category} className="text-center">
                <div
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getScoreBackground(
                    score
                  )}`}
                >
                  <span className={`text-xl font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
                <h4 className="mt-2 font-medium capitalize">
                  {category.replace(/([A-Z])/g, " $1").trim()}
                </h4>
                <Progress value={score} className="mt-1 h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gaps Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
              Missing Skills
            </CardTitle>
            <CardDescription>
              Skills mentioned in the job description but not in your CV
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.gaps.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.gaps.missingSkills.map((skill, index) => (
                  <Badge key={index} variant="destructive">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-green-600 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                All required skills are present in your CV!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weak Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              Aspects of your CV that could be strengthened
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.gaps.weakAreas.length > 0 ? (
              <ul className="space-y-2">
                {analysis.gaps.weakAreas.map((area, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <span className="text-sm">{area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-green-600 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                No significant weak areas identified!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Keyword Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Keyword Opportunities
          </CardTitle>
          <CardDescription>
            Important keywords from the job description and their current usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.gaps.keywordOps.map((keyword, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{keyword.keyword}</span>
                  <Badge
                    variant={
                      keyword.importance === "high"
                        ? "destructive"
                        : keyword.importance === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {keyword.importance}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Current mentions: {keyword.currentMentions}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
            Improvement Suggestions
          </CardTitle>
          <CardDescription>
            Actionable recommendations to improve your CV match score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.suggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon(suggestion.priority)}
                    <h4 className="font-medium">{suggestion.title}</h4>
                  </div>
                  <Badge className={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority} priority
                  </Badge>
                </div>
                <p className="text-gray-700 mb-3">{suggestion.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Target section:{" "}
                    <span className="font-medium">{suggestion.section}</span>
                  </span>
                  <span className="text-green-600 font-medium">
                    {suggestion.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            What would you like to do with these results?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => router.push(`/app/editor/${analysis.document.id}`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Edit CV with AI
            </Button>
            <Button variant="outline" onClick={() => handleExport()}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" onClick={() => router.push("/app/new")}>
              <Briefcase className="h-4 w-4 mr-2" />
              Analyze Another Job
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
