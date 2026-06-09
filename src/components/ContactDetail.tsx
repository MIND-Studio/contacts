"use client";

import { Button } from "@mind-studio/ui";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
} from "lucide-react";
import type { Contact } from "@/lib/contacts/store";
import ContactAvatar from "./ContactAvatar";

/** Read-only detail panel for the selected contact. */
export default function ContactDetail({
  contact,
  onEdit,
  onDelete,
  onBack,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  /** Mobile-only: return to the list view. */
  onBack: () => void;
}) {
  const website = normalizeWebsite(contact.website);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to list">
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">All contacts</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <ContactAvatar name={contact.name} size="lg" />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {contact.name}
              </h2>
              {contact.org && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {contact.org}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>

        <dl className="mt-8 space-y-5">
          {contact.email && (
            <Field icon={<Mail className="size-4" />} label="Email">
              <a
                href={`mailto:${contact.email}`}
                className="break-all text-primary hover:underline"
              >
                {contact.email}
              </a>
            </Field>
          )}
          {contact.phone && (
            <Field icon={<Phone className="size-4" />} label="Phone">
              <a
                href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                className="text-primary hover:underline"
              >
                {contact.phone}
              </a>
            </Field>
          )}
          {contact.website && (
            <Field icon={<Globe className="size-4" />} label="Website">
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-primary hover:underline"
              >
                {contact.website}
              </a>
            </Field>
          )}
          {contact.org && (
            <Field icon={<Building2 className="size-4" />} label="Organization">
              {contact.org}
            </Field>
          )}
          {contact.note && (
            <Field icon={<StickyNote className="size-4" />} label="Note">
              <span className="whitespace-pre-wrap">{contact.note}</span>
            </Field>
          )}
        </dl>

        <p
          className="mt-10 break-all font-mono text-[10px] text-muted-foreground"
          title="Where this contact lives in your pod"
        >
          {contact.url}
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm">{children}</dd>
      </div>
    </div>
  );
}

function normalizeWebsite(url?: string): string {
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
