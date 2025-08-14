"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react";

interface PaginatedCVPreviewProps {
  content: any;
  template?: "standard" | "compact" | "modern";
  settings?: {
    fontFamily?: string;
    fontSize?: number;
    lineSpacing?: number;
    margins?: "narrow" | "normal" | "wide";
    paperSize?: "a4" | "letter" | "legal";
  };
}

const DPI = 96; // CSS pixel density approximation

function paperPixels(paper: string): { width: number; height: number } {
  switch ((paper || "a4").toLowerCase()) {
    case "letter":
      return { width: Math.round(8.5 * DPI), height: Math.round(11 * DPI) };
    case "legal":
      return { width: Math.round(8.5 * DPI), height: Math.round(14 * DPI) };
    case "a4":
    default:
      return { width: Math.round(8.27 * DPI), height: Math.round(11.69 * DPI) };
  }
}

function marginPixels(margins?: string): number {
  switch (margins) {
    case "narrow":
      return Math.round(0.5 * DPI);
    case "wide":
      return Math.round(1.25 * DPI);
    case "normal":
    default:
      return Math.round(1 * DPI);
  }
}

function getFontFamily(font?: string): string {
  switch ((font || "times").toLowerCase()) {
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

export function PaginatedCVPreview({
  content,
  template = "standard",
  settings = {},
}: PaginatedCVPreviewProps) {
  const paper = paperPixels(settings.paperSize || "a4");
  const margin = marginPixels(settings.margins || "normal");
  const contentWidth = paper.width - margin * 2;
  const contentHeight = paper.height - margin * 2;

  const isCompact = template === "compact";
  const fontFamily = getFontFamily(settings.fontFamily);
  const baseFontPx = settings.fontSize ? settings.fontSize : 11;
  const lineHeight = settings.lineSpacing || 1.2;

  const headerPx = isCompact ? 24 : 30;
  const sectionHeaderPx = isCompact ? 18 : 20;
  const contactPx = isCompact ? 10 : 12;
  const bodyPx = baseFontPx < 11 ? 12 : baseFontPx > 13 ? 16 : 14;
  const sectionGap = isCompact ? 16 : 24;
  const itemGap = isCompact ? 12 : 16;

  // Build content blocks to measure and paginate
  const blocks = useMemo(() => {
    const b: Array<{ key: string; el: React.ReactNode }> = [];

    // Header block
    b.push({
      key: "header",
      el: (
        <div style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: 24 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: headerPx,
              color: "#111827",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {content.contact?.name || "Your Name"}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 16,
              color: "#4b5563",
              fontSize: contactPx,
            }}
          >
            {content.contact?.email && <span>{content.contact.email}</span>}
            {content.contact?.phone && <span>{content.contact.phone}</span>}
            {content.contact?.location && (
              <span>{content.contact.location}</span>
            )}
            {content.contact?.website && <span>{content.contact.website}</span>}
            {content.contact?.linkedin && (
              <span>{content.contact.linkedin}</span>
            )}
          </div>
        </div>
      ),
    });

    // Summary section
    if (content.summary && content.summary.trim()) {
      b.push({
        key: "h-summary",
        el: (
          <div
            style={{
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: 4,
              marginTop: sectionGap,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#111827",
                fontSize: sectionHeaderPx,
              }}
            >
              Professional Summary
            </div>
          </div>
        ),
      });
      b.push({
        key: "summary",
        el: (
          <p
            style={{
              marginTop: 12,
              color: "#374151",
              fontSize: bodyPx,
              lineHeight,
            }}
          >
            {content.summary}
          </p>
        ),
      });
    }

    // Skills
    const filteredSkills = (content.skills || []).filter(
      (s: string) => s && s.trim()
    );
    if (filteredSkills.length) {
      b.push({
        key: "h-skills",
        el: (
          <div
            style={{
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: 4,
              marginTop: sectionGap,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#111827",
                fontSize: sectionHeaderPx,
              }}
            >
              Core Competencies
            </div>
          </div>
        ),
      });
      b.push({
        key: "skills",
        el: (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}
          >
            {filteredSkills.map((skill: string, i: number) => (
              <span
                key={i}
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontSize: bodyPx - 2,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        ),
      });
    }

    // Experience
    const experiences = (content.experience || []).filter(
      (e: any) => e.title && e.company
    );
    if (experiences.length) {
      b.push({
        key: "h-exp",
        el: (
          <div
            style={{
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: 4,
              marginTop: sectionGap,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#111827",
                fontSize: sectionHeaderPx,
              }}
            >
              Professional Experience
            </div>
          </div>
        ),
      });
      experiences.forEach((exp: any, idx: number) => {
        b.push({
          key: `exp-${idx}`,
          el: (
            <div
              style={{
                borderLeft: "2px solid #e5e7eb",
                paddingLeft: 16,
                marginTop: itemGap,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: bodyPx + 2,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {exp.title}
                </div>
                <div style={{ fontSize: contactPx, color: "#6b7280" }}>
                  {exp.duration}
                </div>
              </div>
              <div
                style={{
                  fontSize: bodyPx,
                  fontWeight: 600,
                  color: "#374151",
                  marginTop: 4,
                }}
              >
                {exp.company}
              </div>
              {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                <ul style={{ marginTop: 8, paddingLeft: 0 }}>
                  {exp.bullets
                    .filter((b: string) => b && b.trim())
                    .map((b: string, bi: number) => (
                      <li
                        key={bi}
                        style={{ display: "flex", gap: 8, marginBottom: 6 }}
                      >
                        <span style={{ color: "#9ca3af" }}>•</span>
                        <span
                          style={{
                            color: "#374151",
                            fontSize: bodyPx,
                            lineHeight,
                          }}
                        >
                          {b}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ),
        });
      });
    }

    // Education
    const education = (content.education || []).filter(
      (e: any) => e.degree && e.institution
    );
    if (education.length) {
      b.push({
        key: "h-edu",
        el: (
          <div
            style={{
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: 4,
              marginTop: sectionGap,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#111827",
                fontSize: sectionHeaderPx,
              }}
            >
              Education
            </div>
          </div>
        ),
      });
      education.forEach((edu: any, idx: number) => {
        b.push({
          key: `edu-${idx}`,
          el: (
            <div
              style={{
                borderLeft: "2px solid #e5e7eb",
                paddingLeft: 16,
                marginTop: itemGap,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: bodyPx + 2,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {edu.degree}
                </div>
                <div style={{ fontSize: contactPx, color: "#6b7280" }}>
                  {edu.year}
                </div>
              </div>
              <div
                style={{
                  fontSize: bodyPx,
                  fontWeight: 600,
                  color: "#374151",
                  marginTop: 4,
                }}
              >
                {edu.institution}
              </div>
            </div>
          ),
        });
      });
    }

    return b;
  }, [content, template, settings]);

  // Measure blocks in hidden container
  const measureRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    if (!measureRef.current) return;
    const container = measureRef.current;
    const childHeights = Array.from(container.children).map(
      (child) => (child as HTMLElement).offsetHeight
    );
    setHeights(childHeights);
  }, [blocks, contentWidth]);

  // Pagination
  const pages = useMemo(() => {
    if (!heights.length) return [] as number[][];
    const pages: number[][] = [];
    let current: number[] = [];
    let used = 0;
    heights.forEach((h, idx) => {
      if (used + h > contentHeight && current.length > 0) {
        pages.push(current);
        current = [];
        used = 0;
      }
      current.push(idx);
      used += h;
    });
    if (current.length) pages.push(current);
    return pages;
  }, [heights, contentHeight]);

  return (
    <div className="space-y-8">
      {/* Hidden measuring container */}
      <div
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          width: contentWidth,
          fontFamily,
          fontSize: bodyPx,
          lineHeight,
        }}
        ref={measureRef}
      >
        {blocks.map((b) => (
          <div key={b.key} style={{ marginBottom: 0 }}>
            {b.el}
          </div>
        ))}
      </div>

      {/* Render visible pages */}
      {pages.map((pageBlockIdxs, pageNum) => (
        <div
          key={pageNum}
          style={{
            width: paper.width,
            height: paper.height,
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            margin: "0 auto",
            position: "relative",
          }}
        >
          {/* Content area with margins */}
          <div
            style={{
              position: "absolute",
              left: margin,
              top: margin,
              width: contentWidth,
              height: contentHeight,
              overflow: "hidden",
              fontFamily,
              fontSize: bodyPx,
              lineHeight,
            }}
          >
            {pageBlockIdxs.map((idx) => (
              <div key={blocks[idx].key} style={{ marginBottom: 0 }}>
                {blocks[idx].el}
              </div>
            ))}
          </div>
          {/* Page number */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 16,
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            {pageNum + 1} / {pages.length}
          </div>
        </div>
      ))}
    </div>
  );
}
