"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@mind-studio/ui";
import { ensureSession } from "@/lib/solid/auth";

/**
 * Root route is a pure switchboard: signed in → /contacts, else → /connect.
 * `ensureSession` is the shared single-flight session check.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    ensureSession()
      .then((info) => {
        router.replace(info.isLoggedIn ? "/contacts" : "/connect");
      })
      .catch(() => router.replace("/connect"));
  }, [router]);

  return (
    <section className="flex flex-1 items-center justify-center py-24">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Spinner className="size-4" />
        <span className="text-sm">Loading…</span>
      </div>
    </section>
  );
}
