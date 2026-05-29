"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, FileText, Megaphone, User, LayoutList, Radio, BookOpen, Clock, Settings, Code } from "lucide-react";

export function Sidebar({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname() || "/";
  const active = (p: string) => {
    // Root path should be an exact match — other paths can use startsWith
    if (p === '/') return pathname === '/';
    return pathname.startsWith(p);
  };

  return (
  <aside className={`fixed inset-y-0 left-0 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform md:static md:shadow-none w-64 md:w-72 lg:w-64 min-h-screen bg-white dark:bg-[#0f0f0e] border-r border-gray-100 dark:border-gray-800 px-3 sm:px-4 py-6 flex flex-col justify-between`}> 
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 relative">
            <Image src="/audiovox-icon.svg" alt="logo" fill sizes="40px" />
          </div>
          <h2 className="text-lg font-semibold">Audiovox</h2>
          <button onClick={onClose} className="ml-auto md:hidden p-1 rounded-md bg-gray-100 dark:bg-gray-800">
            <X size={16} />
          </button>
        </div>

  <nav className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <Link href="/text" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active('/text') ? 'bg-gray-100 dark:bg-gray-900' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
            <Megaphone size={18} />
            <span>Text to Speech</span>
          </Link>
          <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active('/') ? 'bg-gray-100 dark:bg-gray-900 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
            <FileText size={18} />
            <span>File to Speech</span>
          </Link>
          <Link href="/voice" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
            <Radio size={18} />
            <span>Voice Cloning</span>
          </Link>
          <Link href="/studio" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
            <LayoutList size={18} />
            <span>Studio</span>
            <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-50 rounded-md text-yellow-700">beta</span>
          </Link>
          <Link href="/ebook" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
            <BookOpen size={18} />
            <span>Ebook to Audiobook</span>
          </Link>
          <Link href="/history" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
            <Clock size={18} />
            <span>History</span>
          </Link>
        </nav>

  <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p className="font-semibold text-gray-700 dark:text-gray-200">Options</p>
          <div className="mt-2 space-y-1">
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900" href="#">
              <User size={16} /> Profile
            </a>
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900" href="/api-docs">
              <Code size={16} /> API
            </a>
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900" href="#">
              <Settings size={16} /> Settings
            </a>
          </div>
        </div>
      </div>

  <div className="mt-6">
  <div className="rounded-2xl p-3 sm:p-4 bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/10 dark:to-transparent border border-gray-100 dark:border-gray-800 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Pro Subscription</p>
              <p className="text-xs text-gray-500">Get 2 Million characters monthly quota and all features</p>
            </div>
            <button className="ml-4 bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-sm px-3 py-1 rounded-md">Upgrade</button>
          </div>
        </div>

  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-3 py-3 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">S</div>
          <div>
            <div className="text-sm font-medium">Simon Bates</div>
            <div className="text-xs text-gray-500">6666 Credits</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
