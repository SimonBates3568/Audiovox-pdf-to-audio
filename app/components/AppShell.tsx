"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      <div className="flex-1">
        <header className="sticky top-0 z-20 p-4 sm:p-4 md:hidden" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="p-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Menu size={18} />
            </button>
            <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Audiovox</div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
