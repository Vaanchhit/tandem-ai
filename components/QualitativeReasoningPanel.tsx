'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AssumptionRange, QualitativeResult } from '../lib/api';
import { runQualitativeAnalysis } from '../lib/api';

interface QualitativeReasoningPanelProps {
  companyId?: number;
  assumption?: AssumptionRange | null;
}

function formatAssumptionValue(assumption: AssumptionRange, value: number) {
  if (assumption.name === 'working_capital_days') {
    return `${value.toFixed(0)} days`;
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function QualitativeReasoningPanel({ companyId, assumption }: QualitativeReasoningPanelProps) {
  const [result, setResult] = useState<QualitativeResult | null>(null);

  useEffect(() => {
    setResult(null);
  }, [assumption?.name, companyId]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !assumption) {
        throw new Error('Select a company and assumption first.');
      }

      return runQualitativeAnalysis({
        company_id: companyId,
        assumption_key: assumption.name,
        current_value: assumption.value,
        context: `Review ${assumption.name}. Current rationale: ${assumption.rationale}`
      });
    },
    onSuccess(data) {
      setResult(data);
    }
  });

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-50">AI analyst</h2>
          <p className="mt-1 text-[14px] text-muted">Run contextual analysis against the selected assumption.</p>
        </div>
        <button
          onClick={() => analyzeMutation.mutate()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-[14px] font-semibold text-white transition hover:bg-[#6a9dff] disabled:opacity-60"
          disabled={!companyId || !assumption || analyzeMutation.status === 'pending'}
        >
          {analyzeMutation.status === 'pending' ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      <div className="space-y-4 px-6 py-5">
        {assumption ? (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Selected driver</p>
            <p className="mt-2 text-[15px] font-semibold text-slate-100">{assumption.name.replaceAll('_', ' ')}</p>
            <p className="mt-1 text-[13px] text-muted">Current value: {formatAssumptionValue(assumption, assumption.value)}</p>
          </div>
        ) : null}

        {result ? (
          <>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Recommended range</p>
              <p className="mt-2 text-[18px] font-semibold text-slate-50">
                {assumption ? formatAssumptionValue(assumption, result.recommended_range.low) : '—'}
                {' to '}
                {assumption ? formatAssumptionValue(assumption, result.recommended_range.high) : '—'}
              </p>
              <p className="mt-1 text-[13px] text-muted">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Rationale</p>
              <p className="mt-2 text-[14px] leading-6 text-slate-200">{result.rationale}</p>
            </div>

            {result.evidence?.length ? (
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Evidence</p>
                <div className="mt-3 space-y-2">
                  {result.evidence.map((item, index) => (
                    <div key={`${item.source}-${index}`} className="rounded-lg border border-border bg-panel px-3 py-3">
                      <p className="text-[13px] font-medium text-slate-100">{item.source}</p>
                      <p className="mt-1 text-[13px] leading-6 text-muted">{item.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-[14px] leading-6 text-muted">
            Select an assumption and run analysis to generate contextual guidance.
          </div>
        )}
      </div>
    </section>
  );
}
