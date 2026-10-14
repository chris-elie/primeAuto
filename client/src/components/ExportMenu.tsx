import { useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

type ExportAction = () => void | Promise<void>;
type ExportMenuProps = {
  onPdf: ExportAction;
  onExcel: ExportAction;
  onExportAllExcel?: ExportAction;
  pdfDisabled?: boolean;
  excelDisabled?: boolean;
  exportAllDisabled?: boolean;
};

export default function ExportMenu({
  onPdf,
  onExcel,
  onExportAllExcel,
  pdfDisabled = false,
  excelDisabled = false,
  exportAllDisabled = false,
}: ExportMenuProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noExports = pdfDisabled && excelDisabled && (!onExportAllExcel || exportAllDisabled);

  if (profile?.role !== 'gestionnaire') return null;

  const runExport = async (action: ExportAction) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      setIsOpen(false);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Impossible de générer le fichier d'export.");
    } finally {
      setLoading(false);
    }
  };

  const itemClass = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setIsOpen((open) => !open); setError(null); }}
        disabled={loading || noExports}
        title={noExports ? 'Aucune donnée à exporter' : 'Exporter'}
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-400" />}
        <span>{loading ? 'Génération...' : 'Exporter'}</span>
        {!loading && <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {isOpen && !loading && (
        <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-slate-700 bg-[#162032] p-1.5 shadow-xl">
          <button type="button" className={itemClass} disabled={pdfDisabled} onClick={() => void runExport(onPdf)}>
            <FileText className="h-4 w-4 text-red-400" /> PDF
          </button>
          <button type="button" className={itemClass} disabled={excelDisabled} onClick={() => void runExport(onExcel)}>
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Excel
          </button>
          {onExportAllExcel && (
            <>
              <div className="my-1 border-t border-slate-700" />
              <button type="button" className={itemClass} disabled={exportAllDisabled} onClick={() => void runExport(onExportAllExcel)}>
                <FileSpreadsheet className="h-4 w-4 text-blue-400" /> Tout exporter (Excel)
              </button>
            </>
          )}
        </div>
      )}
      {error && <p role="alert" className="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-red-500/30 bg-[#162032] p-2.5 text-xs text-red-300 shadow-xl">{error}</p>}
      {noExports && <span className="sr-only">Aucune donnée à exporter</span>}
    </div>
  );
}
