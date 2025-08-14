import { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  History,
  BarChart3,
  TrendingUp,
  Users,
  Crown,
  Lightbulb,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your CV analysis dashboard",
};

export default async function AppPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null; // This shouldn't happen due to layout protection
  }

  // Fetch user's recent data
  const [documents, analyses, recentAnalyses] = await Promise.all([
    db.document.count({ where: { userId: user.id } }),
    db.analysis.count({ where: { userId: user.id } }),
    db.analysis.findMany({
      where: { userId: user.id },
      include: {
        document: { select: { title: true } },
        jobTarget: { select: { title: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const creditsUsed = user.plan === "FREE" ? 5 - (user.credits || 0) : 0;
  const creditsProgress = user.plan === "FREE" ? (creditsUsed / 5) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name || "there"}!
        </h1>
        <p className="mt-2 text-gray-600">
          Ready to optimize your CV and land your dream job?
        </p>
      </div>

      {/* Usage Stats for Free Users */}
      {user.plan === "FREE" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Free Plan Usage</CardTitle>
                <CardDescription>
                  {user.credits || 0} of 5 analyses remaining this month
                </CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/app/settings">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={creditsProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents}</div>
            <p className="text-xs text-muted-foreground">
              CV documents uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyses}</div>
            <p className="text-xs text-muted-foreground">
              CV analyses completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentAnalyses.length > 0
                ? Math.round(
                    recentAnalyses.reduce((acc, a) => acc + a.overallScore, 0) /
                      recentAnalyses.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Average match score</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/app/new">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <span>Start New Analysis</span>
              </CardTitle>
              <CardDescription>
                Upload your CV and get AI-powered recommendations
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/app/documents">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span>My Documents</span>
              </CardTitle>
              <CardDescription>
                View and manage your uploaded CV documents
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/app/history">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5 text-purple-600" />
                <span>Analysis History</span>
              </CardTitle>
              <CardDescription>
                Review your past CV analyses and improvements
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>
              Your latest CV optimization results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{analysis.document.title}</h4>
                    <p className="text-sm text-gray-600">
                      for {analysis.jobTarget.title}
                      {analysis.jobTarget.company &&
                        ` at ${analysis.jobTarget.company}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {analysis.overallScore}%
                      </div>
                      <div className="text-xs text-gray-500">match</div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/analysis/${analysis.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span>Quick Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Tailor for each job</p>
                <p className="text-gray-600">
                  Customize your CV for each specific role to improve match
                  scores
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Use action verbs</p>
                <p className="text-gray-600">
                  Start bullet points with strong action verbs like "Led",
                  "Improved", "Built"
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Quantify achievements</p>
                <p className="text-gray-600">
                  Include numbers and percentages to demonstrate your impact
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Keywords matter</p>
                <p className="text-gray-600">
                  Include relevant keywords from the job description in your CV
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
