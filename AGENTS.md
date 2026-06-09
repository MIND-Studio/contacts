# AGENTS.md — contacts

Orientation rules for agents working in this prototype. **Read this before
editing any file here.**

## What it is

A privacy-first address book on Solid Pods — one vCard Turtle resource per
contact at `{podRoot}apps/contacts/{id}.ttl`
(vocab: `http://www.w3.org/2006/vcard/ns#`; email/phone are plain literals in
v0). Sibling of drive/chat/shell — independent app, own port, own data. Do
not unify with sibling prototypes.

## NOT the Next.js you know

Next.js **16.2.6** + React **19.2.4** — APIs have shifted from
training-cutoff knowledge. Read `node_modules/next/dist/docs/` before relying
on what you "know".

## Hard rules

1. **The pod is the ONLY store.** No API routes that persist anything, no DB,
   no server-side state. All reads/writes via `@inrupt/solid-client` with the
   session fetch (`src/lib/contacts/store.ts`). The app container
   `{podRoot}apps/contacts/` is created lazily on first write; a 404 on first
   list is the empty state, not an error.
2. **Single-flight OIDC.** `handleIncomingRedirect` is memoized in
   `src/lib/solid/auth.ts` and called exactly once per page load. Never add a
   second call site — the one-time code redeemed twice resets the session.
3. **Never log** tokens or credentials. WebID, route, status are fine.

## Design system

Entirely `@mind-studio/ui` (shadcn-native), default **Mind** brand, **dark**
default. Semantic tokens only (`bg-background`, `text-muted-foreground`,
`border`, `bg-primary`, …) — no bespoke palette. Tailwind v4, no config file;
`globals.css` imports `@mind-studio/ui/dist/styles.css` + `@source`s its dist.
RSC gotcha: don't import `Card`/`Badge`/`cn` into server components — pages
stay `"use client"` or plain markup + `Button asChild`.

`@mind-studio/ui` + `@mind-studio/core` install from GitHub Packages —
`export NODE_AUTH_TOKEN=<read:packages PAT>` before `npm install`.

## Solid gotchas

- `saveFileInContainer` slug is advisory — read the response's actual URL.
- Always pass `contentType` explicitly.
- No atomic rename / recursive delete in LDP.
- CSS v7 defaults to WAC.

## Ports

Dev server: **3130** (`npm run dev`). Default issuer
`https://pods.mindpods.org/`, overridable via `NEXT_PUBLIC_SOLID_ISSUER`.

## Never commit

`node_modules/`, `.next/`, `.env*`, `.css-data/`, `tsconfig.tsbuildinfo`.
