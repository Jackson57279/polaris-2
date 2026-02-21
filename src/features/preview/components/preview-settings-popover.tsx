"use client";

import { z } from "zod";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { SettingsIcon } from "lucide-react";

import { useUpdateProjectSettings } from "@/features/projects/hooks/use-projects";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";

import { Doc, Id } from "../../../../convex/_generated/dataModel";

const formSchema = z.object({
  installCommand: z.string(),
  devCommand: z.string(),
  buildCommand: z.string(),
  outputDir: z.string(),
});

interface PreviewSettingsPopoverProps {
  projectId: Id<"projects">;
  initialValues?: Doc<"projects">["settings"];
  onSave?: () => void;
};

export const PreviewSettingsPopover = ({
  projectId,
  initialValues,
  onSave,
}: PreviewSettingsPopoverProps) => {
  const [open, setOpen] = useState(false);
  const updateSettings = useUpdateProjectSettings();

  const form = useForm({
    defaultValues: {
      installCommand: initialValues?.installCommand ?? "",
      devCommand: initialValues?.devCommand ?? "",
      buildCommand: initialValues?.buildCommand ?? "",
      outputDir: initialValues?.outputDir ?? "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await updateSettings({
        id: projectId,
        settings: {
          installCommand: value.installCommand || undefined,
          devCommand: value.devCommand || undefined,
          buildCommand: value.buildCommand || undefined,
          outputDir: value.outputDir || undefined,
        },
      });
      setOpen(false);
      onSave?.();
    }
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      form.reset({
        installCommand: initialValues?.installCommand ?? "",
        devCommand: initialValues?.devCommand ?? "",
        buildCommand: initialValues?.buildCommand ?? "",
        outputDir: initialValues?.outputDir ?? "",
      });
    }
    setOpen(isOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-full rounded-none"
          title="Preview settings"
        >
          <SettingsIcon className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-medium text-sm">
                Preview Settings
              </h4>
              <p className="text-xs text-muted-foreground">
                Configure how your project runs in the preview.
              </p>
            </div>
            <form.Field name="installCommand">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Install Command
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="npm install"
                  />
                  <FieldDescription>
                    Command to install dependencies
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
            <form.Field name="devCommand">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Start Command</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="npm run dev"
                  />
                  <FieldDescription>
                    Command to start the development server
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Deployment
              </p>
              <form.Field name="buildCommand">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Build Command</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="npm run build"
                    />
                    <FieldDescription>
                      Command to build the project for deployment
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>
              <form.Field name="outputDir">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Output Directory</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="dist"
                    />
                    <FieldDescription>
                      Where build output files are written (e.g. dist, build, out)
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>
            </div>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
