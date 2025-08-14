import { Metadata } from "next";
import { NewAnalysisForm } from "@/components/app/new-analysis-form";

export const metadata: Metadata = {
  title: "New Analysis",
  description:
    "Upload your CV and job description to get started with AI-powered analysis",
};

export default function NewAnalysisPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Start New CV Analysis
        </h1>
        <p className="mt-2 text-gray-600">
          Upload your CV and paste the job description to get personalized
          recommendations
        </p>
      </div>

      <NewAnalysisForm />
    </div>
  );
}
