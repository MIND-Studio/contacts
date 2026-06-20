import { ThemeProvider } from "@mind-studio/ui";
import { mind } from "@mind-studio/ui/themes";
import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AccountChip from "@/components/AccountChip";
import { BrokerThemeSync } from "@/components/BrokerThemeSync";
import { StandaloneOnly } from "@/components/StandaloneOnly";
import ThemeToggle from "@/components/ThemeToggle";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mind Contacts — people you know, in your pod",
  description: "A privacy-first address book built on Solid Pods. People you know, in your pod.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-mind-theme="mind"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider
          theme={mind}
          defaultTheme="dark"
          enableSystem={false}
          storageKey="mind-contacts-theme"
        >
          <BrokerThemeSync />
          <StandaloneOnly>
            <Masthead />
          </StandaloneOnly>
          <main className="flex-1 flex flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

function Masthead() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-xl font-semibold tracking-tight">Mind Contacts</span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline">
            <span className="text-primary">●</span> people in your pod
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          <AccountChip />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
