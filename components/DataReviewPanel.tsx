'use client';

import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import type { CompanyResponse, FinancialMetric } from '../lib/api';

interface DataReviewPanelProps {
  companyData?: CompanyResponse | null;
}

interface FinancialRow {
  key: string;
  metric: string;
  value: string;
  confidence: number;
  source: string;
  status: string;
}

const fields: Array<{ label: string; key: string }> = [
  { label: 'Revenue', key: 'revenue' },
  { label: 'EBITDA', key: 'ebitda' },
  { label: 'EBIT', key: 'ebit' },
  { label: 'Net income', key: 'net_income' },
  { label: 'D&A', key: 'depreciation_amortization' },
  { label: 'Capex', key: 'capex' },
  { label: 'Working capital', key: 'working_capital' },
  { label: 'Debt', key: 'debt' },
  { label: 'Cash', key: 'cash' },
  { label: 'Share count', key: 'share_count' }
];

function formatMetric(metric?: FinancialMetric) {
  if (!metric || metric.value == null) return '—';
  if (metric.unit === 'shares') return metric.value.toLocaleString();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(metric.value);
}

function metricStatus(confidence: number) {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.55) return 'Review';
  return 'Check';
}

export function DataReviewPanel({ companyData }: DataReviewPanelProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'confidence', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const financials = companyData?.valuation?.financials;

  const data = useMemo<FinancialRow[]>(() => {
    return fields
      .map((field) => {
        const metric = financials?.[field.key];
        if (!metric) return null;
        const confidence = Math.max(0, Math.min(metric.confidence ?? 0, 1));
        return {
          key: field.key,
          metric: field.label,
          value: formatMetric(metric),
          confidence,
          source: metric.source || 'Document parsing',
          status: metricStatus(confidence)
        };
      })
      .filter(Boolean) as FinancialRow[];
  }, [financials]);

  const columns = useMemo<ColumnDef<FinancialRow>[]>(
    () => [
      {
        accessorKey: 'metric',
        header: 'Metric'
      },
      {
        accessorKey: 'value',
        header: 'Value'
      },
      {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: ({ row }) => `${Math.round(row.original.confidence * 100)}%`
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const styles =
            status === 'High'
              ? 'border-primary/30 bg-primary/10 text-primary'
              : status === 'Review'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300';
          return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-medium ${styles}`}>{status}</span>;
        }
      },
      {
        accessorKey: 'source',
        header: 'Source'
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <button
            className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition ${
              reviewed[row.original.key]
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-surface text-slate-200 hover:border-primary/40'
            }`}
            onClick={() =>
              setReviewed((current) => ({
                ...current,
                [row.original.key]: !current[row.original.key]
              }))
            }
          >
            {reviewed[row.original.key] ? 'Reviewed' : 'Mark reviewed'}
          </button>
        )
      }
    ],
    [reviewed]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString'
  });

  if (!financials || data.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-panel">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-[18px] font-semibold text-slate-50">Extracted financials</h2>
          <p className="mt-1 text-[14px] text-muted">Upload a document to populate the review table.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-50">Extracted financials</h2>
          <p className="mt-1 text-[14px] text-muted">Sorted, filterable review table for parsed metrics before valuation work starts.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Filter metrics"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-[14px] text-slate-100 outline-none placeholder:text-muted"
          />
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-muted">
            {data.filter((row) => row.status !== 'High').length} items need review
          </div>
        </div>
      </div>

      <div className="max-h-[460px] overflow-auto">
        <table className="min-w-full border-collapse text-left text-[14px]">
          <thead className="sticky top-0 z-10 bg-panel">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {header.isPlaceholder ? null : (
                      <button
                        className="inline-flex items-center gap-2"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: '↑',
                          desc: '↓'
                        }[header.column.getIsSorted() as string] ?? ''}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border transition hover:bg-surface/80">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle text-slate-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
