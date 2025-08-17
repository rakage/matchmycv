"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Plus } from "lucide-react";

interface SaveVersionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (option: "current" | "new", newVersionLabel?: string) => void;
  currentVersionLabel?: string;
  hasCurrentVersion: boolean;
}

export function SaveVersionDialog({
  isOpen,
  onClose,
  onSave,
  currentVersionLabel,
  hasCurrentVersion,
}: SaveVersionDialogProps) {
  const [saveOption, setSaveOption] = useState<"current" | "new">(
    hasCurrentVersion ? "current" : "new"
  );
  const [newVersionLabel, setNewVersionLabel] = useState("");

  const handleSave = () => {
    if (saveOption === "new" && !newVersionLabel.trim()) {
      return; // Don't save if no label for new version
    }
    onSave(
      saveOption,
      saveOption === "new" ? newVersionLabel.trim() : undefined
    );
    onClose();
    setNewVersionLabel("");
  };

  const handleClose = () => {
    onClose();
    setNewVersionLabel("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Changes</DialogTitle>
          <DialogDescription>
            Choose how you want to save your CV changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={saveOption}
            onValueChange={(value: "current" | "new") => setSaveOption(value)}
          >
            {hasCurrentVersion && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="current" />
                <Label
                  htmlFor="current"
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Update current version</p>
                    <p className="text-sm text-gray-600">
                      Save changes to "{currentVersionLabel}"
                    </p>
                  </div>
                </Label>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label
                htmlFor="new"
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <div>
                  <p className="font-medium">Create new version</p>
                  <p className="text-sm text-gray-600">
                    Save as a new version with a custom name
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {saveOption === "new" && (
            <div className="space-y-2">
              <Label htmlFor="version-name">Version name</Label>
              <Input
                id="version-name"
                placeholder="e.g., Updated for Software Engineer role"
                value={newVersionLabel}
                onChange={(e) => setNewVersionLabel(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveOption === "new" && !newVersionLabel.trim()}
          >
            {saveOption === "current" ? "Update Version" : "Create Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
