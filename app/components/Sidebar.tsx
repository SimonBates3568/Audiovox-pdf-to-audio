"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, FileText, Megaphone, User, LayoutList, Radio, BookOpen, Clock, Settings, Code } from "lucide-react";

export function Sidebar({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname() || "/";
  const active = (p: string) => {
    if (p === '/') return pathname === '/';
    return pathname.startsWith(p);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform md:static md:shadow-none w-64 md:w-72 lg:w-64 min-h-screen px-3 sm:px-4 py-6 flex flex-col justify-between`}
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 relative">
            <Image src="/audiovox-icon.svg" alt="logo" fill sizes="40px" />
          </div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Audiovox</h2>
          <button onClick={onClose} className="ml-auto md:hidden p-1 rounded-md" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <X size={16} />
          </button>
        </div>

        <nav className="space-y-1 text-sm" style={{ color: 'var(--muted-text)' }}>
          <Link href="/text" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active('/text') ? 'bg-[rgba(124,92,255,0.08)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
            <Megaphone size={18} />
            <span>Text to Speech</span>
          </Link>

          <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active('/') ? 'bg-[rgba(124,92,255,0.08)] font-medium' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
            <FileText size={18} />
            <span>File to Speech</span>
          </Link>

          <Link href="/voice" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active('/voice') ? 'bg-[rgba(124,92,255,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
            <Radio size={18} />
            <span>Voice Cloning</span>
          </Link>

          <Link href="/studio" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active('/studio') ? 'bg-[rgba(124,92,255,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
            <LayoutList size={18} />
            <span>Studio</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,230,179,0.08)', color: 'var(--muted-text)' }}>beta</span>
          </Link>

          <Link href="/ebook" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active('/ebook') ? 'bg-[rgba(124,92,255,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
            <BookOpen size={18} />
            <span>Ebook to Audiobook</span>
          </Link>

          <Link href="/history" className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active('/history') ? 'bg-[rgba(124,92,255,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
            <Clock size={18} />
            <span>History</span>
          </Link>
        </nav>

        <div className="mt-6 text-xs" style={{ color: 'var(--muted-text)' }}>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>Options</p>
          <div className="mt-2 space-y-1">
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.02)]" href="#">
              <User size={16} /> Profile
            </a>
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.02)]" href="/api-docs">
              <Code size={16} /> API
            </a>
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.02)]" href="/settings">
              <Settings size={16} /> Settings
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-2xl p-3 sm:p-4 mb-4" style={{ background: 'linear-gradient(90deg, rgba(124,92,255,0.12), rgba(0,212,255,0.04))', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Pro Subscription</p>
              <p className="text-xs" style={{ color: 'var(--muted-text)' }}>Get 2 Million characters monthly quota and all features</p>
            </div>
            <button className="ml-4 text-white text-sm px-3 py-1 rounded-md" style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}>Upgrade</button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-3 rounded-lg" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)', border: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-full" style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>S</div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Simon Bates</div>
            <div className="text-xs" style={{ color: 'var(--muted-text)' }}>6666 Credits</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
