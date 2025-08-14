import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
} from "docx";
import { jsPDF } from "jspdf";
import convert from "libreoffice-convert";
import { promisify } from "util";
import fs from "fs";
import { execSync } from "child_process";
const convertAsync = promisify(convert.convert);

let libreOfficeChecked = false;
let libreOfficeAvailable = false;
function detectLibreOffice(): boolean {
  if (!libreOfficeChecked) {
    try {
      execSync("soffice --version", { stdio: "ignore" });
      libreOfficeAvailable = true;
    } catch {
      // Probe common Windows install locations
      const candidates = [
        "C://Program Files//LibreOffice//program//soffice.exe",
        "C://Program Files (x86)//LibreOffice//program//soffice.exe",
      ];
      libreOfficeAvailable = candidates.some((p) => {
        try {
          return fs.existsSync(p);
        } catch {
          return false;
        }
      });
    }
    libreOfficeChecked = true;
  }
  return libreOfficeAvailable;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const {
      documentId,
      format,
      content,
      template = "standard",
      settings = {},
    } = body;

    if (!documentId || !format || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["pdf", "docx"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be pdf or docx" },
        { status: 400 }
      );
    }

    // Verify user owns the document
    const document = await db.document.findUnique({
      where: { id: documentId },
      select: {
        userId: true,
        title: true,
      },
    });

    if (!document || document.userId !== user.id) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    if (format === "pdf") {
      // First, generate a DOCX buffer with high-fidelity formatting
      const docxBuffer = await generateDOCX(
        content,
        document.title,
        template,
        settings
      );

      let pdfBuffer: Buffer | null = null;

      // Only attempt LibreOffice conversion if available on host
      if (detectLibreOffice()) {
        try {
          const converted = (await convertAsync(
            docxBuffer,
            ".pdf",
            undefined
          )) as Buffer;
          if (converted && converted.length > 0) {
            pdfBuffer = converted;
          }
        } catch (e) {
          console.warn(
            "DOCX->PDF conversion failed; falling back to internal PDF generator.",
            e
          );
        }
      } else {
        console.warn(
          "LibreOffice not detected on host. Using internal PDF generator fallback."
        );
      }

      // Fallback: use internal PDF generator to ensure export works
      if (!pdfBuffer) {
        try {
          pdfBuffer = await internalGeneratePDF(
            content,
            document.title,
            template,
            settings
          );
        } catch (fallbackErr) {
          console.error("PDF fallback generation failed:", fallbackErr);
          return NextResponse.json(
            {
              error:
                "PDF export failed. Please export as DOCX while we fix this.",
            },
            { status: 500 }
          );
        }
      }

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${document.title}.pdf"`,
        },
      });
    } else {
      const docxBuffer = await generateDOCX(
        content,
        document.title,
        template,
        settings
      );

      return new NextResponse(docxBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${document.title}.docx"`,
        },
      });
    }
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export CV" },
      { status: 500 }
    );
  }
}

async function generatePDF(
  content: any,
  title: string,
  template: string = "standard",
  settings: any = {}
): Promise<Buffer> {
  const pdf = new jsPDF({
    unit: "pt",
    format: getPdfPaperFormat(settings.paperSize || "a4"),
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Apply exact same settings as preview
  const baseFontSize = settings.fontSize || 11;
  const lineSpacing = settings.lineSpacing || 1.2;
  const isCompact = template === "compact";

  // Use exact same margin calculation as preview
  const marginSize = getMarginSizePts(settings.margins || "normal");
  let yPosition = marginSize;

  // Font sizes that match preview exactly
  const headerFontSize = isCompact ? 24 : 30; // text-2xl vs text-3xl
  const sectionHeaderFontSize = isCompact ? 18 : 20; // text-lg vs text-xl
  const contactFontSize = isCompact ? 10 : 12; // text-xs vs text-sm
  const bodyFontSize = baseFontSize < 11 ? 12 : baseFontSize > 13 ? 16 : 14; // text-sm vs text-base

  // Spacing that matches preview
  const sectionSpacing = isCompact ? 16 : 24; // space-y-4 vs space-y-6
  const itemSpacing = isCompact ? 12 : 16; // space-y-3 vs space-y-4

  // Helper function to add text with exact preview formatting
  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    isItalic: boolean = false,
    alignment: "left" | "center" | "right" = "left",
    color: number[] = [0, 0, 0],
    marginLeft: number = 0
  ) => {
    pdf.setFontSize(fontSize);

    // Use built-in jsPDF fonts that work consistently
    if (isBold && isItalic) {
      pdf.setFont("helvetica", "bolditalic");
    } else if (isBold) {
      pdf.setFont("helvetica", "bold");
    } else if (isItalic) {
      pdf.setFont("helvetica", "italic");
    } else {
      pdf.setFont("helvetica", "normal");
    }

    pdf.setTextColor(color[0], color[1], color[2]);

    const effectiveWidth = pageWidth - 2 * marginSize - marginLeft;
    const lines = pdf.splitTextToSize(text, effectiveWidth);

    lines.forEach((line: string, index: number) => {
      let xPosition = marginSize + marginLeft;

      if (alignment === "center") {
        const textWidth =
          (pdf.getStringUnitWidth(line) * fontSize) / pdf.internal.scaleFactor;
        xPosition = (pageWidth - textWidth) / 2;
      } else if (alignment === "right") {
        const textWidth =
          (pdf.getStringUnitWidth(line) * fontSize) / pdf.internal.scaleFactor;
        xPosition = pageWidth - marginSize - textWidth;
      }

      pdf.text(line, xPosition, yPosition);

      if (index < lines.length - 1) {
        yPosition += fontSize * lineSpacing * 0.8;
      }
    });

    yPosition += fontSize * lineSpacing * 1.2;
  };

  const addSpacing = (space: number) => {
    yPosition += space;
  };

  const checkPageBreak = (requiredSpace: number = 50) => {
    if (yPosition + requiredSpace > pageHeight - marginSize) {
      pdf.addPage();
      yPosition = marginSize;
    }
  };

  // Header with Name - exactly like preview
  if (content.contact?.name) {
    addText(
      content.contact.name.toUpperCase(),
      headerFontSize,
      true,
      false,
      "center",
      [0, 0, 0]
    );

    // Add thick border line under name like preview
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(2);
    const lineY = yPosition - 10;
    pdf.line(marginSize, lineY, pageWidth - marginSize, lineY);
    addSpacing(24);
  }

  // Contact Information - exactly like preview
  const contactDetails = [] as string[];
  if (content.contact?.email) contactDetails.push(content.contact.email);
  if (content.contact?.phone) contactDetails.push(content.contact.phone);
  if (content.contact?.location) contactDetails.push(content.contact.location);
  if (content.contact?.website) contactDetails.push(content.contact.website);
  if (content.contact?.linkedin) contactDetails.push(content.contact.linkedin);

  if (contactDetails.length > 0) {
    const contactText = contactDetails.join(" | ");
    addText(
      contactText,
      contactFontSize,
      false,
      false,
      "center",
      [102, 102, 102]
    );
    addSpacing(sectionSpacing);
  }

  // Professional Summary - exactly like preview
  if (content.summary && content.summary.trim()) {
    checkPageBreak(60);

    // Section header with underline like preview
    addText(
      "PROFESSIONAL SUMMARY",
      sectionHeaderFontSize,
      true,
      false,
      "left",
      [0, 0, 0]
    );

    // Add gray underline
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    const lineY = yPosition - sectionHeaderFontSize * 0.5;
    pdf.line(marginSize, lineY, pageWidth - marginSize, lineY);

    addSpacing(12);
    addText(content.summary, bodyFontSize, false, false, "left", [64, 64, 64]);
    addSpacing(sectionSpacing);
  }

  // Core Competencies - exactly like preview
  if (content.skills && content.skills.length > 0) {
    const filteredSkills = content.skills.filter(
      (skill: string) => skill && skill.trim()
    );
    if (filteredSkills.length > 0) {
      checkPageBreak(60);

      addText(
        "CORE COMPETENCIES",
        sectionHeaderFontSize,
        true,
        false,
        "left",
        [0, 0, 0]
      );

      // Add gray underline
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(1);
      const lineY = yPosition - sectionHeaderFontSize * 0.5;
      pdf.line(marginSize, lineY, pageWidth - marginSize, lineY);

      addSpacing(12);
      const skillsText = filteredSkills.join(" • ");
      addText(skillsText, bodyFontSize, false, false, "left", [64, 64, 64]);
      addSpacing(sectionSpacing);
    }
  }

  // Professional Experience - exactly like preview
  if (content.experience && content.experience.length > 0) {
    const validExperience = content.experience.filter(
      (exp: any) =>
        exp.title && exp.title.trim() && exp.company && exp.company.trim()
    );

    if (validExperience.length > 0) {
      checkPageBreak(80);

      addText(
        "PROFESSIONAL EXPERIENCE",
        sectionHeaderFontSize,
        true,
        false,
        "left",
        [0, 0, 0]
      );

      // Add gray underline
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(1);
      const lineY = yPosition - sectionHeaderFontSize * 0.5;
      pdf.line(marginSize, lineY, pageWidth - marginSize, lineY);

      addSpacing(16);

      validExperience.forEach((exp: any, expIndex: number) => {
        checkPageBreak(100);

        // Add left border like preview
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(2);
        const borderX = marginSize + 12;
        const borderStartY = yPosition - 10;

        // Job title (larger, bold)
        addText(
          exp.title,
          bodyFontSize + 2,
          true,
          false,
          "left",
          [17, 24, 39],
          24
        );

        // Duration (right aligned, smaller, gray)
        if (exp.duration && exp.duration.trim()) {
          const durationY = yPosition - (bodyFontSize + 2) * lineSpacing * 1.2;
          pdf.setFontSize(contactFontSize);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(102, 102, 102);
          const textWidth =
            (pdf.getStringUnitWidth(exp.duration) * contactFontSize) /
            pdf.internal.scaleFactor;
          pdf.text(exp.duration, pageWidth - marginSize - textWidth, durationY);
        }

        // Company name (medium weight)
        addText(
          exp.company,
          bodyFontSize,
          true,
          false,
          "left",
          [64, 64, 64],
          24
        );

        addSpacing(12);

        // Bullets with proper indentation
        if (exp.bullets && exp.bullets.length > 0) {
          const validBullets = exp.bullets.filter(
            (bullet: string) => bullet && bullet.trim()
          );
          validBullets.forEach((bullet: string) => {
            addText(
              `• ${bullet.trim()}`,
              bodyFontSize,
              false,
              false,
              "left",
              [64, 64, 64],
              24
            );
          });
        }

        // Draw left border
        const borderEndY = yPosition;
        pdf.line(borderX, borderStartY, borderX, borderEndY);

        // Add spacing between experiences
        if (expIndex < validExperience.length - 1) {
          addSpacing(itemSpacing);
        }
      });

      addSpacing(sectionSpacing);
    }
  }

  // Education - exactly like preview
  if (content.education && content.education.length > 0) {
    const validEducation = content.education.filter(
      (edu: any) =>
        edu.degree &&
        edu.degree.trim() &&
        edu.institution &&
        edu.institution.trim()
    );

    if (validEducation.length > 0) {
      checkPageBreak(80);

      addText(
        "EDUCATION",
        sectionHeaderFontSize,
        true,
        false,
        "left",
        [0, 0, 0]
      );

      // Add gray underline
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(1);
      const lineY = yPosition - sectionHeaderFontSize * 0.5;
      pdf.line(marginSize, lineY, pageWidth - marginSize, lineY);

      addSpacing(16);

      validEducation.forEach((edu: any, eduIndex: number) => {
        checkPageBreak(60);

        // Add left border like preview
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(2);
        const borderX = marginSize + 12;
        const borderStartY = yPosition - 10;

        // Degree (larger, bold)
        addText(
          edu.degree,
          bodyFontSize + 2,
          true,
          false,
          "left",
          [17, 24, 39],
          24
        );

        // Year (right aligned if present)
        if (edu.year && edu.year.trim()) {
          const yearY = yPosition - (bodyFontSize + 2) * lineSpacing * 1.2;
          pdf.setFontSize(contactFontSize);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(102, 102, 102);
          const textWidth =
            (pdf.getStringUnitWidth(edu.year) * contactFontSize) /
            pdf.internal.scaleFactor;
          pdf.text(edu.year, pageWidth - marginSize - textWidth, yearY);
        }

        // Institution
        addText(
          edu.institution,
          bodyFontSize,
          true,
          false,
          "left",
          [64, 64, 64],
          24
        );

        // Draw left border
        const borderEndY = yPosition;
        pdf.line(borderX, borderStartY, borderX, borderEndY);

        // Add spacing between education entries
        if (eduIndex < validEducation.length - 1) {
          addSpacing(itemSpacing);
        }
      });
    }
  }

  return Buffer.from(pdf.output("arraybuffer"));
}

// Lightweight internal PDF generator used as a fallback when LibreOffice is unavailable
async function internalGeneratePDF(
  content: any,
  title: string,
  template: string,
  settings: any
): Promise<Buffer> {
  const paper = (settings?.paperSize || "a4").toLowerCase();
  const format =
    paper === "letter" ? "letter" : paper === "legal" ? "legal" : "a4";
  const doc = new jsPDF({ unit: "pt", format });

  const marginInches =
    settings?.margins === "narrow"
      ? 0.5
      : settings?.margins === "wide"
      ? 1.25
      : 1.0;
  const margin = marginInches * 72; // points
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const baseFont =
    (settings?.fontFamily || "times").toLowerCase() === "arial"
      ? "helvetica"
      : (settings?.fontFamily || "times").toLowerCase();
  const baseFontSize = Number(settings?.fontSize) || 11;
  const lineSpacing = Number(settings?.lineSpacing) || 1.2;

  const setFont = (
    style: "normal" | "bold" | "italic" = "normal",
    size = baseFontSize
  ) => {
    doc.setFont(baseFont as any, style);
    doc.setFontSize(size);
  };

  let cursorY = margin;
  const maxWidth = pageWidth - margin * 2;
  const lineGap = baseFontSize * (lineSpacing - 1);

  const addLine = (
    text: string,
    opts?: { bold?: boolean; italic?: boolean; size?: number }
  ) => {
    const style: any = opts?.bold ? "bold" : opts?.italic ? "italic" : "normal";
    setFont(style, opts?.size || baseFontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (cursorY + baseFontSize > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += baseFontSize + lineGap;
    }
  };

  const addHeader = (text: string) => {
    setFont("bold", baseFontSize + 10);
    const headerLines = doc.splitTextToSize(text.toUpperCase(), maxWidth);
    for (const line of headerLines) {
      if (cursorY + (baseFontSize + 10) > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, pageWidth / 2, cursorY, { align: "center" });
      cursorY += baseFontSize + 14;
    }
    // underline
    doc.setLineWidth(1);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 12;
  };

  const addSectionTitle = (text: string) => {
    cursorY += 8;
    setFont("bold", baseFontSize + 3);
    if (cursorY + baseFontSize + 3 > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(text, margin, cursorY);
    cursorY += baseFontSize + 6;
    doc.setLineWidth(0.5);
    doc.setDrawColor(102, 102, 102);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 8;
  };

  const addBullets = (bullets: string[]) => {
    setFont("normal", baseFontSize - 1);
    for (const b of bullets) {
      const bulletText = `• ${b.trim()}`;
      const lines = doc.splitTextToSize(bulletText, maxWidth - 18);
      for (const line of lines) {
        if (cursorY + baseFontSize > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin + 18, cursorY);
        cursorY += baseFontSize + lineGap;
      }
    }
  };

  // Content
  if (content?.contact?.name) addHeader(content.contact.name);

  const contacts: string[] = [];
  if (content?.contact?.email) contacts.push(content.contact.email);
  if (content?.contact?.phone) contacts.push(content.contact.phone);
  if (content?.contact?.location) contacts.push(content.contact.location);
  if (content?.contact?.website) contacts.push(content.contact.website);
  if (content?.contact?.linkedin) contacts.push(content.contact.linkedin);
  if (contacts.length) {
    setFont("normal", baseFontSize - 1);
    addLine(contacts.join(" | "));
    cursorY += 6;
  }

  if (content?.summary?.trim()) {
    addSectionTitle("PROFESSIONAL SUMMARY");
    addLine(content.summary);
  }

  const skills = (content?.skills || []).filter((s: string) => s && s.trim());
  if (skills.length) {
    addSectionTitle("CORE COMPETENCIES");
    addLine(skills.join(" • "));
  }

  const experience = (content?.experience || []).filter(
    (e: any) => e?.title && e?.company
  );
  if (experience.length) {
    addSectionTitle("PROFESSIONAL EXPERIENCE");
    for (const [idx, exp] of experience.entries()) {
      setFont("bold", baseFontSize + 1);
      addLine(`${exp.title} | ${exp.company}`);
      if (exp.duration) {
        setFont("italic", baseFontSize - 1);
        addLine(exp.duration);
      }
      const bullets = (exp.bullets || []).filter((b: string) => b && b.trim());
      if (bullets.length) addBullets(bullets);
      cursorY += idx < experience.length - 1 ? 6 : 10;
    }
  }

  const education = (content?.education || []).filter(
    (e: any) => e?.degree && e?.institution
  );
  if (education.length) {
    addSectionTitle("EDUCATION");
    for (const [idx, edu] of education.entries()) {
      setFont("bold", baseFontSize + 1);
      addLine(edu.degree);
      setFont("normal", baseFontSize - 1);
      addLine(`${edu.institution}${edu.year ? ` | ${edu.year}` : ""}`);
      cursorY += idx < education.length - 1 ? 4 : 0;
    }
  }

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return buffer;
}

async function generateDOCX(
  content: any,
  title: string,
  template: string = "standard",
  settings: any = {}
): Promise<Buffer> {
  const children = [];

  // Apply settings
  const baseFontSize = (settings.fontSize || 11) * 2; // DOCX uses half-points
  const fontFamily = getDocxFontFamily(settings.fontFamily || "times");
  const lineSpacing = Math.round((settings.lineSpacing || 1.2) * 240); // DOCX line spacing units

  // Template-specific sizes
  const isCompact = template === "compact";
  const headerSize = isCompact ? baseFontSize + 16 : baseFontSize + 20;
  const sectionHeaderSize = isCompact ? baseFontSize + 4 : baseFontSize + 6;
  const contactSize = baseFontSize - 2;

  // Helper function to create section header with line
  const createSectionHeader = (text: string) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: text,
          bold: true,
          size: sectionHeaderSize,
          font: fontFamily,
        }),
      ],
      spacing: { before: 300, after: 100, line: lineSpacing },
      border: {
        bottom: {
          color: "666666",
          space: 1,
          style: "single",
          size: 6,
        },
      },
    });
  };

  // Header with Name - More prominent
  if (content.contact?.name) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: content.contact.name.toUpperCase(),
            bold: true,
            size: headerSize,
            font: fontFamily,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200, line: lineSpacing },
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: "single",
            size: 12,
          },
        },
      })
    );
  }

  // Contact Information - Better formatted
  const contactDetails = [] as string[];
  if (content.contact?.email) contactDetails.push(content.contact.email);
  if (content.contact?.phone) contactDetails.push(content.contact.phone);
  if (content.contact?.location) contactDetails.push(content.contact.location);
  if (content.contact?.website) contactDetails.push(content.contact.website);
  if (content.contact?.linkedin) contactDetails.push(content.contact.linkedin);

  if (contactDetails.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactDetails.join(" | "),
            size: contactSize,
            font: fontFamily,
            color: "444444",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400, line: lineSpacing },
      })
    );
  }

  // Professional Summary
  if (content.summary && content.summary.trim()) {
    children.push(createSectionHeader("PROFESSIONAL SUMMARY"));

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: content.summary,
            size: baseFontSize,
            font: fontFamily,
            color: "333333",
          }),
        ],
        spacing: { after: 300, line: lineSpacing },
      })
    );
  }

  // Core Competencies
  if (content.skills && content.skills.length > 0) {
    const filteredSkills = content.skills.filter(
      (skill: string) => skill && skill.trim()
    );
    if (filteredSkills.length > 0) {
      children.push(createSectionHeader("CORE COMPETENCIES"));

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: filteredSkills.join(" • "),
              size: baseFontSize,
              font: fontFamily,
              color: "333333",
            }),
          ],
          spacing: { after: 300, line: lineSpacing },
        })
      );
    }
  }

  // Professional Experience
  if (content.experience && content.experience.length > 0) {
    const validExperience = content.experience.filter(
      (exp: any) =>
        exp.title && exp.title.trim() && exp.company && exp.company.trim()
    );

    if (validExperience.length > 0) {
      children.push(createSectionHeader("PROFESSIONAL EXPERIENCE"));

      validExperience.forEach((exp: any, index: number) => {
        // Job title and company
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${exp.title} | ${exp.company}`,
                bold: true,
                size: baseFontSize + 2,
                font: fontFamily,
              }),
            ],
            spacing: { before: 150, after: 50, line: lineSpacing },
          })
        );

        // Duration
        if (exp.duration && exp.duration.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.duration,
                  italics: true,
                  size: baseFontSize - 2,
                  font: fontFamily,
                  color: "555555",
                }),
              ],
              spacing: { after: 100, line: lineSpacing },
            })
          );
        }

        // Bullets
        if (exp.bullets && exp.bullets.length > 0) {
          const validBullets = exp.bullets.filter(
            (bullet: string) => bullet && bullet.trim()
          );
          validBullets.forEach((bullet: string) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${bullet.trim()}`,
                    size: baseFontSize - 2,
                    font: fontFamily,
                    color: "333333",
                  }),
                ],
                spacing: { after: 50, line: lineSpacing },
                indent: { left: 360 }, // Indent bullets
              })
            );
          });
        }

        // Add spacing between experiences
        if (index < validExperience.length - 1) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "", size: 1 })],
              spacing: { after: 200 },
            })
          );
        }
      });
    }
  }

  // Education
  if (content.education && content.education.length > 0) {
    const validEducation = content.education.filter(
      (edu: any) =>
        edu.degree &&
        edu.degree.trim() &&
        edu.institution &&
        edu.institution.trim()
    );

    if (validEducation.length > 0) {
      children.push(createSectionHeader("EDUCATION"));

      validEducation.forEach((edu: any, index: number) => {
        // Degree
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.degree,
                bold: true,
                size: baseFontSize + 2,
                font: fontFamily,
              }),
            ],
            spacing: { before: 150, after: 50, line: lineSpacing },
          })
        );

        // Institution and year
        let institutionText = edu.institution;
        if (edu.year && edu.year.trim()) {
          institutionText += ` | ${edu.year}`;
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: institutionText,
                size: baseFontSize - 2,
                font: fontFamily,
                color: "555555",
              }),
            ],
            spacing: { after: 100, line: lineSpacing },
          })
        );

        // Add spacing between education entries
        if (index < validEducation.length - 1) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "", size: 1 })],
              spacing: { after: 150 },
            })
          );
        }
      });
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: getMarginSizeDocx(settings.margins || "normal"),
              right: getMarginSizeDocx(settings.margins || "normal"),
              bottom: getMarginSizeDocx(settings.margins || "normal"),
              left: getMarginSizeDocx(settings.margins || "normal"),
            },
          },
        },
        children: children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// Helper functions
function getPdfPaperFormat(paper: string): string | [number, number] {
  switch ((paper || "").toLowerCase()) {
    case "letter":
      return "letter";
    case "legal":
      return "legal";
    case "a4":
    default:
      return "a4";
  }
}

function getMarginSizePts(margins: string): number {
  switch (margins) {
    case "narrow":
      return 36; // 0.5 inch in points
    case "wide":
      return 90; // 1.25 inch in points
    default:
      return 72; // 1 inch (normal) in points
  }
}

function getMarginSize(margins: string): number {
  switch (margins) {
    case "narrow":
      return 36; // 0.5 inch
    case "wide":
      return 90; // 1.25 inch
    default:
      return 72; // 1 inch (normal)
  }
}

function getMarginSizeDocx(margins: string): number {
  switch (margins) {
    case "narrow":
      return 720; // 0.5 inch in twips
    case "wide":
      return 1800; // 1.25 inch in twips
    default:
      return 1440; // 1 inch in twips (normal)
  }
}

function getPdfFontFamily(font: string): string {
  switch ((font || "").toLowerCase()) {
    case "arial":
    case "helvetica":
    case "calibri":
      return "helvetica"; // jsPDF built-in sans font
    case "times":
    default:
      return "times"; // jsPDF built-in serif font
  }
}

function getDocxFontFamily(font: string): string {
  switch ((font || "").toLowerCase()) {
    case "arial":
      return "Arial";
    case "helvetica":
      return "Helvetica";
    case "calibri":
      return "Calibri";
    case "times":
    default:
      return "Times New Roman";
  }
}
