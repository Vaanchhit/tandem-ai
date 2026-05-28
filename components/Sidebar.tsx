'use client';

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings2,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  companyName?: string;
  statusLabel: string;
  reviewCount: number;
  collapsed: boolean;
  onToggle: () => void;
}

const sections = [
  { id: 'profile', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Documents', icon: FileText },
  { id: 'review', label: 'Financials', icon: BarChart3 },
  { id: 'workbook', label: 'Workbook', icon: ClipboardList },
  { id: 'assumptions', label: 'Assumptions', icon: Settings2 },
  { id: 'rationale', label: 'AI Analyst', icon: Sparkles }
];

export function Sidebar({ companyName, statusLabel, reviewCount, collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`hidden xl:flex ${collapsed ? 'w-[88px]' : 'w-[248px]'} flex-col rounded-xl border border-border bg-panel p-4 transition-[width] duration-200`}>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className={`${collapsed ? 'hidden' : 'block'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Tandem AI</p>
          <p className="mt-1 text-sm text-slate-200">{companyName || 'No active company'}</p>
        </div>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition hover:border-primary/50 hover:text-slate-100"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1.5">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-surface hover:text-slate-50"
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="rounded-lg border border-border bg-surface p-3">
        {!collapsed ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
            <p className="mt-2 text-sm text-slate-100">{statusLabel}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Items to review</span>
              <span className="font-semibold text-slate-100">{reviewCount}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-center text-sm font-semibold text-slate-100">{reviewCount}</div>
        )}
      </div>
    </aside>
  );
}
