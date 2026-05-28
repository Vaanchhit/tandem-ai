export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const DEMO_STORAGE_KEY = 'tandem-demo-db';
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export interface FinancialMetric {
  field: string;
  value: number;
  unit?: string;
  confidence: number;
  source?: string | null;
}

export interface AssumptionRange {
  name: string;
  value: number;
  low: number;
  high: number;
  rationale: string;
  source?: string | null;
  locked?: boolean;
}

export interface HygieneCheck {
  check_id: string;
  severity: string;
  status: 'warn' | 'fail' | 'pass';
  message: string;
  suggested_fix: string;
  affected_path?: string | null;
}

export interface WorkbookCell {
  sheet: string;
  row: number;
  col: number;
  formula?: string | null;
  value?: number | null;
  label?: string | null;
  editable: boolean;
}

export interface WorkbookSheet {
  name: string;
  cells: WorkbookCell[];
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
  detail: string;
}

export interface ValuationSummary {
  enterprise_value: number;
  equity_value: number;
  per_share_value: number;
  implied_multiple: number;
  terminal_value: number;
  dcf_output: {
    forecast_fcf: number[];
    pv_fcf: number;
    pv_terminal: number;
  };
  comps_output: {
    avg_ev_to_ebitda: number;
    implied_value: number;
  };
  precedents_output: {
    avg_ev_to_ebitda: number;
    implied_value: number;
  };
}

export interface Comparable {
  company: string;
  ev_to_ebitda: number;
  price_to_earnings: number;
  revenue_growth: number;
}

export interface PrecedentTransaction {
  buyer: string;
  sector: string;
  ev_to_ebitda: number;
  premium: number;
  date: string;
}

export interface ValuationPayload {
  version: string;
  company: {
    id: number;
    company_name: string;
  };
  documents: Array<{
    id: number;
    filename: string;
    filepath: string;
  }>;
  financials?: Record<string, FinancialMetric>;
  assumptions: AssumptionRange[];
  valuation?: ValuationSummary;
  comps: Comparable[];
  precedents: PrecedentTransaction[];
  scenarios: Record<string, Record<string, number>>;
  checks: HygieneCheck[];
  workbook: WorkbookSheet[];
  audit_log: AuditEntry[];
}

export interface CompanyResponse {
  company: {
    id: number;
    company_name: string;
    industry?: string | null;
  };
  valuation: ValuationPayload;
}

export interface UploadResponse {
  company_id: number;
  document_id: number;
}

export interface QualitativeResult {
  assumption_key: string;
  recommended_range: {
    low: number;
    high: number;
  };
  current_value: number;
  confidence: number;
  rationale: string;
  evidence?: Array<{
    source: string;
    snippet: string;
  }>;
}

interface DemoDocument {
  id: number;
  company_id: number;
  filename: string;
  filepath: string;
}

interface DemoDatabase {
  nextCompanyId: number;
  nextDocumentId: number;
  companies: Record<number, CompanyResponse>;
  documents: Record<number, DemoDocument>;
}

function nowIso() {
  return new Date().toISOString();
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function defaultDemoDatabase(): DemoDatabase {
  return {
    nextCompanyId: 1,
    nextDocumentId: 1,
    companies: {},
    documents: {}
  };
}

function loadDemoDatabase(): DemoDatabase {
  if (!canUseLocalStorage()) {
    return defaultDemoDatabase();
  }

  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) {
    return defaultDemoDatabase();
  }

  try {
    return JSON.parse(raw) as DemoDatabase;
  } catch {
    return defaultDemoDatabase();
  }
}

function saveDemoDatabase(db: DemoDatabase) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db));
}

function createMetric(field: string, value: number, confidence: number, unit = 'USD'): FinancialMetric {
  return {
    field,
    value,
    unit,
    confidence,
    source: 'demo data'
  };
}

function buildDemoFinancials(companyName: string): Record<string, FinancialMetric> {
  const seed = companyName
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const revenue = 420 + (seed % 180);
  const ebitdaMargin = 0.24 + ((seed % 4) * 0.01);
  const ebitda = revenue * ebitdaMargin;
  const depreciation = revenue * 0.035;
  const ebit = ebitda - depreciation;
  const netIncome = ebit * 0.68;
  const capex = revenue * 0.055;
  const workingCapital = revenue * 0.09;
  const debt = revenue * 0.32;
  const cash = revenue * 0.08;
  const shareCount = 92 + (seed % 28);

  return {
    revenue: createMetric('revenue', round(revenue), 0.92),
    ebitda: createMetric('ebitda', round(ebitda), 0.89),
    ebit: createMetric('ebit', round(ebit), 0.84),
    net_income: createMetric('net_income', round(netIncome), 0.8),
    depreciation_amortization: createMetric('depreciation_amortization', round(depreciation), 0.76),
    capex: createMetric('capex', round(capex), 0.7),
    working_capital: createMetric('working_capital', round(workingCapital), 0.68),
    debt: createMetric('debt', round(debt), 0.9),
    cash: createMetric('cash', round(cash), 0.92),
    share_count: createMetric('share_count', round(shareCount), 0.88, 'shares')
  };
}

function buildAssumptions(): AssumptionRange[] {
  return [
    { name: 'revenue_cagr', value: 0.085, low: 0.05, high: 0.12, rationale: 'Anchored to current pipeline conversion and historical growth.', source: 'demo model', locked: false },
    { name: 'ebitda_margin', value: 0.24, low: 0.2, high: 0.28, rationale: 'Reflects operating leverage and peer margin structure.', source: 'demo model', locked: false },
    { name: 'terminal_growth', value: 0.025, low: 0.015, high: 0.035, rationale: 'Long-run growth anchored to mature market expansion.', source: 'demo model', locked: false },
    { name: 'wacc', value: 0.095, low: 0.08, high: 0.12, rationale: 'Cost of capital aligned with sponsor return thresholds.', source: 'demo model', locked: false },
    { name: 'tax_rate', value: 0.245, low: 0.21, high: 0.28, rationale: 'Normalized effective tax rate for the target jurisdiction.', source: 'demo model', locked: false },
    { name: 'capex_to_revenue', value: 0.055, low: 0.045, high: 0.075, rationale: 'Maintenance plus growth investment profile.', source: 'demo model', locked: false },
    { name: 'working_capital_days', value: 28, low: 18, high: 45, rationale: 'Reflects current collections and inventory cycle.', source: 'demo model', locked: false }
  ];
}

function buildComps(): Comparable[] {
  return [
    { company: 'Northbridge Systems', ev_to_ebitda: 10.6, price_to_earnings: 16.9, revenue_growth: 0.11 },
    { company: 'Keystone Platforms', ev_to_ebitda: 9.8, price_to_earnings: 15.4, revenue_growth: 0.08 },
    { company: 'Summit Analytics', ev_to_ebitda: 11.7, price_to_earnings: 18.8, revenue_growth: 0.13 }
  ];
}

function buildPrecedents(): PrecedentTransaction[] {
  return [
    { buyer: 'Harbor Capital', sector: 'Software', ev_to_ebitda: 11.4, premium: 0.27, date: '2025-03-18' },
    { buyer: 'Monarch Partners', sector: 'Business Services', ev_to_ebitda: 10.2, premium: 0.22, date: '2024-11-07' }
  ];
}

function assumptionMap(assumptions: AssumptionRange[]) {
  return Object.fromEntries(assumptions.map((assumption) => [assumption.name, assumption.value]));
}

function discount(rate: number, period: number) {
  return 1 / ((1 + rate) ** period);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function buildValuation(financials: Record<string, FinancialMetric>, assumptions: AssumptionRange[]): ValuationSummary {
  const map = assumptionMap(assumptions);
  const revenue = financials.revenue.value;
  const shareCount = financials.share_count.value || 1;
  const currentEbitda = financials.ebitda.value || revenue * map.ebitda_margin;
  const forecastFcf: number[] = [];

  for (let year = 1; year <= 5; year += 1) {
    const rev = revenue * ((1 + map.revenue_cagr) ** year);
    const ebitda = rev * map.ebitda_margin;
    const depreciation = financials.depreciation_amortization.value || rev * 0.03;
    const ebit = ebitda - depreciation;
    const tax = Math.max(0, ebit * map.tax_rate);
    const capex = rev * map.capex_to_revenue;
    const fcff = ebit - tax + depreciation - capex;
    forecastFcf.push(round(fcff));
  }

  const pvFcf = round(forecastFcf.reduce((sum, cashFlow, index) => sum + (cashFlow * discount(map.wacc, index + 1)), 0));
  const terminalValue = round((forecastFcf[forecastFcf.length - 1] * (1 + map.terminal_growth)) / (map.wacc - map.terminal_growth));
  const pvTerminal = round(terminalValue * discount(map.wacc, 5));
  const enterpriseValue = round(pvFcf + pvTerminal);
  const equityValue = round(enterpriseValue + financials.cash.value - financials.debt.value);
  const perShareValue = round(equityValue / Math.max(shareCount, 1));

  const comps = buildComps();
  const precedents = buildPrecedents();
  const avgCompMultiple = comps.reduce((sum, row) => sum + row.ev_to_ebitda, 0) / comps.length;
  const avgPrecedentMultiple = precedents.reduce((sum, row) => sum + row.ev_to_ebitda, 0) / precedents.length;

  return {
    enterprise_value: enterpriseValue,
    equity_value: equityValue,
    per_share_value: perShareValue,
    implied_multiple: round(enterpriseValue / Math.max(currentEbitda, 1)),
    terminal_value: terminalValue,
    dcf_output: {
      forecast_fcf: forecastFcf,
      pv_fcf: pvFcf,
      pv_terminal: pvTerminal
    },
    comps_output: {
      avg_ev_to_ebitda: round(avgCompMultiple),
      implied_value: round(currentEbitda * avgCompMultiple)
    },
    precedents_output: {
      avg_ev_to_ebitda: round(avgPrecedentMultiple),
      implied_value: round(currentEbitda * avgPrecedentMultiple)
    }
  };
}

function buildChecks(assumptions: AssumptionRange[], valuation: ValuationSummary): HygieneCheck[] {
  const map = assumptionMap(assumptions);
  const checks: HygieneCheck[] = [];

  if (map.terminal_growth > 0.04) {
    checks.push({
      check_id: 'terminal_growth_high',
      severity: 'warn',
      status: 'warn',
      message: 'Terminal growth exceeds a conservative long-run threshold.',
      suggested_fix: 'Reduce terminal growth or document a stronger growth case.',
      affected_path: 'assumptions.terminal_growth'
    });
  }

  if (map.wacc <= 0) {
    checks.push({
      check_id: 'negative_wacc',
      severity: 'fail',
      status: 'fail',
      message: 'WACC must be positive.',
      suggested_fix: 'Set a positive weighted average cost of capital.',
      affected_path: 'assumptions.wacc'
    });
  }

  if (valuation.implied_multiple > 14) {
    checks.push({
      check_id: 'multiple_review',
      severity: 'warn',
      status: 'warn',
      message: 'Implied EV / EBITDA screens rich versus the current demo peer set.',
      suggested_fix: 'Revisit growth, margin, or cost of capital assumptions.',
      affected_path: 'valuation.implied_multiple'
    });
  }

  return checks;
}

function buildWorkbook(
  financials: Record<string, FinancialMetric>,
  assumptions: AssumptionRange[],
  valuation: ValuationSummary
): WorkbookSheet[] {
  return [
    {
      name: 'Inputs',
      cells: [
        { sheet: 'Inputs', row: 1, col: 1, label: 'Revenue', formula: '', value: financials.revenue.value, editable: true },
        { sheet: 'Inputs', row: 2, col: 1, label: 'EBITDA', formula: '', value: financials.ebitda.value, editable: true },
        { sheet: 'Inputs', row: 3, col: 1, label: 'Debt', formula: '', value: financials.debt.value, editable: true },
        { sheet: 'Inputs', row: 4, col: 1, label: 'Cash', formula: '', value: financials.cash.value, editable: true },
        { sheet: 'Inputs', row: 5, col: 1, label: 'Share count', formula: '', value: financials.share_count.value, editable: true }
      ]
    },
    {
      name: 'Assumptions',
      cells: assumptions.map((assumption, index) => ({
        sheet: 'Assumptions',
        row: index + 1,
        col: 1,
        label: assumption.name,
        formula: '',
        value: assumption.value,
        editable: true
      }))
    },
    {
      name: 'DCF',
      cells: [
        { sheet: 'DCF', row: 1, col: 1, label: 'Enterprise Value', formula: '=SUM(Forecast FCFF)+PV(Terminal)', value: valuation.enterprise_value, editable: false },
        { sheet: 'DCF', row: 2, col: 1, label: 'Equity Value', formula: '=EV+Cash-Debt', value: valuation.equity_value, editable: false },
        { sheet: 'DCF', row: 3, col: 1, label: 'Per Share Value', formula: '=Equity Value / Share Count', value: valuation.per_share_value, editable: false }
      ]
    },
    {
      name: 'Summary',
      cells: [
        { sheet: 'Summary', row: 1, col: 1, label: 'Implied EV / EBITDA', formula: '=Enterprise Value / EBITDA', value: valuation.implied_multiple, editable: false },
        { sheet: 'Summary', row: 2, col: 1, label: 'Terminal Value', formula: '=Final Year FCFF * (1+g)/(WACC-g)', value: valuation.terminal_value, editable: false }
      ]
    }
  ];
}

function createCompanyResponse(companyId: number, companyName: string, filename: string): CompanyResponse {
  const financials = buildDemoFinancials(companyName);
  const assumptions = buildAssumptions();
  const valuation = buildValuation(financials, assumptions);
  const checks = buildChecks(assumptions, valuation);
  const documents = [
    {
      id: companyId,
      filename,
      filepath: `/demo/${filename}`
    }
  ];

  return {
    company: {
      id: companyId,
      company_name: companyName,
      industry: 'Application Software'
    },
    valuation: {
      version: '1.0-demo',
      company: {
        id: companyId,
        company_name: companyName
      },
      documents,
      financials,
      assumptions,
      valuation,
      comps: buildComps(),
      precedents: buildPrecedents(),
      scenarios: {
        bear: { revenue_cagr: 0.06, wacc: 0.105 },
        base: { revenue_cagr: 0.085, wacc: 0.095 },
        bull: { revenue_cagr: 0.11, wacc: 0.087 }
      },
      checks,
      workbook: buildWorkbook(financials, assumptions, valuation),
      audit_log: [
        {
          timestamp: nowIso(),
          action: 'parsed_document',
          user: 'system',
          detail: `Generated a demo valuation package from ${filename}.`
        }
      ]
    }
  };
}

function ensureDemoCompany(db: DemoDatabase, filename: string, explicitName?: string): UploadResponse {
  const companyId = db.nextCompanyId;
  const documentId = db.nextDocumentId;
  const companyName = explicitName || filename.replace(/\.pdf$/i, '') || `Demo Company ${companyId}`;
  const company = createCompanyResponse(companyId, companyName, filename);

  company.valuation.documents = [
    {
      id: documentId,
      filename,
      filepath: `/demo/${filename}`
    }
  ];

  db.companies[companyId] = company;
  db.documents[documentId] = {
    id: documentId,
    company_id: companyId,
    filename,
    filepath: `/demo/${filename}`
  };
  db.nextCompanyId += 1;
  db.nextDocumentId += 1;
  saveDemoDatabase(db);

  return {
    company_id: companyId,
    document_id: documentId
  };
}

function fieldKeyFromLabel(label?: string | null) {
  const map: Record<string, string> = {
    Revenue: 'revenue',
    EBITDA: 'ebitda',
    EBIT: 'ebit',
    'Net income': 'net_income',
    'D&A': 'depreciation_amortization',
    'Depreciation & amortization': 'depreciation_amortization',
    Capex: 'capex',
    'Working capital': 'working_capital',
    Debt: 'debt',
    Cash: 'cash',
    'Share count': 'share_count'
  };

  return label ? map[label] : undefined;
}

function rebuildCompany(company: CompanyResponse, action: string, detail: string) {
  const financials = company.valuation.financials ?? {};
  const assumptions = company.valuation.assumptions;
  const valuation = buildValuation(financials, assumptions);
  const checks = buildChecks(assumptions, valuation);

  company.valuation.valuation = valuation;
  company.valuation.checks = checks;
  company.valuation.workbook = buildWorkbook(financials, assumptions, valuation);
  company.valuation.audit_log = [
    ...company.valuation.audit_log,
    {
      timestamp: nowIso(),
      action,
      user: 'analyst',
      detail
    }
  ];

  return company;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function withDemoFallback<T>(request: () => Promise<T>, fallback: () => T | Promise<T>) {
  if (DEMO_MODE) {
    return fallback();
  }

  try {
    return await request();
  } catch {
    return fallback();
  }
}

export function isDemoModeEnabled() {
  return DEMO_MODE;
}

export async function fetchCompany(id: number) {
  return withDemoFallback(
    () => apiFetch<CompanyResponse>(`/company/${id}`),
    () => {
      const db = loadDemoDatabase();
      const company = db.companies[id];
      if (!company) {
        throw new Error('Company not found');
      }
      return company;
    }
  );
}

export async function uploadDocument(formData: FormData) {
  return withDemoFallback(
    async () => {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Upload failed: ${response.status}`);
      }

      return response.json() as Promise<UploadResponse>;
    },
    () => {
      const file = formData.get('file') as File | null;
      const db = loadDemoDatabase();
      return ensureDemoCompany(db, file?.name || 'Demo Investment Memo.pdf');
    }
  );
}

export async function seedDemoCompany(companyName = 'Tandem Industrial Solutions') {
  const db = loadDemoDatabase();
  return ensureDemoCompany(db, `${companyName}.pdf`, companyName);
}

export async function parseDocument(documentId: number) {
  return withDemoFallback(
    () => apiFetch<ValuationPayload>(`/parse/${documentId}`, {
      method: 'POST'
    }),
    () => {
      const db = loadDemoDatabase();
      const document = db.documents[documentId];
      if (!document) {
        throw new Error('Document not found');
      }

      const company = db.companies[document.company_id];
      if (!company) {
        throw new Error('Company not found');
      }

      company.valuation.audit_log = [
        {
          timestamp: nowIso(),
          action: 'parsed_document',
          user: 'system',
          detail: `Processed ${document.filename} using demo fallback mode.`
        }
      ];

      db.companies[document.company_id] = company;
      saveDemoDatabase(db);
      return company.valuation;
    }
  );
}

export async function overrideAssumption(companyId: number, assumptionKey: string, value: number, reason: string) {
  return withDemoFallback(
    () => apiFetch<ValuationPayload>(`/assumptions/${companyId}/override`, {
      method: 'POST',
      body: JSON.stringify({
        assumption_key: assumptionKey,
        value,
        reason
      })
    }),
    () => {
      const db = loadDemoDatabase();
      const company = db.companies[companyId];
      if (!company) {
        throw new Error('Company not found');
      }

      company.valuation.assumptions = company.valuation.assumptions.map((assumption) =>
        assumption.name === assumptionKey ? { ...assumption, value, locked: true } : assumption
      );
      rebuildCompany(company, 'override', `${assumptionKey} overridden to ${value}.`);
      db.companies[companyId] = company;
      saveDemoDatabase(db);

      return company.valuation;
    }
  );
}

export async function updateWorkbookCell(companyId: number, cell: { sheet: string; row: number; col: number; value: number; formula?: string | null }) {
  return withDemoFallback(
    () => apiFetch<ValuationPayload>(`/workbook/${companyId}/cell`, {
      method: 'PUT',
      body: JSON.stringify(cell)
    }),
    () => {
      const db = loadDemoDatabase();
      const company = db.companies[companyId];
      if (!company) {
        throw new Error('Company not found');
      }

      company.valuation.workbook = company.valuation.workbook.map((sheet) => {
        if (sheet.name !== cell.sheet) return sheet;
        return {
          ...sheet,
          cells: sheet.cells.map((item) =>
            item.row === cell.row && item.col === cell.col
              ? { ...item, value: cell.value, formula: cell.formula ?? item.formula }
              : item
          )
        };
      });

      if (cell.sheet === 'Inputs') {
        const target = company.valuation.workbook
          .find((sheet) => sheet.name === 'Inputs')
          ?.cells.find((item) => item.row === cell.row && item.col === cell.col);
        const fieldKey = fieldKeyFromLabel(target?.label);

        if (fieldKey && company.valuation.financials?.[fieldKey]) {
          company.valuation.financials[fieldKey] = {
            ...company.valuation.financials[fieldKey],
            value: cell.value
          };
        }
      }

      if (cell.sheet === 'Assumptions') {
        const target = company.valuation.workbook
          .find((sheet) => sheet.name === 'Assumptions')
          ?.cells.find((item) => item.row === cell.row && item.col === cell.col);
        const assumptionName = target?.label;

        if (assumptionName) {
          company.valuation.assumptions = company.valuation.assumptions.map((assumption) =>
            assumption.name === assumptionName ? { ...assumption, value: cell.value } : assumption
          );
        }
      }

      rebuildCompany(company, 'workbook_edit', `Updated ${cell.sheet} R${cell.row}C${cell.col}.`);
      db.companies[companyId] = company;
      saveDemoDatabase(db);

      return company.valuation;
    }
  );
}

export async function runQualitativeAnalysis(input: {
  company_id: number;
  assumption_key: string;
  current_value: number;
  context: string;
}) {
  return withDemoFallback(
    () => apiFetch<QualitativeResult>('/qualitative/analyze', {
      method: 'POST',
      body: JSON.stringify(input)
    }),
    () => {
      const spread = input.assumption_key === 'working_capital_days' ? 4 : 0.02;
      const low = input.assumption_key === 'working_capital_days'
        ? Math.max(10, input.current_value - spread)
        : Math.max(0.01, input.current_value - spread);
      const high = input.current_value + (input.assumption_key === 'working_capital_days' ? 6 : 0.03);

      return {
        assumption_key: input.assumption_key,
        recommended_range: {
          low: round(low),
          high: round(high)
        },
        current_value: input.current_value,
        confidence: 0.79,
        rationale: 'Demo analysis suggests the current range is broadly supportable, with modest room for upside if execution remains on plan and capital intensity stays contained.',
        evidence: [
          {
            source: 'Management case',
            snippet: 'Current budget assumptions remain consistent with base-case execution and recent operating cadence.'
          },
          {
            source: 'Peer reference set',
            snippet: 'Comparable assets continue to trade within a range that supports the midpoint valuation view.'
          }
        ]
      };
    }
  );
}
