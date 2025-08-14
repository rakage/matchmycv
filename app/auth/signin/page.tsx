import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Target } from "lucide-react";
import { SignInForm } from "@/components/auth/signin-form";
import { getCurrentUser } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your MatchMyCV account",
};

export default async function SignInPage() {
  // Redirect authenticated users to dashboard
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                MatchMyCV
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <SignInForm />
          </div>
        </div>
      </div>

      {/* Right side - Image/Info */}
      <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="relative flex items-center justify-center h-full p-10">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-6">
              Get your CV job-ready in minutes
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-lg">
              Join thousands of successful job seekers who've optimized their
              CVs with AI-powered analysis.
            </p>
            <div className="space-y-4 text-left text-blue-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-300 rounded-full mr-3" />
                <span>ATS-friendly scoring and recommendations</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-300 rounded-full mr-3" />
                <span>AI-powered editing and optimization</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-300 rounded-full mr-3" />
                <span>Export to PDF and DOCX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
