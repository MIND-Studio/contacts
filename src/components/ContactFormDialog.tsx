"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Spinner,
  Textarea,
} from "@mind-studio/ui";
import type { Contact, ContactFields } from "@/lib/contacts/store";

/**
 * Shared add/edit dialog. Name is required; everything else optional.
 * The caller owns persistence via `onSubmit` — a rejected promise keeps the
 * dialog open and shows the error inline (no silent failures).
 */
export default function ContactFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Contact being edited, or null/undefined for "add". */
  initial?: Contact | null;
  onSubmit: (fields: ContactFields) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [org, setOrg] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the fields each time the dialog opens (add ↔ edit reuse).
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setEmail(initial?.email ?? "");
    setPhone(initial?.phone ?? "");
    setWebsite(initial?.website ?? "");
    setOrg(initial?.org ?? "");
    setNote(initial?.note ?? "");
    setError(null);
    setSaving(false);
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        org: org || undefined,
        note: note || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Changes are saved straight to your pod."
              : "Saved as a vCard resource in your pod."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              autoFocus
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.org"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 20 7946 0000"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-website">Website</Label>
            <Input
              id="contact-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.org"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-org">Organization</Label>
            <Input
              id="contact-org"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Analytical Engines Ltd"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-note">Note</Label>
            <Textarea
              id="contact-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Met at the Solid meetup."
              rows={3}
            />
          </div>
          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Spinner className="size-4" />}
              {initial ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
