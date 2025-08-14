"use client";

import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";

interface DocxPreviewProps {
  content: any;
  template?: string;
  settings?: any;
  className?: string;
}

export function DocxPreview({
  content,
  template = "standard",
  settings = {},
  className = "",
}: DocxPreviewProps) {
  const previewStyles = useMemo(() => {
    const baseFontSize = settings.fontSize || 11;
    const fontFamily = getPreviewFontFamily(settings.fontFamily || "times");
    const lineSpacing = settings.lineSpacing || 1.2;
    const isCompact = template === "compact";
    const headerSize = isCompact ? baseFontSize + 8 : baseFontSize + 10;
    const sectionHeaderSize = isCompact ? baseFontSize + 2 : baseFontSize + 3;
    const contactSize = baseFontSize - 1;
    const marginTwips = getMarginSizeDocx(settings.margins || "normal");
    const marginInches = marginTwips / 1440;
    const marginPx = marginInches * 96;
    return {
      baseFontSize,
      fontFamily,
      lineSpacing,
      headerSize,
      sectionHeaderSize,
      contactSize,
      marginPx,
      isCompact,
    };
  }, [template, settings]);

  const paperDimensions = useMemo(
    () => ({
      width: getPaperWidthPx(settings.paperSize || "a4"),
      height: getPaperHeightPx(settings.paperSize || "a4"),
    }),
    [settings.paperSize]
  );

  const innerWidth = paperDimensions.width - previewStyles.marginPx * 2;
  const innerHeight = paperDimensions.height - previewStyles.marginPx * 2;

  const SectionHeader = useCallback(
    ({ children }: { children: React.ReactNode }) => (
      <div
        style={{
          fontSize: `${previewStyles.sectionHeaderSize}px`,
          fontWeight: "bold",
          marginTop: "20px",
          marginBottom: "8px",
          paddingBottom: "4px",
          borderBottom: "1px solid #666666",
          color: "#000000",
        }}
      >
        {children}
      </div>
    ),
    [previewStyles.sectionHeaderSize]
  );

  // Build blocks once per content/settings change
  type Block = { key: string; element: React.ReactNode };
  const blocks: Block[] = useMemo(() => {
    const els: Block[] = [];
    if (content.contact?.name) {
      els.push({
        key: "header",
        element: (
          <div
            style={{
              textAlign: "center",
              fontSize: `${previewStyles.headerSize}px`,
              fontWeight: "bold",
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "2px solid #000000",
              textTransform: "uppercase",
            }}
          >
            {content.contact.name}
          </div>
        ),
      });
    }

    const contactDetails: string[] = [];
    if (content.contact?.email) contactDetails.push(content.contact.email);
    if (content.contact?.phone) contactDetails.push(content.contact.phone);
    if (content.contact?.location)
      contactDetails.push(content.contact.location);
    if (content.contact?.website) contactDetails.push(content.contact.website);
    if (content.contact?.linkedin)
      contactDetails.push(content.contact.linkedin);
    if (contactDetails.length > 0) {
      els.push({
        key: "contact",
        element: (
          <div
            style={{
              textAlign: "center",
              fontSize: `${previewStyles.contactSize}px`,
              color: "#444",
              marginBottom: "32px",
            }}
          >
            {contactDetails.join(" | ")}
          </div>
        ),
      });
    }

    if (content.summary && content.summary.trim()) {
      els.push({
        key: "summary",
        element: (
          <div>
            <SectionHeader>PROFESSIONAL SUMMARY</SectionHeader>
            <div style={{ marginBottom: "24px" }}>{content.summary}</div>
          </div>
        ),
      });
    }

    if (content.skills && content.skills.length > 0) {
      const filtered = content.skills.filter((s: string) => s && s.trim());
      if (filtered.length > 0) {
        els.push({
          key: "skills",
          element: (
            <div>
              <SectionHeader>CORE COMPETENCIES</SectionHeader>
              <div style={{ marginBottom: "24px" }}>{filtered.join(" • ")}</div>
            </div>
          ),
        });
      }
    }

    if (content.experience && content.experience.length > 0) {
      const valid = content.experience.filter(
        (exp: any) => exp.title?.trim() && exp.company?.trim()
      );
      if (valid.length > 0) {
        els.push({
          key: "exp-header",
          element: <SectionHeader>PROFESSIONAL EXPERIENCE</SectionHeader>,
        });
        valid.forEach((exp: any, idx: number) => {
          const bullets = (exp.bullets || []).filter(
            (b: string) => b && b.trim()
          );
          els.push({
            key: `exp-${idx}`,
            element: (
              <div
                style={{
                  marginBottom: idx < valid.length - 1 ? "16px" : "24px",
                }}
              >
                <div
                  style={{
                    fontSize: `${previewStyles.baseFontSize + 1}px`,
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                >
                  {exp.title} | {exp.company}
                </div>
                {exp.duration?.trim() && (
                  <div
                    style={{
                      fontSize: `${previewStyles.baseFontSize - 1}px`,
                      fontStyle: "italic",
                      color: "#555",
                      marginBottom: "8px",
                    }}
                  >
                    {exp.duration}
                  </div>
                )}
                {bullets.map((b: string, j: number) => (
                  <div
                    key={`b-${j}`}
                    style={{
                      fontSize: `${previewStyles.baseFontSize - 1}px`,
                      marginLeft: "24px",
                      marginBottom: "4px",
                      color: "#333",
                    }}
                  >
                    • {b.trim()}
                  </div>
                ))}
              </div>
            ),
          });
        });
      }
    }

    if (content.education && content.education.length > 0) {
      const valid = content.education.filter(
        (edu: any) => edu.degree?.trim() && edu.institution?.trim()
      );
      if (valid.length > 0) {
        els.push({
          key: "edu-header",
          element: <SectionHeader>EDUCATION</SectionHeader>,
        });
        valid.forEach((edu: any, idx: number) => {
          els.push({
            key: `edu-${idx}`,
            element: (
              <div
                style={{ marginBottom: idx < valid.length - 1 ? "12px" : "0" }}
              >
                <div
                  style={{
                    fontSize: `${previewStyles.baseFontSize + 1}px`,
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                >
                  {edu.degree}
                </div>
                <div
                  style={{
                    fontSize: `${previewStyles.baseFontSize - 1}px`,
                    color: "#555",
                  }}
                >
                  {edu.institution}
                  {edu.year?.trim() ? ` | ${edu.year}` : ""}
                </div>
              </div>
            ),
          });
        });
      }
    }

    return els;
  }, [content, previewStyles, SectionHeader]);

  // Measurement-based pagination
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageStarts, setPageStarts] = useState<number[]>([0]);

  // Recalc key to avoid object deps
  const recalcKey = useMemo(
    () =>
      JSON.stringify({
        content,
        template,
        f: previewStyles.fontFamily,
        fs: previewStyles.baseFontSize,
        lh: previewStyles.lineSpacing,
        iw: innerWidth,
        ih: innerHeight,
      }),
    [
      content,
      template,
      previewStyles.fontFamily,
      previewStyles.baseFontSize,
      previewStyles.lineSpacing,
      innerWidth,
      innerHeight,
    ]
  );

  useEffect(() => {
    if (!measureRef.current) return;
    const container = measureRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    let y = 0;
    const starts: number[] = [0];
    children.forEach((el, idx) => {
      const h = el.offsetHeight;
      if (y + h > innerHeight && idx > starts[starts.length - 1]) {
        starts.push(idx);
        y = h;
      } else {
        y += h;
      }
    });
    // Only update if different
    const same =
      starts.length === pageStarts.length &&
      starts.every((v, i) => v === pageStarts[i]);
    if (!same) setPageStarts(starts);
  }, [recalcKey]);

  // Render pages using measured starts
  function renderPage(pageIndex: number) {
    const start = pageStarts[pageIndex];
    const end =
      pageIndex + 1 < pageStarts.length
        ? pageStarts[pageIndex + 1]
        : blocks.length;
    const pageStyle: React.CSSProperties = {
      width: paperDimensions.width,
      minHeight: paperDimensions.height,
      padding: previewStyles.marginPx,
      fontFamily: previewStyles.fontFamily,
      fontSize: previewStyles.baseFontSize,
      lineHeight: previewStyles.lineSpacing as number,
      backgroundColor: "white",
      color: "#333",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      margin: "0 auto 20px auto",
      position: "relative",
      border: "1px solid #e5e7eb",
      overflow: "hidden",
    };
    return (
      <div key={`page-${pageIndex}`} style={pageStyle}>
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 20,
            fontSize: 10,
            color: "#999",
          }}
        >
          Page {pageIndex + 1}
        </div>
        {blocks.slice(start, end).map((b) => (
          <React.Fragment key={b.key}>{b.element}</React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Hidden measurement container with exact inner width/typography */}
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          left: -99999,
          top: -99999,
          visibility: "hidden",
          width: innerWidth,
          fontFamily: previewStyles.fontFamily,
          fontSize: previewStyles.baseFontSize,
          lineHeight: previewStyles.lineSpacing as number,
        }}
      >
        {blocks.map((b) => (
          <div key={`m-${b.key}`}>{b.element}</div>
        ))}
      </div>

      {/* Visible pages */}
      <div>{pageStarts.map((_, idx) => renderPage(idx))}</div>
    </div>
  );
}

// Helpers
function getPreviewFontFamily(font: string): string {
  switch ((font || "").toLowerCase()) {
    case "arial":
      return "Arial, sans-serif";
    case "helvetica":
      return "Helvetica, Arial, sans-serif";
    case "calibri":
      return "Calibri, sans-serif";
    case "times":
    default:
      return "Times New Roman, serif";
  }
}

function getMarginSizeDocx(margins: string): number {
  switch (margins) {
    case "narrow":
      return 720;
    case "wide":
      return 1800;
    default:
      return 1440;
  }
}

function getPaperWidthPx(paper: string): number {
  switch ((paper || "").toLowerCase()) {
    case "letter":
      return 816;
    case "legal":
      return 816;
    case "a4":
    default:
      return 794;
  }
}

function getPaperHeightPx(paper: string): number {
  switch ((paper || "").toLowerCase()) {
    case "letter":
      return 1056;
    case "legal":
      return 1344;
    case "a4":
    default:
      return 1123;
  }
}
