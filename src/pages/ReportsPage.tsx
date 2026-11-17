import React, { useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import type { GeneratedReport, ReportType } from '../types/security';
import { DemoBadge, GlassCard } from '../components/ui/GlassPrimitives';

interface ReportsPageProps {
  reports: GeneratedReport[];
  onGenerateReport: (type: ReportType, dateRange: string) => GeneratedReport;
}

const REPORT_TYPES: ReportType[] = [
  'Security Overview',
  'Threat Detection Summary',
  'Incident Investigation',
  'Process Risk Analysis',
  'MITRE Technique Report',
  'Detection Performance',
];

export const ReportsPage: React.FC<ReportsPageProps> = ({ reports, onGenerateReport }) => {
  const [selectedType, setSelectedType] = useState<ReportType>('Security Overview');
  const [dateRange, setDateRange] = useState('Last 24 Hours');
  const [activeReportId, setActiveReportId] = useState(reports[0]?.id ?? '');

  const previewReport = reports.find((r) => r.id === activeReportId) ?? reports[0];

  const handleGenerate = () => {
    const created = onGenerateReport(selectedType, dateRange);
    setActiveReportId(created.id);
  };

  const handleExportJson = () => {
    if (!previewReport) return;
    const blob = new Blob([JSON.stringify(previewReport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${previewReport.id.toLowerCase()}-demo-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-50">Security Reports</h1>
            <DemoBadge label="DEMO REPORT STUDIO" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Generate executive &amp; SOC audit summaries from synthetic endpoint telemetry and export as JSON or PDF.
          </p>
        </div>
      </div>

      {/* Report Builder Bar */}
      <GlassCard className="no-print flex flex-wrap items-end gap-4">
        <div className="min-w-[210px] flex-1">
          <label htmlFor="report-type-select" className="mb-1 block text-xs font-medium text-slate-300">
            Report Template
          </label>
          <select
            id="report-type-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ReportType)}
            className="h-9.5 w-full rounded-xl border border-slate-300/15 bg-slate-950/60 px-3 text-xs text-slate-100 focus:border-cyan-400/50 focus:outline-none"
          >
            {REPORT_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[170px]">
          <label htmlFor="report-range-select" className="mb-1 block text-xs font-medium text-slate-300">
            Date Filter
          </label>
          <select
            id="report-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9.5 w-full rounded-xl border border-slate-300/15 bg-slate-950/60 px-3 text-xs text-slate-100 focus:border-cyan-400/50 focus:outline-none"
          >
            <option value="Last 24 Hours">Last 24 Hours</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="inline-flex h-9.5 items-center gap-2 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-sky-500/20 px-4 text-xs font-semibold text-cyan-50 hover:from-cyan-500/35 hover:to-sky-500/30 whitespace-nowrap shrink-0"
        >
          <FileText className="h-3.5 w-3.5" />
          Generate Report
        </button>
      </GlassCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Report History */}
        <GlassCard className="no-print space-y-2.5 xl:col-span-4">
          <h2 className="text-xs font-semibold text-slate-200">Report History ({reports.length})</h2>
          {reports.map((rpt) => (
            <button
              key={rpt.id}
              type="button"
              onClick={() => setActiveReportId(rpt.id)}
              className={`w-full rounded-xl border p-3 text-left text-xs transition-colors ${
                rpt.id === previewReport?.id
                  ? 'border-cyan-300/40 bg-cyan-500/15 text-slate-50'
                  : 'border-slate-300/10 bg-slate-900/45 text-slate-300 hover:border-cyan-300/30'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-cyan-300">
                <span>{rpt.id}</span>
                <span>{rpt.dateRange}</span>
              </div>
              <div className="mt-1 font-semibold">{rpt.title}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{rpt.type}</div>
            </button>
          ))}
        </GlassCard>

        {/* Report Preview Surface */}
        {previewReport && (
          <GlassCard className="space-y-5 xl:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-300/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-cyan-300">
                    {previewReport.id}
                  </span>
                  <DemoBadge label="DEMO DATA" />
                </div>
                <h2 className="font-display mt-1 text-xl font-semibold text-slate-50">
                  {previewReport.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {previewReport.type} · {previewReport.dateRange} · {previewReport.endpointScope}
                </p>
              </div>

              <div className="no-print flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/15 bg-slate-900/55 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-300/35"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-300" /> JSON Export
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/25"
                >
                  <Printer className="h-3.5 w-3.5" /> PDF / Print
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previewReport.metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-slate-300/10 bg-slate-950/45 p-3"
                >
                  <div className="text-[11px] text-slate-400">{m.label}</div>
                  <div className="font-display mt-1 text-lg font-bold text-slate-100 tabular-nums">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-slate-200">
              <h3 className="font-semibold text-cyan-200">Executive Summary</h3>
              <p>{previewReport.summary}</p>
              <p className="text-slate-400">
                Disclaimer: Metrics in this report reflect synthetic demonstration telemetry generated within KEYSHIELD AI and do not represent live production host instrumentation.
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
