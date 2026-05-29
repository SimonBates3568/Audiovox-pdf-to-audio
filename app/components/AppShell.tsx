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
        <header className="sticky top-0 z-20 bg-white dark:bg-[#0b0b0a] border-b border-gray-100 dark:border-gray-800 p-4 sm:p-4 md:hidden">
          <button onClick={() => setOpen(true)} className="p-2 rounded-md bg-gray-100 dark:bg-gray-800">
            <Menu size={18} />
          </button>
          <div className="text-lg font-semibold">Audiovox</div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
