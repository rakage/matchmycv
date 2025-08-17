"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Briefcase,
  Loader2,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { jobTargetSchema, type JobTargetInput } from "@/lib/validations";

interface ExistingDocument {
  id: string;
  title: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  versions: Array<{
    id: string;
    label: string;
    createdAt: string;
  }>;
}

export function NewAnalysisForm() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "job-description" | "analyzing">(
    "upload"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Document selection state
  const [documentMode, setDocumentMode] = useState<"existing" | "new">(
    "existing"
  );
  const [existingDocuments, setExistingDocuments] = useState<
    ExistingDocument[]
  >([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );

  // CV Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [uploadedDocument, setUploadedDocument] = useState<any>(null);

  // Job Description state
  const [jobData, setJobData] = useState<JobTargetInput>({
    title: "",
    company: "",
    description: "",
  });

  // Fetch existing documents on component mount
  useEffect(() => {
    fetchExistingDocuments();
  }, []);

  const fetchExistingDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setExistingDocuments(data.documents || []);
        // Default to new upload if no existing documents
        if (data.documents?.length === 0) {
          setDocumentMode("new");
        }
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocumentMode("new");
    }
  };

  const handleDocumentSelect = async (documentId: string) => {
    setSelectedDocumentId(documentId);
    const document = existingDocuments.find((doc) => doc.id === documentId);
    if (document) {
      setSelectedDocument(document);
      // Auto-select the latest version if available
      if (document.versions && document.versions.length > 0) {
        setSelectedVersionId(document.versions[0].id);
      } else {
        setSelectedVersionId(null); // Use original document
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file already exists
      const existingDoc = existingDocuments.find(
        (doc) =>
          doc.title === file.name.replace(/\.[^/.]+$/, "") ||
          doc.title === file.name
      );

      if (existingDoc) {
        setError(
          `A document with this name already exists: "${existingDoc.title}". Please choose a different file or select the existing document.`
        );
        return;
      }

      setSelectedFile(file);
      setError(""); // Clear any previous errors
      // Auto-generate title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setDocumentTitle(nameWithoutExt);
    }
  };

  const handleContinueWithExisting = () => {
    if (!selectedDocument) {
      setError("Please select a document to continue");
      return;
    }

    setUploadedDocument(selectedDocument);
    setStep("job-description");
  };

  const handleUploadCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !documentTitle.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", documentTitle.trim());

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const document = await response.json();

      // Validate that we got a proper document response
      if (!document.document || !document.document.id) {
        throw new Error("Invalid response from server - missing document data");
      }

      setUploadedDocument(document.document);

      // Refresh the documents list
      await fetchExistingDocuments();

      // Only proceed to next step if everything is successful
      setStep("job-description");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload CV");
      // Stay on upload step when there's an error
      // Don't change the step, let user retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobDescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate that we have the uploaded document
      if (!uploadedDocument || !uploadedDocument.id) {
        throw new Error(
          "No document uploaded. Please go back and upload your CV first."
        );
      }

      const validatedData = jobTargetSchema.parse(jobData);

      // Create job target
      const jobResponse = await fetch("/api/job-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      if (!jobResponse.ok) {
        const errorData = await jobResponse.json();
        throw new Error(errorData.error || "Failed to create job target");
      }

      const jobTargetResponse = await jobResponse.json();

      // Validate job target response
      if (!jobTargetResponse.jobTarget || !jobTargetResponse.jobTarget.id) {
        throw new Error(
          "Invalid response from server - missing job target data"
        );
      }

      // Only proceed to analysis step if job target creation is successful
      setStep("analyzing");

      // Start analysis
      const analysisPayload = {
        documentId: uploadedDocument.id,
        versionId: selectedVersionId, // Add version selection
        jobTargetId: jobTargetResponse.jobTarget.id,
      };

      console.log("Analysis payload:", analysisPayload); // Debug logging

      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysisPayload),
      });
      console.log("Analysis response:", analysisResponse); // Debug logging

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const analysis = await analysisResponse.json();
      console.log("Analysis:", analysis); // Debug logging

      // Validate analysis response - check for nested analysis.id
      if (!analysis.analysis || !analysis.analysis.id) {
        throw new Error("Invalid response from server - missing analysis data");
      }

      // Redirect to results using the nested analysis ID
      router.push(`/app/analysis/${analysis.analysis.id}`);
    } catch (err: any) {
      console.error("Job description/analysis error:", err);

      if (err.issues) {
        setError(err.issues[0].message);
      } else {
        setError(err.message || "Failed to analyze CV");
      }

      // If we were in analyzing step and failed, go back to job-description
      // If we failed before analyzing step, stay on job-description
      setStep("job-description");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "analyzing") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <h3 className="mt-4 text-lg font-medium">Analyzing your CV...</h3>
            <p className="mt-2 text-gray-600">
              Our AI is comparing your CV against the job requirements. This may
              take a moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div
          className={`flex items-center space-x-2 ${
            step === "upload"
              ? "text-blue-600"
              : step === "job-description"
              ? "text-green-600"
              : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "upload"
                ? "bg-blue-100"
                : step === "job-description"
                ? "bg-green-100"
                : "bg-gray-100"
            }`}
          >
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Upload CV</span>
        </div>
        <div
          className={`w-16 h-0.5 ${
            step === "job-description" ? "bg-blue-600" : "bg-gray-200"
          }`}
        />
        <div
          className={`flex items-center space-x-2 ${
            step === "job-description" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === "job-description" ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Job Description</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Upload CV */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your CV</CardTitle>
            <CardDescription>
              Select an existing document or upload a new CV
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Document Mode Toggle */}
            <div className="mb-6">
              <Label className="text-base font-medium">Document Source</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={documentMode === "existing" ? "default" : "outline"}
                  onClick={() => setDocumentMode("existing")}
                  disabled={existingDocuments.length === 0}
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Use Existing ({existingDocuments.length})
                </Button>
                <Button
                  type="button"
                  variant={documentMode === "new" ? "default" : "outline"}
                  onClick={() => setDocumentMode("new")}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New
                </Button>
              </div>
            </div>

            {/* Existing Document Selection */}
            {documentMode === "existing" && existingDocuments.length > 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="document-select">Select Document</Label>
                  <Select
                    value={selectedDocumentId}
                    onValueChange={handleDocumentSelect}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a CV document..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingDocuments.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{doc.title}</span>
                            <span className="text-xs text-gray-500">
                              {doc.mimeType === "application/pdf"
                                ? "PDF"
                                : "DOCX"}{" "}
                              • {(doc.fileSize / 1024 / 1024).toFixed(1)} MB •{" "}
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDocument && (
                  <div className="space-y-4">
                    {/* Document Info */}
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-green-800">
                        <FileText className="h-4 w-4 mr-2" />
                        <div>
                          <span className="text-sm font-medium">
                            Selected: {selectedDocument.title}
                          </span>
                          <p className="text-xs text-green-600">
                            {selectedDocument.mimeType === "application/pdf"
                              ? "PDF"
                              : "DOCX"}{" "}
                            •{" "}
                            {(selectedDocument.fileSize / 1024 / 1024).toFixed(
                              1
                            )}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Version Selection */}
                    <div>
                      <Label htmlFor="version-select">Select Version</Label>
                      <Select
                        value={selectedVersionId || "original"}
                        onValueChange={(value) =>
                          setSelectedVersionId(
                            value === "original" ? null : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a version..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>Original Document</span>
                            </div>
                          </SelectItem>
                          {selectedDocument.versions?.map((version: any) => (
                            <SelectItem key={version.id} value={version.id}>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <div>
                                  <span>{version.label}</span>
                                  <p className="text-xs text-gray-500">
                                    {new Date(
                                      version.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedVersionId
                          ? "Using selected version for analysis"
                          : "Using original document for analysis"}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleContinueWithExisting}
                  disabled={!selectedDocument}
                  className="w-full"
                >
                  Continue with Selected Document
                </Button>
              </div>
            )}

            {/* New Document Upload */}
            {documentMode === "new" && (
              <form onSubmit={handleUploadCV} className="space-y-4">
                <div>
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="e.g., John Smith - Software Engineer CV"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="file">CV File</Label>
                  <div className="mt-1">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileSelect}
                      required
                    />
                  </div>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {selectedFile.name} (
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!selectedFile || !documentTitle.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CV
                    </>
                  )}
                </Button>
              </form>
            )}

            {existingDocuments.length === 0 && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  No existing documents found. Please upload your first CV
                  document.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Job Description */}
      {step === "job-description" && (
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
            <CardDescription>
              Paste the job description you want to optimize your CV for
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show uploaded document info */}
            {uploadedDocument && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-800">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    CV uploaded successfully: {uploadedDocument.title}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleJobDescriptionSubmit} className="space-y-4">
              <div>
                <Label htmlFor="job-title">Job Title *</Label>
                <Input
                  id="job-title"
                  value={jobData.title}
                  onChange={(e) =>
                    setJobData({ ...jobData, title: e.target.value })
                  }
                  placeholder="e.g., Senior Frontend Developer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="company">Company (optional)</Label>
                <Input
                  id="company"
                  value={jobData.company || ""}
                  onChange={(e) =>
                    setJobData({ ...jobData, company: e.target.value })
                  }
                  placeholder="e.g., Google, Microsoft, etc."
                />
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={jobData.description}
                  onChange={(e) =>
                    setJobData({ ...jobData, description: e.target.value })
                  }
                  placeholder="Paste the full job description here..."
                  rows={10}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 50 characters required
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("upload")}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !jobData.title ||
                    !jobData.description ||
                    jobData.description.length < 50 ||
                    isLoading
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Start Analysis"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
