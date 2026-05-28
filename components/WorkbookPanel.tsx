'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { API_BASE, type WorkbookCell, type WorkbookSheet, updateWorkbookCell } from '../lib/api';

interface WorkbookPanelProps {
  companyId?: number;
  workbook?: WorkbookSheet[];
  onRefresh: () => void;
}

function formatCellValue(cell: WorkbookCell) {
  if (cell.value == null) return '';
  return Number.isInteger(cell.value) ? String(cell.value) : cell.value.toFixed(2);
}

export function WorkbookPanel({ companyId, workbook = [], onRefresh }: WorkbookPanelProps) {
  const [activeTab, setActiveTab] = useState(workbook[0]?.name ?? 'Inputs');
  const [filter, setFilter] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { value: string; formula: string }>>({});

  useEffect(() => {
    if (workbook.length > 0 && !workbook.some((sheet) => sheet.name === activeTab)) {
      setActiveTab(workbook[0].name);
    }
  }, [activeTab, workbook]);

  const activeSheet = useMemo(() => workbook.find((sheet) => sheet.name === activeTab) ?? workbook[0], [activeTab, workbook]);

  const filteredCells = useMemo(() => {
    const cells = activeSheet?.cells ?? [];
    if (!filter.trim()) return cells;
    const query = filter.trim().toLowerCase();
    return cells.filter((cell) => {
      return (
        cell.label?.toLowerCase().includes(query) ||
        cell.formula?.toLowerCase().includes(query) ||
        `${cell.sheet} r${cell.row} c${cell.col}`.toLowerCase().includes(query)
      );
    });
  }, [activeSheet?.cells, filter]);

  const previewTotal = useMemo(() => {
    return filteredCells.reduce((sum, cell) => sum + (typeof cell.value === 'number' ? cell.value : 0), 0);
  }, [filteredCells]);

  const saveMutation = useMutation({
    mutationFn: async (cell: WorkbookCell) => {
      if (!companyId) {
        throw new Error('No active company selected.');
      }

      const draftKey = `${cell.sheet}-${cell.row}-${cell.col}`;
      const value = drafts[draftKey]?.value;

      return updateWorkbookCell(companyId, {
        sheet: cell.sheet,
        row: cell.row,
        col: cell.col,
        value: value == null || value === '' ? Number(cell.value ?? 0) : Number(value),
        formula: drafts[draftKey]?.formula ?? cell.formula
      });
    },
    onSuccess() {
      onRefresh();
    }
  });

  const handleExport = async () => {
    if (!companyId) return;

    const response = await fetch(`${API_BASE}/export/${companyId}/xlsx`);
    if (!response.ok) return;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `valuation_${companyId}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (!companyId || workbook.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-panel">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-[18px] font-semibold text-slate-50">Workbook</h2>
          <p className="mt-1 text-[14px] text-muted">The workbook appears after a document has been parsed and the model has been created.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-50">Workbook</h2>
          <p className="mt-1 text-[14px] text-muted">Edit inputs, inspect formulas, and export the current model.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter workbook rows"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-[14px] text-slate-100 outline-none placeholder:text-muted"
          />
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-muted">
            Visible total: {previewTotal.toFixed(2)}
          </div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-[14px] font-semibold text-white transition hover:bg-[#6a9dff]"
            onClick={handleExport}
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border px-6 py-3">
        {workbook.map((sheet) => (
          <button
            key={sheet.name}
            className={`rounded-lg px-3 py-2 text-[13px] font-medium transition ${
              activeTab === sheet.name
                ? 'bg-primary text-white'
                : 'border border-border bg-surface text-slate-300 hover:border-primary/40 hover:text-slate-100'
            }`}
            onClick={() => setActiveTab(sheet.name)}
          >
            {sheet.name}
          </button>
        ))}
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="min-w-full border-collapse text-left text-[14px]">
          <thead className="sticky top-0 z-10 bg-panel">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Cell</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Label</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Formula</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Value</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Type</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCells.map((cell) => {
              const draftKey = `${cell.sheet}-${cell.row}-${cell.col}`;
              const draft = drafts[draftKey];

              return (
                <tr key={draftKey} className="border-b border-border transition hover:bg-surface/80">
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">
                    {cell.sheet}!R{cell.row}C{cell.col}
                  </td>
                  <td className="px-4 py-3 text-slate-100">{cell.label || '—'}</td>
                  <td className="px-4 py-3">
                    <input
                      value={draft?.formula ?? cell.formula ?? ''}
                      disabled={!cell.editable}
                      onChange={(event) => {
                        const formula = event.target.value;
                        setDrafts((current) => ({
                          ...current,
                          [draftKey]: {
                            value: current[draftKey]?.value ?? formatCellValue(cell),
                            formula
                          }
                        }));
                      }}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-slate-100 disabled:opacity-60"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={draft?.value ?? formatCellValue(cell)}
                      disabled={!cell.editable}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDrafts((current) => ({
                          ...current,
                          [draftKey]: {
                            value,
                            formula: current[draftKey]?.formula ?? cell.formula ?? ''
                          }
                        }));
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-[13px] text-slate-100 disabled:opacity-60 ${
                        cell.editable ? 'border-border bg-surface' : 'border-border bg-[#0d131a]'
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-medium ${
                        cell.editable
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-surface text-muted'
                      }`}
                    >
                      {cell.editable ? 'Input' : 'Locked'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-slate-200 transition hover:border-primary/40 disabled:opacity-50"
                      disabled={!cell.editable || saveMutation.status === 'pending'}
                      onClick={() => saveMutation.mutate(cell)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {saveMutation.isError ? (
        <div className="border-t border-border px-6 py-3 text-[13px] text-rose-300">
          {saveMutation.error instanceof Error ? saveMutation.error.message : 'Unable to save workbook changes.'}
        </div>
      ) : null}
    </section>
  );
}
