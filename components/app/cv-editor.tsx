"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wand2,
  Download,
  Briefcase,
  Save,
  History,
  FileText,
  Loader2,
  BarChart3,
  RefreshCw,
  Plus,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Linkedin,
  Eye,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { CVPreview } from "./cv-preview";
import { ExportSidebar } from "./export-sidebar";
import { DocxPreview } from "./docx-preview";
import { ExperienceCard } from "./experience-card";

interface CVEditorProps {
  document: {
    id: string;
    title: string;
    rawText: string;
    structured: string;
    versions: Array<{
      id: string;
      label: string;
      content: string;
      isActive: boolean;
      createdAt: string;
    }>;
  };
  structuredData: {
    sections: {
      summary?: string;
      experience: Array<{
        title: string;
        company: string;
        duration: string;
        bullets: string[];
      }>;
      education: Array<{
        degree: string;
        institution: string;
        year: string;
      }>;
      skills: string[];
      contact?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        website?: string;
        linkedin?: string;
      };
    };
  };
  latestAnalysis?: {
    id: string;
    overallScore: number;
    suggestions: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      section: string;
      impact: string;
    }>;
    jobTarget: {
      id: string;
      title: string;
      company: string | null;
    };
  } | null;
  user: {
    id: string;
    name?: string | null;
    plan?: string;
  };
  experienceAnalysis?: Array<{
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
  }> | null;
  selectedVersionId?: string | null;
  onVersionChange?: (versionId: string | null) => void;
  analyzedVersionIds?: string[];
}

export function CVEditor({
  document,
  structuredData,
  latestAnalysis,
  user,
  experienceAnalysis,
  selectedVersionId,
  onVersionChange,
  analyzedVersionIds,
}: CVEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [activeTab, setActiveTab] = useState("contact");
  const [exportSidebarOpen, setExportSidebarOpen] = useState(false);

  // Local versions list (keeps UI updated after saving)
  const [versions, setVersions] = useState(document.versions);

  // Editable content state
  const [editedContent, setEditedContent] = useState({
    contact: {
      name: structuredData.sections.contact?.name || user.name || "",
      email: structuredData.sections.contact?.email || "",
      phone: structuredData.sections.contact?.phone || "",
      location: structuredData.sections.contact?.location || "",
      website: structuredData.sections.contact?.website || "",
      linkedin: structuredData.sections.contact?.linkedin || "",
    },
    summary: structuredData.sections.summary || "",
    experience: structuredData.sections.experience || [],
    education: structuredData.sections.education || [],
    skills: structuredData.sections.skills || [],
  });

  // Sync editor when structuredData changes (e.g., version switch)
  useEffect(() => {
    setEditedContent({
      contact: {
        name: structuredData.sections.contact?.name || user.name || "",
        email: structuredData.sections.contact?.email || "",
        phone: structuredData.sections.contact?.phone || "",
        location: structuredData.sections.contact?.location || "",
        website: structuredData.sections.contact?.website || "",
        linkedin: structuredData.sections.contact?.linkedin || "",
      },
      summary: structuredData.sections.summary || "",
      experience: structuredData.sections.experience || [],
      education: structuredData.sections.education || [],
      skills: structuredData.sections.skills || [],
    });
  }, [structuredData]);

  const handleAIEdit = async (
    section: string,
    content: string,
    action: "rewrite" | "quantify" | "keyword_fit" | "tone_adjust"
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          action,
          content,
          section,
          context: latestAnalysis?.jobTarget
            ? `Job: ${latestAnalysis.jobTarget.title}`
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI editing failed");
      }

      const result = await response.json();

      // Update the edited content
      if (section === "summary") {
        setEditedContent((prev) => ({ ...prev, summary: result.editedText }));
      }

      setSuccess("AI edit applied successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to apply AI edit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    setIsLoading(true);
    setError("");

    try {
      const content = JSON.stringify(editedContent);

      const response = await fetch("/api/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          label: `Edited - ${new Date().toLocaleDateString()}`,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save version");
      }

      const saved = await response.json();

      // Try to update local versions list, fallback to refresh
      if (saved && saved.id) {
        const newVersion = {
          id: saved.id,
          label: saved.label || `Edited - ${new Date().toLocaleDateString()}`,
          content: saved.content || content,
          isActive: !!saved.isActive,
          createdAt: saved.createdAt || new Date().toISOString(),
        };
        setVersions((prev) => [newVersion, ...prev]);
        // Auto-select the newly saved version
        onVersionChange && onVersionChange(newVersion.id);
      } else {
        // Ensure UI updates if API didn't return the record
        router.refresh();
      }

      setSuccess("Version saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save version");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (
    format: "pdf" | "docx",
    template: string,
    settings: any
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          format,
          content: editedContent,
          template,
          settings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document.title}.${format}`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      setSuccess(`CV exported as ${format.toUpperCase()} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
      setExportSidebarOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to export CV");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeAnother = () => {
    router.push("/app/new");
  };

  const handleReanalyze = () => {
    if (latestAnalysis?.jobTarget?.id) {
      router.push(
        `/app/new?documentId=${document.id}&jobTargetId=${latestAnalysis.jobTarget.id}`
      );
    } else {
      router.push("/app/new");
    }
  };

  // Experience management functions
  const addExperience = () => {
    setEditedContent((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { title: "", company: "", duration: "", bullets: [""] },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setEditedContent((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setEditedContent((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const addExperienceBullet = (expIndex: number) => {
    setEditedContent((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIndex ? { ...exp, bullets: [...exp.bullets, ""] } : exp
      ),
    }));
  };

  const removeExperienceBullet = (expIndex: number, bulletIndex: number) => {
    setEditedContent((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIndex
          ? {
              ...exp,
              bullets: exp.bullets.filter((_, bi) => bi !== bulletIndex),
            }
          : exp
      ),
    }));
  };

  const updateExperienceBullet = (
    expIndex: number,
    bulletIndex: number,
    value: string
  ) => {
    setEditedContent((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === expIndex
          ? {
              ...exp,
              bullets: exp.bullets.map((bullet, bi) =>
                bi === bulletIndex ? value : bullet
              ),
            }
          : exp
      ),
    }));
  };

  // Education management functions
  const addEducation = () => {
    setEditedContent((prev) => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "" }],
    }));
  };

  const removeEducation = (index: number) => {
    setEditedContent((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setEditedContent((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  // Skills management functions
  const addSkill = () => {
    setEditedContent((prev) => ({
      ...prev,
      skills: [...prev.skills, ""],
    }));
  };

  const removeSkill = (index: number) => {
    setEditedContent((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const updateSkill = (index: number, value: string) => {
    setEditedContent((prev) => ({
      ...prev,
      skills: prev.skills.map((skill, i) => (i === index ? value : skill)),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>{document.title}</span>
              </CardTitle>
              <CardDescription>
                {latestAnalysis ? (
                  <span>
                    Last analyzed for {latestAnalysis.jobTarget.title}
                    {latestAnalysis.jobTarget.company &&
                      ` at ${latestAnalysis.jobTarget.company}`}{" "}
                    (Score: {latestAnalysis.overallScore}%)
                  </span>
                ) : (
                  "No recent analysis available"
                )}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleSaveVersion} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Save Version
              </Button>
              {onVersionChange && (
                <Select
                  value={selectedVersionId || "original"}
                  onValueChange={(value) => {
                    if (value === "original") {
                      onVersionChange(null);
                    } else {
                      onVersionChange(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Original Document</span>
                        {!selectedVersionId && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                        {(!analyzedVersionIds ||
                          !analyzedVersionIds.includes("original")) && (
                          <Badge variant="outline" className="text-[10px] ml-2">
                            Not analyzed
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{version.label}</span>
                          {selectedVersionId === version.id && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                          {(!analyzedVersionIds ||
                            !analyzedVersionIds.includes(version.id)) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] ml-2"
                            >
                              Not analyzed
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                onClick={() => setExportSidebarOpen(true)}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={handleAnalyzeAnother}
                disabled={isLoading}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Analyze Another Job
              </Button>
              {latestAnalysis && (
                <Button
                  variant="outline"
                  onClick={handleReanalyze}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-analyze
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>CV Content Editor</CardTitle>
              <CardDescription>
                Edit your CV sections and use AI assistance for improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                {/* Contact Information Tab */}
                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <Input
                          id="name"
                          value={editedContent.contact.name}
                          onChange={(e) =>
                            setEditedContent((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                name: e.target.value,
                              },
                            }))
                          }
                          placeholder="Your full name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <Input
                          id="email"
                          type="email"
                          value={editedContent.contact.email}
                          onChange={(e) =>
                            setEditedContent((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                email: e.target.value,
                              },
                            }))
                          }
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <Input
                          id="phone"
                          value={editedContent.contact.phone}
                          onChange={(e) =>
                            setEditedContent((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                phone: e.target.value,
                              },
                            }))
                          }
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <Input
                          id="location"
                          value={editedContent.contact.location}
                          onChange={(e) =>
                            setEditedContent((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                location: e.target.value,
                              },
                            }))
                          }
                          placeholder="City, State/Country"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <Input
                          id="website"
                          value={editedContent.contact.website}
                          onChange={(e) =>
                            setEditedContent((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                website: e.target.value,
                              },
                            }))
                          }
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Linkedin className="h-4 w-4 text-gray-500" />
                        <Input
                          id="linkedin"
                          value={editedContent.contact.linkedin}
                          onChange={(e) =>
                            setEditedContent((prev) => ({
                              ...prev,
                              contact: {
                                ...prev.contact,
                                linkedin: e.target.value,
                              },
                            }))
                          }
                          placeholder="linkedin.com/in/yourprofile"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4">
                  <div>
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={editedContent.summary}
                      onChange={(e) =>
                        setEditedContent((prev) => ({
                          ...prev,
                          summary: e.target.value,
                        }))
                      }
                      rows={6}
                      placeholder="Write your professional summary..."
                      className="mt-2"
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleAIEdit(
                            "summary",
                            editedContent.summary,
                            "rewrite"
                          )
                        }
                        disabled={isLoading || !editedContent.summary}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Rewrite
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleAIEdit(
                            "summary",
                            editedContent.summary,
                            "keyword_fit"
                          )
                        }
                        disabled={isLoading || !editedContent.summary}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Add Keywords
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleAIEdit(
                            "summary",
                            editedContent.summary,
                            "tone_adjust"
                          )
                        }
                        disabled={isLoading || !editedContent.summary}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Improve Tone
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent value="experience" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Work Experience</Label>
                    <Button onClick={addExperience} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>

                  {editedContent.experience.map((exp, index) => (
                    <ExperienceCard
                      key={index}
                      experience={exp}
                      index={index}
                      onUpdate={updateExperience}
                      onRemove={removeExperience}
                      onAddBullet={addExperienceBullet}
                      onUpdateBullet={updateExperienceBullet}
                      onRemoveBullet={removeExperienceBullet}
                      documentId={document.id}
                      analysis={experienceAnalysis?.find(
                        (analysis) => analysis.experienceIndex === index
                      )}
                    />
                  ))}

                  {editedContent.experience.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No work experience added yet.</p>
                      <Button
                        onClick={addExperience}
                        variant="outline"
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Experience
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Education</Label>
                    <Button onClick={addEducation} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </div>

                  {editedContent.education.map((edu, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Education {index + 1}</h4>
                        <Button
                          onClick={() => removeEducation(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <Label>Degree</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) =>
                              updateEducation(index, "degree", e.target.value)
                            }
                            placeholder="Bachelor of Science in Computer Science"
                          />
                        </div>
                        <div>
                          <Label>Institution</Label>
                          <Input
                            value={edu.institution}
                            onChange={(e) =>
                              updateEducation(
                                index,
                                "institution",
                                e.target.value
                              )
                            }
                            placeholder="University Name"
                          />
                        </div>
                        <div>
                          <Label>Year</Label>
                          <Input
                            value={edu.year}
                            onChange={(e) =>
                              updateEducation(index, "year", e.target.value)
                            }
                            placeholder="2020"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  {editedContent.education.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No education added yet.</p>
                      <Button
                        onClick={addEducation}
                        variant="outline"
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your Education
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Skills</Label>
                    <Button onClick={addSkill} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {editedContent.skills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={skill}
                          onChange={(e) => updateSkill(index, e.target.value)}
                          placeholder="Enter a skill"
                          className="flex-1"
                        />
                        <Button
                          onClick={() => removeSkill(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {editedContent.skills.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No skills added yet.</p>
                      <Button
                        onClick={addSkill}
                        variant="outline"
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Skill
                      </Button>
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Preview:</h4>
                    <div className="flex flex-wrap gap-2">
                      {editedContent.skills
                        .filter((skill) => skill.trim())
                        .map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Preview Tab */}
                {activeTab === "preview" && (
                  <TabsContent value="preview" className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">
                        Resume Preview
                      </h3>
                      <p className="text-sm text-gray-600">
                        This is how your resume will appear when exported
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <DocxPreview
                        content={editedContent}
                        template="standard"
                        settings={{
                          fontSize: 11,
                          lineSpacing: 1.2,
                          fontFamily: "times",
                          margins: "normal",
                          paperSize: "a4",
                        }}
                        className="transform scale-75 origin-top"
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length > 0 ? (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">{version.label}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(!analyzedVersionIds ||
                          !analyzedVersionIds.includes(version.id)) && (
                          <Badge variant="outline">Not analyzed</Badge>
                        )}
                        {selectedVersionId === version.id && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No versions saved yet. Save a version to track changes.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Sidebar */}
      <ExportSidebar
        isOpen={exportSidebarOpen}
        onClose={() => setExportSidebarOpen(false)}
        content={editedContent}
        onExport={handleExport}
        isLoading={isLoading}
      />
    </div>
  );
}
