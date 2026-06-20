"use client";

import { clearLastIdentity } from "@mind-studio/core";
import { Button } from "@mind-studio/ui";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ensureSession } from "@/lib/solid/auth";
import { session } from "@/lib/solid/session";

/**
 * Header account chip: shows the WebID host when signed in plus a sign-out
 * button. Session state comes from the shared single-flight `ensureSession`,
 * so mounting this alongside the page body never double-redeems an OIDC code.
 */
export default function AccountChip() {
  const router = useRouter();
  const pathname = usePathname();
  const [webId, setWebId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureSession()
      .then((info) => {
        if (!cancelled) setWebId(info.webId ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Re-check after route changes (e.g. arriving from /login/callback).
  }, [pathname]);

  if (!webId) return null;

  const host = (() => {
    try {
      return new URL(webId).host;
    } catch {
      return webId;
    }
  })();

  async function onSignOut() {
    await session().logout();
    clearLastIdentity("Contacts");
    setWebId(null);
    router.replace("/connect");
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className="hidden rounded-full border bg-muted/40 px-3 py-1 font-mono text-[11px] text-muted-foreground sm:inline"
        title={webId}
      >
        {host}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onSignOut}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
