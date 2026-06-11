"use client";

import {
  createContainerAt,
  createSolidDataset,
  createThing,
  buildThing,
  setThing,
  getThing,
  getStringNoLocale,
  getSolidDataset,
  getContainedResourceUrlAll,
  saveSolidDatasetAt,
  deleteSolidDataset,
  type SolidDataset,
} from "@inrupt/solid-client";
import { session } from "@/lib/solid/session";
import { isBrokered, brokerFetch, currentIdentity } from "@/lib/solid/broker";
import { contactsContainerFor } from "@/lib/config";

/**
 * Pod data model — one Turtle resource per contact at
 * `{podRoot}apps/contacts/{id}.ttl`, using the vcard vocab. Email/phone/url
 * are stored as plain string literals for v0 simplicity (no nested
 * vcard:Email/vcard:Telephone nodes). The pod is the ONLY store.
 */

const VCARD = "http://www.w3.org/2006/vcard/ns#";
const vcard = (term: string) => `${VCARD}${term}`;

/** Fragment the contact thing lives under inside its own resource. */
const FRAGMENT = "#this";

export type Contact = {
  /** Resource id — the `{id}` in `{container}{id}.ttl`. */
  id: string;
  /** Full resource URL (without fragment). */
  url: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  org?: string;
  note?: string;
};

export type ContactFields = Omit<Contact, "id" | "url">;

/**
 * The fetch every pod call runs through. Inside the Mind shell (brokered mode)
 * this is the shell's scope-checked broker fetch — Contacts holds no session of
 * its own; otherwise it's the local OIDC session's authed fetch.
 */
function authedFetch(): typeof fetch {
  return isBrokered() ? brokerFetch : (session().fetch as typeof fetch);
}

/** No-store wrapper so listings aren't served stale from the browser cache
 *  right after a write. */
function noCacheFetch(): typeof fetch {
  const inner = authedFetch();
  return ((url: RequestInfo | URL, init?: RequestInit) =>
    inner(url, { ...init, cache: "no-store" })) as typeof fetch;
}

function is404(e: unknown): boolean {
  const err = e as { statusCode?: number; response?: { status?: number } };
  return err?.statusCode === 404 || err?.response?.status === 404;
}

export function containerForSession(): string {
  // Brokered-first: inside the Mind shell the container lives under the
  // shell's workspace pod root, not one derived from the local session WebID.
  const id = currentIdentity();
  if (!id) throw new Error("Not signed in");
  return contactsContainerFor(id.podRoot);
}

/** Lazily create `{podRoot}apps/contacts/` on first write. */
async function ensureContainer(container: string): Promise<void> {
  try {
    await getSolidDataset(container, { fetch: noCacheFetch() });
  } catch (e) {
    if (!is404(e)) throw e;
    await createContainerAt(container, { fetch: authedFetch() });
  }
}

function parseContact(url: string, dataset: SolidDataset): Contact | null {
  // The thing lives at `{url}#this`; tolerate resources written by other
  // tools that used the resource URL itself as the subject.
  const thing = getThing(dataset, `${url}${FRAGMENT}`) ?? getThing(dataset, url);
  if (!thing) return null;
  const name = getStringNoLocale(thing, vcard("fn"));
  if (!name) return null; // vcard:fn is required — skip malformed resources
  const tail = url.split("/").filter(Boolean).pop() ?? url;
  const id = tail.endsWith(".ttl") ? tail.slice(0, -4) : tail;
  return {
    id,
    url,
    name,
    email: getStringNoLocale(thing, vcard("hasEmail")) ?? undefined,
    phone: getStringNoLocale(thing, vcard("hasTelephone")) ?? undefined,
    website: getStringNoLocale(thing, vcard("hasURL")) ?? undefined,
    org: getStringNoLocale(thing, vcard("organization-name")) ?? undefined,
    note: getStringNoLocale(thing, vcard("note")) ?? undefined,
  };
}

/**
 * List all contacts in the pod, alphabetically by name. A 404 on the
 * container means "no contacts yet" (it's created lazily on first save).
 */
export async function listContacts(): Promise<Contact[]> {
  const container = containerForSession();
  let urls: string[];
  try {
    const index = await getSolidDataset(container, { fetch: noCacheFetch() });
    urls = getContainedResourceUrlAll(index).filter((u) => u.endsWith(".ttl"));
  } catch (e) {
    if (is404(e)) return []; // empty state — container not created yet
    throw e;
  }
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const ds = await getSolidDataset(url, { fetch: noCacheFetch() });
        return parseContact(url, ds);
      } catch {
        return null; // skip unreadable/foreign resources rather than fail the list
      }
    })
  );
  return results
    .filter((c): c is Contact => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

function buildContactDataset(url: string, fields: ContactFields) {
  let builder = buildThing(createThing({ url: `${url}${FRAGMENT}` }))
    .addUrl(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      vcard("Individual")
    )
    .addStringNoLocale(vcard("fn"), fields.name.trim());
  if (fields.email?.trim())
    builder = builder.addStringNoLocale(vcard("hasEmail"), fields.email.trim());
  if (fields.phone?.trim())
    builder = builder.addStringNoLocale(vcard("hasTelephone"), fields.phone.trim());
  if (fields.website?.trim())
    builder = builder.addStringNoLocale(vcard("hasURL"), fields.website.trim());
  if (fields.org?.trim())
    builder = builder.addStringNoLocale(vcard("organization-name"), fields.org.trim());
  if (fields.note?.trim())
    builder = builder.addStringNoLocale(vcard("note"), fields.note.trim());
  return setThing(createSolidDataset(), builder.build());
}

/** Create a new contact resource at `{container}{uuid}.ttl`. */
export async function createContact(fields: ContactFields): Promise<Contact> {
  if (!fields.name.trim()) throw new Error("Name is required");
  const container = containerForSession();
  await ensureContainer(container);
  const id = crypto.randomUUID();
  const url = `${container}${id}.ttl`;
  await saveSolidDatasetAt(url, buildContactDataset(url, fields), {
    fetch: authedFetch(),
  });
  return { id, url, ...fields };
}

/**
 * Overwrite an existing contact resource. We rebuild the dataset from the
 * form fields (PUT-replace semantics) — fine for v0 since this app owns the
 * resource shape.
 */
export async function updateContact(
  contact: Contact,
  fields: ContactFields
): Promise<Contact> {
  if (!fields.name.trim()) throw new Error("Name is required");
  await saveSolidDatasetAt(contact.url, buildContactDataset(contact.url, fields), {
    fetch: authedFetch(),
  });
  return { id: contact.id, url: contact.url, ...fields };
}

export async function deleteContact(contact: Contact): Promise<void> {
  await deleteSolidDataset(contact.url, { fetch: authedFetch() });
}
