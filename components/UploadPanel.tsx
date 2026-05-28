'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE, parseDocument, uploadDocument } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

interface UploadPanelProps {
  onCompanyCreated: (id: number) => void;
}

export function UploadPanel({ onCompanyCreated }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { setSelectedCompanyId, setParsedPayload } = useAppStore();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess(data) {
      setSelectedCompanyId(data.company_id);
      onCompanyCreated(data.company_id);
      setMessage('Upload complete. Parsing started.');

      parseDocument(data.document_id)
        .then((payload) => {
          setParsedPayload(payload);
          queryClient.invalidateQueries({ queryKey: ['company', data.company_id] });
          setMessage('Parsing complete. Review the extracted numbers and continue.');
        })
        .catch(() => {
          setMessage('Upload worked, but parsing failed. Try another PDF or continue with manual review.');
        });
    },
    onError(error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    }
  });

  const isUploading = uploadMutation.status === 'pending';

  return (
    <section className="rounded-xl border border-border bg-panel">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-[18px] font-semibold text-slate-50">Document intake</h2>
        <p className="mt-1 text-[14px] text-muted">Upload a source PDF. Tandem AI creates the company record, parses key figures, and updates the model.</p>
      </div>

      <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <label className="flex min-h-[180px] cursor-pointer flex-col justify-between rounded-xl border border-dashed border-border bg-surface p-6 transition hover:border-primary/50">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">File</p>
            <p className="mt-4 text-[18px] font-semibold text-slate-100">Select a PDF</p>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-muted">Annual reports, lender decks, and model appendices are supported. Keep the input to one company per upload.</p>
          </div>
          <div className="text-[14px] text-slate-300">{file?.name || 'No file selected'}</div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected);
              setMessage(null);
            }}
          />
        </label>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">Workflow</p>
          <div className="mt-4 space-y-3 text-[14px] text-slate-300">
            <p>1. Register company and document</p>
            <p>2. Extract financial fields</p>
            <p>3. Build workbook, assumptions, and checks</p>
          </div>

          <button
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#6a9dff] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!file || isUploading}
            onClick={() => {
              if (!file) return;
              const formData = new FormData();
              formData.append('file', file);
              uploadMutation.mutate(formData);
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload and parse'}
          </button>

          <div className="mt-4 rounded-lg border border-border bg-panel px-4 py-3 text-[13px] text-muted">
            {message || `Frontend API target: ${API_BASE}`}
          </div>
        </div>
      </div>
    </section>
  );
}
