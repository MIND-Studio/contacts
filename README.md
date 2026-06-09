# Mind Contacts

**People you know, in your pod.**

A privacy-first address book built on [Solid Pods](https://solidproject.org/).
Every contact is a vCard Turtle resource in *your* pod — no central server
ever sees your address book.

## What it does

- Searchable, alphabetically sorted contact list (name, organization, email)
- Detail panel with `mailto:` / `tel:` links
- Add / edit via a dialog form (name required, everything else optional)
- Delete with confirmation
- Each contact lives at `{podRoot}apps/contacts/{id}.ttl` using the
  [vCard vocabulary](http://www.w3.org/2006/vcard/ns#)
  (`vcard:fn`, `vcard:hasEmail`, `vcard:hasTelephone`, `vcard:hasURL`,
  `vcard:organization-name`, `vcard:note`)

## Run it

```bash
export NODE_AUTH_TOKEN=<github read:packages PAT>   # @mind-studio packages
npm install
npm run dev    # → http://localhost:3130
```

Dev server runs on port **3130**.

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SOLID_ISSUER` | `https://pods.mindpods.org/` | Default Solid OIDC issuer on the login card |

## Architecture notes

- Next.js 16 App Router + React 19, UI entirely on `@mind-studio/ui`
  (Mind brand, dark default).
- The pod is the **only** store — no API routes persist anything, no DB.
- All pod I/O goes through `@inrupt/solid-client` with the session fetch
  (`src/lib/contacts/store.ts`).
- OIDC redirect handling is single-flight (`src/lib/solid/auth.ts`) — the
  one-time authorization code is redeemed exactly once per page load.

Sibling of Mind Drive, Chat, Shell, and the other mind prototypes —
independent app, own port, own data.
