'use client';

import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ArrowRight, Bot, Database, FileSpreadsheet } from 'lucide-react';
import { UploadPanel } from '../components/UploadPanel';
import { WorkbookPanel } from '../components/WorkbookPanel';
import { Sidebar } from '../components/Sidebar';
import { AssumptionsPanel } from '../components/AssumptionsPanel';
import { StatusBadge } from '../components/StatusBadge';
import { DataReviewPanel } from '../components/DataReviewPanel';
import { QualitativeReasoningPanel } from '../components/QualitativeReasoningPanel';
import { AuditPanel } from '../components/AuditPanel';
import { fetchCompany } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

const queryClient = new QueryClient();

function currency(value?: number) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function metric(value?: number, suffix = 'x') {
  if (value == null) return '—';
  return `${value.toFixed(1)}${suffix}`;
}

function PageContent() {
  const { selectedCompanyId } = useAppStore();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [selectedAssumptionKey, setSelectedAssumptionKey] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const companyQuery = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      return fetchCompany(companyId);
    },
    enabled: !!companyId
  });

  useEffect(() => {
    if (!companyId && selectedCompanyId) {
      setCompanyId(selectedCompanyId);
    }
  }, [selectedCompanyId, companyId]);

  const companyData = companyQuery.data;
  const valuation = companyData?.valuation;
  const assumptions = valuation?.assumptions ?? [];
  const selectedAssumption = assumptions.find((item) => item.name === selectedAssumptionKey) ?? assumptions[0] ?? null;
  const checks = valuation?.checks ?? [];
  const financials = valuation?.financials ?? {};
  const lowConfidenceCount = Object.values(financials).filter((value: any) => value?.confidence != null && value.confidence < 0.55).length;
  const hasFailures = checks.some((check) => check.status === 'fail');
  const hasWarnings = checks.some((check) => check.status === 'warn');
  const statusState: 'ready' | 'warn' | 'error' = hasFailures ? 'error' : hasWarnings ? 'warn' : 'ready';
  const statusLabel = !companyId ? 'Awaiting source documents' : hasFailures ? 'Issues require review' : hasWarnings ? 'Model is usable with warnings' : 'Model is ready';

  useEffect(() => {
    if (!selectedAssumptionKey && assumptions.length > 0) {
      setSelectedAssumptionKey(assumptions[0].name);
      return;
    }

    if (selectedAssumptionKey && assumptions.length > 0 && !assumptions.some((item) => item.name === selectedAssumptionKey)) {
      setSelectedAssumptionKey(assumptions[0].name);
    }
  }, [assumptions, selectedAssumptionKey]);

  const summaryCards = useMemo(() => {
    return [
      {
        label: 'Enterprise value',
        value: currency(valuation?.valuation?.enterprise_value),
        icon: Database
      },
      {
        label: 'Equity value',
        value: currency(valuation?.valuation?.equity_value),
        icon: FileSpreadsheet
      },
      {
        label: 'Per share value',
        value: currency(valuation?.valuation?.per_share_value),
        icon: ArrowRight
      },
      {
        label: 'Implied EV / EBITDA',
        value: metric(valuation?.valuation?.implied_multiple),
        icon: Bot
      }
    ];
  }, [valuation]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[auto_minmax(0,1fr)]">
          <Sidebar
            companyName={companyData?.company?.company_name}
            statusLabel={statusLabel}
            reviewCount={lowConfidenceCount + checks.length}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((current) => !current)}
          />

          <main className="space-y-6">
            <section id="profile" className="rounded-xl border border-border bg-panel">
              <div className="grid gap-6 border-b border-border px-6 py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">Tandem AI</p>
                  <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-slate-50">AI-assisted valuation, built for judgment.</h1>
                  <p className="mt-3 max-w-3xl text-[14px] leading-6 text-muted">
                    Start with the company profile, load source documents, verify the extracted numbers, and move through assumptions,
                    workbook edits, and audit checks in one place.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Current profile</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-100">{companyData?.company?.company_name || 'No company loaded'}</p>
                    </div>
                    <StatusBadge state={statusState} label={statusLabel} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-muted">
                    <div className="rounded-lg border border-border bg-panel px-3 py-3">
                      <p>Low-confidence items</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-100">{lowConfidenceCount}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-panel px-3 py-3">
                      <p>Checks raised</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-100">{checks.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="rounded-lg border border-border bg-surface p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{card.label}</p>
                        <Icon size={15} className="text-muted" />
                      </div>
                      <p className="mt-4 text-[18px] font-semibold text-slate-50">{card.value}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-12">
              <section id="upload" className="xl:col-span-7">
                <UploadPanel onCompanyCreated={setCompanyId} />
              </section>

              <section className="xl:col-span-5">
                <div className="rounded-xl border border-border bg-panel">
                  <div className="border-b border-border px-6 py-4">
                    <h2 className="text-[18px] font-semibold text-slate-50">Operator checklist</h2>
                    <p className="mt-1 text-[14px] text-muted">Use the same sequence every time to keep the process consistent.</p>
                  </div>
                  <div className="space-y-3 px-6 py-5 text-[14px] text-slate-300">
                    <div className="rounded-lg border border-border bg-surface px-4 py-3">1. Load the source document.</div>
                    <div className="rounded-lg border border-border bg-surface px-4 py-3">2. Review extracted metrics and confidence levels.</div>
                    <div className="rounded-lg border border-border bg-surface px-4 py-3">3. Adjust assumptions only where judgment is needed.</div>
                    <div className="rounded-lg border border-border bg-surface px-4 py-3">4. Save workbook edits and export the final file.</div>
                  </div>
                </div>
              </section>

              <section id="review" className="xl:col-span-12">
                <DataReviewPanel companyData={companyData} />
              </section>

              <section id="workbook" className="xl:col-span-8">
                <WorkbookPanel companyId={companyData?.company?.id} workbook={valuation?.workbook} onRefresh={companyQuery.refetch} />
              </section>

              <section id="assumptions" className="xl:col-span-4">
                <AssumptionsPanel
                  companyId={companyData?.company?.id}
                  assumptions={assumptions}
                  selectedAssumptionKey={selectedAssumption?.name ?? null}
                  onSelectAssumption={setSelectedAssumptionKey}
                  onRefresh={companyQuery.refetch}
                />
              </section>

              <section id="rationale" className="xl:col-span-4">
                <QualitativeReasoningPanel companyId={companyData?.company?.id} assumption={selectedAssumption} />
              </section>

              <section id="audit" className="xl:col-span-8">
                <AuditPanel checks={checks} auditLog={valuation?.audit_log} />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <PageContent />
    </QueryClientProvider>
  );
}
