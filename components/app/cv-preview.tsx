"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react";

interface CVPreviewProps {
  content: {
    contact: {
      name: string;
      email: string;
      phone: string;
      location: string;
      website: string;
      linkedin: string;
    };
    summary: string;
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
  };
  template?: string;
  settings?: {
    fontFamily?: string;
    fontSize?: number;
    lineSpacing?: number;
    margins?: string;
  };
}

export function CVPreview({
  content,
  template = "standard",
  settings = {},
}: CVPreviewProps) {
  const fontFamily = getFontFamily(settings.fontFamily || "times");
  const fontSize = settings.fontSize || 11;
  const lineSpacing = settings.lineSpacing || 1.2;
  const isCompact = template === "compact";

  const headerSize = isCompact ? "text-2xl" : "text-3xl";
  const sectionHeaderSize = isCompact ? "text-lg" : "text-xl";
  const contactSize = isCompact ? "text-xs" : "text-sm";
  const bodySize =
    fontSize < 11 ? "text-sm" : fontSize > 13 ? "text-base" : "text-sm";

  const sectionSpacing = isCompact ? "space-y-4" : "space-y-6";
  const itemSpacing = isCompact ? "space-y-3" : "space-y-4";

  // Apply margin settings
  const getMarginClass = () => {
    switch (settings.margins) {
      case "narrow":
        return "p-4";
      case "wide":
        return "p-12";
      default:
        return "p-8";
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg">
      <CardContent
        className={`${getMarginClass()} ${sectionSpacing}`}
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          lineHeight: lineSpacing,
        }}
      >
        {/* Header with Contact Info */}
        <div className="text-center border-b-2 border-gray-300 pb-6">
          <h1 className={`${headerSize} font-bold text-gray-900 mb-4`}>
            {content.contact.name || "Your Name"}
          </h1>

          <div
            className={`flex flex-wrap justify-center gap-4 ${contactSize} text-gray-600`}
          >
            {content.contact.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{content.contact.email}</span>
              </div>
            )}
            {content.contact.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{content.contact.phone}</span>
              </div>
            )}
            {content.contact.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{content.contact.location}</span>
              </div>
            )}
            {content.contact.website && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>{content.contact.website}</span>
              </div>
            )}
            {content.contact.linkedin && (
              <div className="flex items-center gap-1">
                <Linkedin className="h-3 w-3" />
                <span>{content.contact.linkedin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {content.summary && content.summary.trim() && (
          <div>
            <h2
              className={`${sectionHeaderSize} font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1`}
            >
              Professional Summary
            </h2>
            <p className={`text-gray-700 leading-relaxed ${bodySize}`}>
              {content.summary}
            </p>
          </div>
        )}

        {/* Core Competencies (Skills) */}
        {content.skills && content.skills.length > 0 && (
          <div>
            <h2
              className={`${sectionHeaderSize} font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1`}
            >
              Core Competencies
            </h2>
            <div className="flex flex-wrap gap-2">
              {content.skills
                .filter((skill) => skill && skill.trim())
                .map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`${bodySize}`}
                  >
                    {skill}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Professional Experience */}
        {content.experience && content.experience.length > 0 && (
          <div>
            <h2
              className={`${sectionHeaderSize} font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-300 pb-1`}
            >
              Professional Experience
            </h2>
            <div className={itemSpacing}>
              {content.experience
                .filter(
                  (exp) =>
                    exp.title &&
                    exp.title.trim() &&
                    exp.company &&
                    exp.company.trim()
                )
                .map((exp, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h3
                        className={`text-lg font-semibold text-gray-900 ${bodySize}`}
                      >
                        {exp.title}
                      </h3>
                      <span
                        className={`text-sm text-gray-600 font-medium ${contactSize}`}
                      >
                        {exp.duration}
                      </span>
                    </div>
                    <p className={`text-gray-700 font-medium mb-3 ${bodySize}`}>
                      {exp.company}
                    </p>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="space-y-2">
                        {exp.bullets
                          .filter((bullet) => bullet && bullet.trim())
                          .map((bullet, bulletIndex) => (
                            <li key={bulletIndex} className="flex items-start">
                              <span className="text-gray-400 mr-3 mt-1">•</span>
                              <span
                                className={`text-gray-700 leading-relaxed ${bodySize}`}
                              >
                                {bullet}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Education */}
        {content.education && content.education.length > 0 && (
          <div>
            <h2
              className={`${sectionHeaderSize} font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-300 pb-1`}
            >
              Education
            </h2>
            <div className={itemSpacing}>
              {content.education
                .filter(
                  (edu) =>
                    edu.degree &&
                    edu.degree.trim() &&
                    edu.institution &&
                    edu.institution.trim()
                )
                .map((edu, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <h3
                      className={`text-lg font-semibold text-gray-900 ${bodySize}`}
                    >
                      {edu.degree}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <p className={`text-gray-700 font-medium ${bodySize}`}>
                        {edu.institution}
                      </p>
                      {edu.year && edu.year.trim() && (
                        <span
                          className={`text-sm text-gray-600 font-medium ${contactSize}`}
                        >
                          {edu.year}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!content.contact.name &&
          !content.summary &&
          (!content.experience || content.experience.length === 0) &&
          (!content.education || content.education.length === 0) &&
          (!content.skills || content.skills.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Your CV preview will appear here</p>
              <p className="text-sm">
                Start editing your CV to see the preview
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function getFontFamily(font: string): string {
  switch (font) {
    case "arial":
      return "Arial, sans-serif";
    case "helvetica":
      return "Helvetica, Arial, sans-serif";
    case "calibri":
      return "Calibri, sans-serif";
    default:
      return "Times New Roman, serif";
  }
}
