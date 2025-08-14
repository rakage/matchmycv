import mammoth from "mammoth";
import {
  CVStructure,
  ExperienceEntry,
  EducationEntry,
  EditAction,
} from "./types";
import { getAIProvider } from "./ai/provider";
import pdf from "pdf-parse";

export async function extractTextFromFile(
  file: Buffer,
  mimeType: string
): Promise<string> {
  try {
    switch (mimeType) {
      case "application/pdf":
        try {
          const pdfData = await pdf(file);
          return pdfData.text;
        } catch (pdfError) {
          console.error("PDF parsing failed with pdf-parse:", pdfError);
          // For now, return a placeholder text that indicates PDF upload was successful
          // but text extraction failed. In production, you might want to use a different PDF library
          return `[PDF file uploaded successfully - ${file.length} bytes]\n\nNote: Text extraction from PDF failed. Please try uploading a DOCX version of your CV for better text extraction, or the system will use basic analysis.`;
        }

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        const docxResult = await mammoth.extractRawText({ buffer: file });
        return docxResult.value;

      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error("File extraction error:", error);
    throw new Error("Failed to extract text from file");
  }
}

export async function structureCVText(rawText: string): Promise<any> {
  try {
    // Use the AI provider's structured CV extraction method
    const aiProvider = getAIProvider();
    const structuredData = await aiProvider.extractCVStructure(rawText);

    // Validate and ensure all required sections exist with proper fallbacks
    const validatedData = {
      sections: {
        contact: {
          name: structuredData.sections?.contact?.name || "",
          email: structuredData.sections?.contact?.email || "",
          phone: structuredData.sections?.contact?.phone || "",
          location: structuredData.sections?.contact?.location || "",
          website: structuredData.sections?.contact?.website || "",
          linkedin: structuredData.sections?.contact?.linkedin || "",
        },
        summary: structuredData.sections?.summary || "",
        experience: Array.isArray(structuredData.sections?.experience)
          ? structuredData.sections.experience.map((exp: any) => ({
              title: exp.title || "",
              company: exp.company || "",
              duration: exp.duration || "",
              bullets: Array.isArray(exp.bullets)
                ? exp.bullets.filter(
                    (bullet: string) => bullet && bullet.trim()
                  )
                : [],
            }))
          : [],
        education: Array.isArray(structuredData.sections?.education)
          ? structuredData.sections.education.map((edu: any) => ({
              degree: edu.degree || "",
              institution: edu.institution || "",
              year: edu.year || "",
            }))
          : [],
        skills: Array.isArray(structuredData.sections?.skills)
          ? structuredData.sections.skills.filter(
              (skill: string) => skill && skill.trim()
            )
          : [],
      },
    };

    return validatedData;
  } catch (error: any) {
    console.error("AI CV structuring failed:", error);

    // If it's a rate limit error, throw it so the upload fails
    if (error.message && error.message.includes("Rate limit exceeded")) {
      throw error;
    }

    // For other errors, fall back to basic text extraction
    console.log("Falling back to basic text structure extraction...");

    return {
      sections: {
        contact: {
          name: "",
          email: extractEmail(rawText) || "",
          phone: extractPhone(rawText) || "",
          location: "",
          website: "",
          linkedin: extractLinkedIn(rawText) || "",
        },
        summary:
          extractSection(rawText, ["summary", "objective", "profile"]) || "",
        experience: extractBasicExperience(rawText),
        education: extractBasicEducation(rawText),
        skills: extractBasicSkills(rawText),
      },
    };
  }
}

// Helper functions for fallback extraction
function extractEmail(text: string): string | null {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const phoneRegex =
    /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}

function extractLinkedIn(text: string): string | null {
  const linkedinRegex =
    /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)[A-Za-z0-9-]+/i;
  const match = text.match(linkedinRegex);
  return match ? match[0] : null;
}

function extractSection(text: string, sectionNames: string[]): string | null {
  for (const sectionName of sectionNames) {
    const regex = new RegExp(
      `${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n\\s*[A-Z][A-Z\\s]+:|$)`,
      "i"
    );
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim().replace(/\n+/g, " ").substring(0, 500);
    }
  }
  return null;
}

function extractBasicExperience(text: string): any[] {
  // Basic pattern matching for experience sections
  const lines = text.split("\n");
  const experience = [];
  let currentExp: any = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Look for job titles and companies (basic pattern)
    if (
      trimmed.match(
        /\b(developer|engineer|manager|analyst|coordinator|assistant|director|specialist)\b/i
      )
    ) {
      if (currentExp) experience.push(currentExp);
      currentExp = {
        title: trimmed.split("|")[0]?.trim() || trimmed,
        company: trimmed.split("|")[1]?.trim() || "",
        duration: "",
        bullets: [],
      };
    } else if (currentExp && trimmed.match(/^\s*[-•*]/)) {
      currentExp.bullets.push(trimmed.replace(/^\s*[-•*]\s*/, ""));
    }
  }

  if (currentExp) experience.push(currentExp);
  return experience.slice(0, 5); // Limit to 5 entries
}

function extractBasicEducation(text: string): any[] {
  const educationKeywords = [
    "bachelor",
    "master",
    "phd",
    "degree",
    "university",
    "college",
    "institute",
  ];
  const lines = text.split("\n");
  const education = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      educationKeywords.some((keyword) =>
        trimmed.toLowerCase().includes(keyword)
      )
    ) {
      education.push({
        degree: trimmed,
        institution: "",
        year: "",
      });
    }
  }

  return education.slice(0, 3); // Limit to 3 entries
}

function extractBasicSkills(text: string): string[] {
  const skillKeywords = [
    "javascript",
    "python",
    "java",
    "react",
    "node",
    "sql",
    "html",
    "css",
    "leadership",
    "communication",
    "teamwork",
    "problem solving",
    "analytical",
  ];

  const foundSkills = [];
  const lowerText = text.toLowerCase();

  for (const skill of skillKeywords) {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  }

  return foundSkills.slice(0, 10); // Limit to 10 skills
}
