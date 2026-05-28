import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "./components/AppShell";

export const metadata: Metadata = {
  title: "Audiovox",
  description: "Upload any PDF and listen to it like an audiobook",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Suppress hydration warnings on the root html element. Some browser
    // extensions or external scripts (e.g. replay/recorder tools) can add
    // attributes to <html> before React hydrates which causes a warning:
    // "A tree hydrated but some attributes of the server rendered HTML didn't match".
    // Adding suppressHydrationWarning avoids noisy console warnings in dev.
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f9f9f7] dark:bg-[#1a1a18] text-[#1a1a18] dark:text-[#f0efe8]">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
