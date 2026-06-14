"use client";

import { createSolidClient } from "@mind-studio/core/solid";

/**
 * The Solid issuer used when the user hasn't picked one. Read from the app's
 * env here (core stays framework-agnostic) and handed to the shared client.
 */
export const DEFAULT_ISSUER =
  process.env.NEXT_PUBLIC_SOLID_ISSUER ?? "https://pods.mindpods.org/";

/**
 * The one shared Solid foundation for Mind Contacts — session, the single-flight
 * OIDC redirect handler, the shell capability bridge (broker), and a pod fs.
 * Everything that used to live in `session.ts` / `auth.ts` / `broker.ts` now
 * forwards to this instance; those files are thin re-export shims.
 */
export const solid = createSolidClient({
  appName: "contacts",
  clientName: "Mind Contacts",
  defaultReturnPath: "/contacts",
  defaultIssuer: DEFAULT_ISSUER,
});
