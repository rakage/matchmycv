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

export interface CVContent {
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
  };
  summary?: string;
  skills?: string[];
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  sections?: CVContent; // For nested structure
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration?: string;
  bullets?: string[];
  experienceIndex?: number;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year?: string;
}

export interface ExportSettings {
  fontSize?: number;
  lineSpacing?: number;
  fontFamily?: string;
  margins?: string;
  paperSize?: string;
}

export interface CVStructure {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    website?: string;
    linkedin?: string;
  };
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
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

export interface ActionTarget {
  type: "section" | "experience" | "education" | "skill";
  target: string;
  context?: string;
  parameters?: Record<string, string | number | boolean>;
}

export interface AIProvider {
  name: string;
  generateAnalysis: (
    cvText: string,
    jobDescription: string
  ) => Promise<AnalysisResult>;
  editText: (prompt: string, action: EditAction) => Promise<string>;
  generateEmbeddings: (text: string) => Promise<number[]>;
  extractCVStructure: (cvText: string) => Promise<CVStructure>;
}

export type Plan = "FREE" | "PRO";
export type Role = "USER" | "ADMIN";
