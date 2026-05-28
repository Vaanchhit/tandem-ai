export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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

export async function fetchCompany(id: number) {
  return apiFetch<CompanyResponse>(`/company/${id}`);
}

export async function uploadDocument(formData: FormData) {
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Upload failed: ${response.status}`);
  }

  return response.json() as Promise<UploadResponse>;
}

export async function parseDocument(documentId: number) {
  return apiFetch<ValuationPayload>(`/parse/${documentId}`, {
    method: 'POST'
  });
}

export async function overrideAssumption(companyId: number, assumptionKey: string, value: number, reason: string) {
  return apiFetch<ValuationPayload>(`/assumptions/${companyId}/override`, {
    method: 'POST',
    body: JSON.stringify({
      assumption_key: assumptionKey,
      value,
      reason
    })
  });
}

export async function updateWorkbookCell(companyId: number, cell: { sheet: string; row: number; col: number; value: number; formula?: string | null }) {
  return apiFetch<ValuationPayload>(`/workbook/${companyId}/cell`, {
    method: 'PUT',
    body: JSON.stringify(cell)
  });
}

export async function runQualitativeAnalysis(input: {
  company_id: number;
  assumption_key: string;
  current_value: number;
  context: string;
}) {
  return apiFetch<QualitativeResult>('/qualitative/analyze', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
