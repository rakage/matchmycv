"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { X, Download, FileText } from "lucide-react";
import { DocxPreview } from "./docx-preview";

interface ExportSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  content: any;
  onExport: (format: "pdf" | "docx", template: string, settings: any) => void;
  isLoading: boolean;
}

export function ExportSidebar({
  isOpen,
  onClose,
  content,
  onExport,
  isLoading,
}: ExportSidebarProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<
    "standard" | "compact" | "modern"
  >("standard");
  const [settings, setSettings] = useState({
    fontFamily: "times",
    fontSize: 11,
    lineSpacing: 1.2,
    paperSize: "a4",
    margins: "normal",
  });

  const handleExport = (format: "pdf" | "docx") => {
    onExport(format, selectedTemplate, settings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      {/* Sidebar */}
      <div className="bg-white w-80 h-full overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Export Resume</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Template</Label>
            <RadioGroup
              value={selectedTemplate}
              onValueChange={(value) =>
                setSelectedTemplate(value as "standard" | "compact" | "modern")
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="text-sm">
                  Standard
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="compact" />
                <Label htmlFor="compact" className="text-sm">
                  Compact
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="modern" id="modern" />
                <Label htmlFor="modern" className="text-sm">
                  Modern
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Font Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Font Settings</Label>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Font Family</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, fontFamily: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="times">Times New Roman</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                  <SelectItem value="calibri">Calibri</SelectItem>
                  <SelectItem value="helvetica">Helvetica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">
                Font Size: {settings.fontSize}pt
              </Label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, fontSize: value }))
                }
                min={9}
                max={14}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">
                Line Spacing: {settings.lineSpacing}
              </Label>
              <Slider
                value={[settings.lineSpacing]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, lineSpacing: value }))
                }
                min={1.0}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          {/* Page Setup */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Page Setup</Label>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Paper Size</Label>
              <Select
                value={settings.paperSize}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    paperSize: value as "a4" | "letter" | "legal",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Margins</Label>
              <Select
                value={settings.margins}
                onValueChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    margins: value as "normal" | "narrow" | "wide",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrow">Narrow (0.5")</SelectItem>
                  <SelectItem value="normal">Normal (1")</SelectItem>
                  <SelectItem value="wide">Wide (1.25")</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="space-y-3 pt-4 border-t">
            <Button
              onClick={() => handleExport("pdf")}
              disabled={isLoading}
              className="w-full"
              variant="default"
            >
              <Download className="h-4 w-4 mr-2" />
              Download as PDF
            </Button>
            <Button
              onClick={() => handleExport("docx")}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download as Word
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-center">Preview</h3>
          <DocxPreview
            content={content}
            template={selectedTemplate}
            settings={settings}
            className="transform scale-75 origin-top"
          />
        </div>
      </div>
    </div>
  );
}
