export interface AnalysisResult {
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
    keywordOps: KeywordOpportunity[];
  };
  suggestions: Suggestion[];
}

export interface KeywordOpportunity {
  keyword: string;
  importance: "high" | "medium" | "low";
  context: string;
  suggestedPlacement: string[];
}

export interface Suggestion {
  id: string;
  section: string;
  excerpt: string;
  issue: string;
  fix: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  type: "keyword" | "quantification" | "phrasing" | "achievement" | "structure";
}

export interface CVStructure {
  sections: {
    summary?: string;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    skills: string[];
    certifications?: string[];
    projects?: ProjectEntry[];
  };
  metadata: {
    wordCount: number;
    bulletCount: number;
    quantifiedBullets: number;
    strongVerbs: number;
    yearsOfExperience?: number;
  };
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  location?: string;
  bullets: string[];
  startDate?: Date;
  endDate?: Date;
  isCurrent?: boolean;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
  location?: string;
  honors?: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface JobAnalysis {
  title: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requirements: string[];
  seniority: "junior" | "mid" | "senior" | "lead" | "executive";
  domain: string[];
}

export interface EditAction {
  type: "rewrite" | "quantify" | "keyword_fit" | "tone_adjust";
  target: string;
  context?: string;
  parameters?: Record<string, any>;
}

export interface VersionDiff {
  added: TextRange[];
  removed: TextRange[];
  modified: TextRange[];
}

export interface TextRange {
  start: number;
  end: number;
  text: string;
}

export interface AIProvider {
  name: string;
  generateAnalysis: (
    cvText: string,
    jobDescription: string
  ) => Promise<AnalysisResult>;
  editText: (prompt: string, action: EditAction) => Promise<string>;
  generateEmbeddings: (text: string) => Promise<number[]>;
  extractCVStructure: (cvText: string) => Promise<any>;
}

export type Plan = "FREE" | "PRO";
export type Role = "USER" | "ADMIN";
