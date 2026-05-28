'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AssumptionRange } from '../lib/api';
import { overrideAssumption } from '../lib/api';

interface AssumptionsPanelProps {
  companyId?: number;
  assumptions?: AssumptionRange[];
  selectedAssumptionKey?: string | null;
  onSelectAssumption: (key: string) => void;
  onRefresh: () => void;
}

function formatAssumptionValue(name: string, value: number) {
  if (name === 'working_capital_days') {
    return `${value.toFixed(0)} days`;
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function AssumptionsPanel({
  companyId,
  assumptions = [],
  selectedAssumptionKey,
  onSelectAssumption,
  onRefresh
}: AssumptionsPanelProps) {
  const selected = useMemo(() => {
    if (assumptions.length === 0) return null;
    return assumptions.find((item) => item.name === selectedAssumptionKey) ?? assumptions[0];
  }, [assumptions, selectedAssumptionKey]);

  const [sliderValue, setSliderValue] = useState(selected?.value ?? 0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSliderValue(selected?.value ?? 0);
  }, [selected]);

  const overrideMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !selected) {
        throw new Error('No company or assumption selected.');
      }

      return overrideAssumption(companyId, selected.name, sliderValue, `Updated ${selected.name} from the assumptions panel.`);
    },
    onSuccess() {
      setMessage('Override applied.');
      onRefresh();
    },
    onError(error) {
      setMessage(error instanceof Error ? error.message : 'Unable to apply override.');
    }
  });

  if (!companyId || assumptions.length === 0 || !selected) {
    return (
      <section className="rounded-xl border border-border bg-panel">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-[18px] font-semibold text-slate-50">Assumptions</h2>
          <p className="mt-1 text-[14px] text-muted">Assumption controls appear after the model is generated.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-[18px] font-semibold text-slate-50">Assumptions</h2>
        <p className="mt-1 text-[14px] text-muted">Review system ranges, adjust the selected driver, and recalculate with intent.</p>
      </div>

      <div className="space-y-3 px-6 py-5">
        {assumptions.map((item) => (
          <button
            key={item.name}
            className={`w-full rounded-lg border px-4 py-3 text-left transition ${
              item.name === selected.name
                ? 'border-primary/40 bg-primary/10'
                : 'border-border bg-surface hover:border-primary/30'
            }`}
            onClick={() => onSelectAssumption(item.name)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] font-medium text-slate-100">{item.name.replaceAll('_', ' ')}</span>
              <span className="text-[12px] text-muted">{formatAssumptionValue(item.name, item.value)}</span>
            </div>
            <div className="mt-1 text-[12px] text-muted">
              Range {formatAssumptionValue(item.name, item.low)} to {formatAssumptionValue(item.name, item.high)}
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-border px-6 py-5">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-50">{selected.name.replaceAll('_', ' ')}</h3>
              <p className="mt-2 text-[14px] leading-6 text-muted">{selected.rationale}</p>
            </div>
            {selected.locked ? (
              <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[12px] font-medium text-primary">
                Locked
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-panel px-3 py-3">
              <p className="text-[12px] uppercase tracking-[0.14em] text-muted">Low</p>
              <p className="mt-1 text-[15px] font-semibold text-slate-100">{formatAssumptionValue(selected.name, selected.low)}</p>
            </div>
            <div className="rounded-lg border border-border bg-panel px-3 py-3">
              <p className="text-[12px] uppercase tracking-[0.14em] text-muted">High</p>
              <p className="mt-1 text-[15px] font-semibold text-slate-100">{formatAssumptionValue(selected.name, selected.high)}</p>
            </div>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min={selected.low}
              max={selected.high}
              step={selected.name === 'working_capital_days' ? 1 : 0.001}
              value={sliderValue}
              className="w-full accent-primary"
              onChange={(event) => setSliderValue(Number(event.target.value))}
            />
            <div className="mt-2 flex items-center justify-between text-[12px] text-muted">
              <span>Selected: {formatAssumptionValue(selected.name, sliderValue)}</span>
              <span>{selected.source || 'System range'}</span>
            </div>
          </div>

          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-[14px] font-semibold text-white transition hover:bg-[#6a9dff] disabled:opacity-50"
            disabled={overrideMutation.status === 'pending'}
            onClick={() => overrideMutation.mutate()}
          >
            {overrideMutation.status === 'pending' ? 'Applying...' : 'Apply override'}
          </button>

          {message ? <p className="mt-3 text-[13px] text-muted">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
