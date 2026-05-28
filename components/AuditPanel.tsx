'use client';

import type { AuditEntry, HygieneCheck } from '../lib/api';

interface AuditPanelProps {
  checks?: HygieneCheck[];
  auditLog?: AuditEntry[];
}

function CheckGroup({
  title,
  checks,
  tone
}: {
  title: string;
  checks: HygieneCheck[];
  tone: 'warn' | 'fail';
}) {
  if (checks.length === 0) return null;

  const styles =
    tone === 'fail'
      ? 'border-rose-500/20 bg-rose-500/5 text-rose-200'
      : 'border-amber-500/20 bg-amber-500/5 text-amber-200';

  return (
    <div className={`rounded-lg border p-4 ${styles}`}>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">
        {checks.map((check) => (
          <div key={check.check_id} className="rounded-lg border border-border bg-panel px-3 py-3">
            <p className="text-[14px] font-medium text-slate-100">{check.message}</p>
            <p className="mt-1 text-[13px] leading-6 text-muted">{check.suggested_fix}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuditPanel({ checks = [], auditLog = [] }: AuditPanelProps) {
  const failures = checks.filter((check) => check.status === 'fail');
  const warnings = checks.filter((check) => check.status === 'warn');

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-[18px] font-semibold text-slate-50">Audit and checks</h2>
        <p className="mt-1 text-[14px] text-muted">Validation output and activity history for the current model.</p>
      </div>

      <div className="space-y-4 px-6 py-5">
        <CheckGroup title={`${failures.length} critical issues`} checks={failures} tone="fail" />
        <CheckGroup title={`${warnings.length} warnings`} checks={warnings} tone="warn" />

        {checks.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-4 text-[14px] text-muted">
            No checks yet. Upload and parse a document to populate the validation layer.
          </div>
        ) : null}

        <div className="rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-[15px] font-semibold text-slate-100">Audit trail</h3>
          </div>

          {auditLog.length > 0 ? (
            <div className="divide-y divide-border">
              {auditLog
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[14px] font-medium text-slate-100">{entry.action.replaceAll('_', ' ')}</span>
                      <span className="text-[12px] text-muted">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-[14px] leading-6 text-slate-300">{entry.detail}</p>
                    <p className="mt-2 text-[12px] uppercase tracking-[0.12em] text-muted">User: {entry.user}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-[14px] text-muted">No audit entries yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
