import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Get the document with its structured data
    const document = await db.document.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        structured: true,
        userId: true,
      },
    });

    if (!document || document.userId !== user.id) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Parse the structured data
    let structuredData;
    try {
      structuredData = JSON.parse(document.structured);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid document structure" },
        { status: 400 }
      );
    }

    // Generate DOCX buffer using the same logic as export
    const docxBuffer = await generateDOCX(
      structuredData.sections || structuredData,
      document.title,
      "standard",
      {
        fontSize: 11,
        lineSpacing: 1.2,
        fontFamily: "times",
        margins: "normal",
        paperSize: "a4",
      }
    );

    return new NextResponse(docxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${document.title}.docx"`,
      },
    });
  } catch (error: any) {
    console.error("Download document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download document" },
      { status: 500 }
    );
  }
}

// DOCX generation function (copied from export route)
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

  // Header with Name
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

  // Contact Information
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
