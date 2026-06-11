"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Skeleton,
} from "@mind-studio/ui";
import { BookUser, Plus, Search, UserPlus, X } from "lucide-react";
import { ensureSession, rememberSignedOutPath } from "@/lib/solid/auth";
import { isBrokered, signalReady } from "@/lib/solid/broker";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  type Contact,
  type ContactFields,
} from "@/lib/contacts/store";
import ContactAvatar from "./ContactAvatar";
import ContactDetail from "./ContactDetail";
import ContactFormDialog from "./ContactFormDialog";

type Status = "loading" | "signed-out" | "ready";

/**
 * The main /contacts surface: searchable alphabetical list + detail panel.
 * All reads/writes go straight to the pod via the session fetch — there is
 * no server-side state anywhere in this app.
 */
export default function ContactsApp() {
  const [status, setStatus] = useState<Status>("loading");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureSession()
      .then(async (info) => {
        if (cancelled) return;
        // Inside the Mind shell, ensureSession resolves a brokered identity
        // (see broker.ts) so this gate never shows the Connect screen there.
        if (!info.isLoggedIn) {
          // Remember the deep link so reconnecting returns here.
          rememberSignedOutPath();
          setStatus("signed-out");
          return;
        }
        try {
          const list = await listContacts();
          if (cancelled) return;
          setContacts(list);
          setStatus("ready");
        } catch (e) {
          if (cancelled) return;
          setError(`Could not load contacts from your pod: ${message(e)}`);
          setStatus("ready");
        }
        // Tell the shell we've rendered so it drops its loading overlay
        // (no-op when standalone).
        if (!cancelled && isBrokered()) signalReady();
      })
      .catch((e) => {
        if (!cancelled) {
          setError(message(e));
          setStatus("signed-out");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.org, c.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [contacts, query]);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  function upsertLocal(contact: Contact) {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== contact.id).concat(contact);
      return next.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
    });
  }

  async function handleSubmit(fields: ContactFields) {
    // Errors propagate to the dialog, which keeps itself open and shows them.
    if (editing) {
      const updated = await updateContact(editing, fields);
      upsertLocal(updated);
      setSelectedId(updated.id);
    } else {
      const created = await createContact(fields);
      upsertLocal(created);
      setSelectedId(created.id);
    }
    setError(null);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteContact(confirmDelete);
      setContacts((prev) => prev.filter((c) => c.id !== confirmDelete.id));
      if (selectedId === confirmDelete.id) setSelectedId(null);
      setConfirmDelete(null);
      setError(null);
    } catch (e) {
      setError(`Delete failed: ${message(e)}`);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8">
        <ListSkeleton />
      </div>
    );
  }

  if (status === "signed-out") {
    return (
      <section className="mx-auto w-full max-w-md px-6 py-20 text-center">
        <BookUser className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Connect your pod
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your contacts live in your Solid Pod. Sign in to see them.
        </p>
        <Button asChild className="mt-6">
          <Link href="/connect">Connect a pod</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-8">
      {error && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="break-all">{error}</p>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid flex-1 gap-6 md:grid-cols-[320px_1fr]">
        {/* List column — hidden on mobile while a contact is open. */}
        <div
          className={`flex min-w-0 flex-col ${selected ? "hidden md:flex" : ""}`}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, org, email…"
                className="pl-8"
                aria-label="Search contacts"
              />
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto rounded-lg border">
            {contacts.length === 0 ? (
              <EmptyState
                onAdd={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              />
            ) : filtered.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No contacts match “{query}”.
              </p>
            ) : (
              <ul className="divide-y">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 ${
                        selectedId === c.id ? "bg-muted" : ""
                      }`}
                    >
                      <ContactAvatar name={c.name} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {c.name}
                        </span>
                        {(c.org || c.email) && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {c.org ?? c.email}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detail column. */}
        <div
          className={`min-w-0 rounded-lg border bg-card ${
            selected ? "" : "hidden md:block"
          }`}
        >
          {selected ? (
            <ContactDetail
              contact={selected}
              onEdit={() => {
                setEditing(selected);
                setFormOpen(true);
              }}
              onDelete={() => setConfirmDelete(selected)}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center p-10 text-center">
              <p className="text-sm text-muted-foreground">
                {contacts.length === 0
                  ? "Your address book is empty."
                  : "Select a contact to see details."}
              </p>
            </div>
          )}
        </div>
      </div>

      <ContactFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && !deleting && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirmDelete?.name ?? "contact"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the contact from your pod. There is no
              trash to recover it from.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <UserPlus className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">No contacts yet</p>
      <p className="max-w-56 text-xs text-muted-foreground">
        Add your first contact — it&apos;s stored as a vCard in your own pod.
      </p>
      <Button size="sm" className="mt-1" onClick={onAdd}>
        <Plus className="size-4" />
        Add contact
      </Button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <div className="space-y-2 rounded-lg border p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="hidden min-h-64 rounded-lg md:block" />
    </div>
  );
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
