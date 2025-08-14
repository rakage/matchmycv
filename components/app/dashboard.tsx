"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Target, BarChart3, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  plan: string;
  credits: number;
}

interface AppDashboardProps {
  user: User;
}

export function AppDashboard({ user }: AppDashboardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const isPro = user.plan === "PRO";
  const usagePercentage = isPro
    ? 0
    : Math.min(((5 - user.credits) / 5) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">
                  MatchMyCV
                </span>
              </div>
              <Badge variant={isPro ? "default" : "secondary"}>
                {isPro ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </>
                ) : (
                  "Free"
                )}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span>{user.name || "User"}</span>
                <span>•</span>
                <span>
                  {isPro ? "Unlimited" : `${user.credits} credits left`}
                </span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/app/settings">Settings</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-gray-600">
            Ready to optimize your CV for your next opportunity?
          </p>
        </div>

        {/* Usage Card for Free Users */}
        {!isPro && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Free Plan Usage</CardTitle>
                  <CardDescription>
                    {user.credits} of 5 analyses remaining this month
                  </CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/pricing">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Analyses used</span>
                  <span>{5 - user.credits}/5</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-200 hover:border-blue-300">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Start New Analysis</CardTitle>
              <CardDescription>
                Upload your CV and job description to get instant feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full">
                <Link href="/app/new">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">My Documents</CardTitle>
              <CardDescription>
                View and manage your uploaded CVs and versions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="outline" className="w-full">
                <Link href="/app/documents">View Documents</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Analysis History</CardTitle>
              <CardDescription>
                Review past analyses and improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild variant="outline" className="w-full">
                <Link href="/app/history">View History</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Recent Analyses
              </CardTitle>
              <CardDescription>Your latest CV analysis results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No analyses yet</p>
                <p className="text-sm mt-1">
                  Upload your first CV to get started
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-green-600" />
                Quick Tips
              </CardTitle>
              <CardDescription>Maximize your CV's impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Use action verbs</h4>
                  <p className="text-sm text-gray-600">
                    Start bullets with words like "achieved", "developed", "led"
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Quantify achievements</h4>
                  <p className="text-sm text-gray-600">
                    Include numbers, percentages, and measurable outcomes
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Match keywords</h4>
                  <p className="text-sm text-gray-600">
                    Include relevant skills and terms from the job description
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
