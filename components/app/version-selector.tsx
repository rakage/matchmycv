"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Calendar, CheckCircle } from "lucide-react";

interface Version {
  id: string;
  label: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

interface VersionSelectorProps {
  versions: Version[];
  selectedVersionId: string | null;
  onVersionChange: (versionId: string | null) => void;
  documentTitle: string;
}

export function VersionSelector({
  versions,
  selectedVersionId,
  onVersionChange,
  documentTitle,
}: VersionSelectorProps) {
  const [showVersions, setShowVersions] = useState(false);

  const selectedVersion = selectedVersionId
    ? versions.find((v) => v.id === selectedVersionId)
    : null;

  const currentVersionLabel = selectedVersion
    ? selectedVersion.label
    : "Original Document";

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">{documentTitle}</CardTitle>
              <p className="text-sm text-gray-600">
                Current Version:{" "}
                <span className="font-medium">{currentVersionLabel}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
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
              <SelectTrigger className="w-64">
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
                  </div>
                </SelectItem>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{version.label}</span>
                      {version.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      )}
                      {selectedVersionId === version.id && (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersions(!showVersions)}
            >
              {showVersions ? "Hide" : "Show"} Versions ({versions.length})
            </Button>
          </div>
        </div>
      </CardHeader>

      {showVersions && (
        <CardContent>
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Available Versions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Original Document */}
              <div
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  !selectedVersionId
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onVersionChange(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      Original Document
                    </span>
                  </div>
                  {!selectedVersionId && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-xs text-gray-600">Base version uploaded</p>
              </div>

              {/* Version List */}
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedVersionId === version.id
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onVersionChange(version.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {version.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {version.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      )}
                      {selectedVersionId === version.id && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Created: {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
