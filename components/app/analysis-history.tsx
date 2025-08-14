"use client";

import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  FileText,
  Calendar,
  BarChart3,
  Eye,
  Building,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AnalysisWithRelations {
  id: string;
  overallScore: number;
  subScores: string; // JSON string
  createdAt: string;
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
}

interface AnalysisHistoryProps {
  analyses: AnalysisWithRelations[];
}

function getScoreBadgeVariant(score: number) {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

function getScoreIcon(score: number) {
  if (score >= 80) return <TrendingUp className="h-4 w-4" />;
  if (score >= 60) return <Minus className="h-4 w-4" />;
  return <TrendingDown className="h-4 w-4" />;
}

export function AnalysisHistory({ analyses }: AnalysisHistoryProps) {
  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No analyses yet
            </h3>
            <p className="mt-2 text-gray-500">
              Start your first CV analysis to see results here.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/app/new">Start Your First Analysis</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Analyses</CardTitle>
        <CardDescription>
          {analyses.length} analysis{analyses.length === 1 ? "" : "es"}{" "}
          completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CV Document</TableHead>
                <TableHead>Job Position</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((analysis) => {
                let subScores;
                try {
                  subScores = JSON.parse(analysis.subScores);
                } catch {
                  subScores = {};
                }

                return (
                  <TableRow key={analysis.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">
                            {analysis.document.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {analysis.document.mimeType === "application/pdf"
                              ? "PDF"
                              : "DOCX"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{analysis.jobTarget.title}</p>
                    </TableCell>
                    <TableCell>
                      {analysis.jobTarget.company ? (
                        <div className="flex items-center space-x-1">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {analysis.jobTarget.company}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getScoreIcon(analysis.overallScore)}
                        <Badge
                          variant={getScoreBadgeVariant(analysis.overallScore)}
                        >
                          {analysis.overallScore}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span
                          title={format(new Date(analysis.createdAt), "PPpp")}
                        >
                          {formatDistanceToNow(new Date(analysis.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/app/analysis/${analysis.id}`}>
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {analyses.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing {analyses.length} analyses
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
