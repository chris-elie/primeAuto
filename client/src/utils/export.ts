export type ExportValue = string | number | boolean | null;
export type ExportRow = Record<string, ExportValue>;
export type ExportSheet = { nom: string; lignes: ExportRow[]; colonnes?: string[] };
export type ExportColumn = { header: string; dataKey: string };

function todayKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function datedFilename(name: string, extension: 'xlsx' | 'pdf'): string {
  const baseName = name.replace(/\.(xlsx|pdf)$/i, '').replace(/[\\/:*?"<>|]/g, '_');
  return `${baseName}_${todayKey()}.${extension}`;
}

export function formatExportDate(value: string | null): string {
  if (!value) return '—';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(date);
}

export function formatExportCurrency(value: number): string {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

export function formatExportStatus(value: string): string {
  const statuses: Record<string, string> = {
    ok: 'OK',
    entretien: 'En entretien',
    panne: 'En panne',
    a_venir: 'À venir',
    en_retard: 'En retard',
    fait: 'Fait',
    recette: 'Recette',
    depense: 'Dépense',
  };
  return statuses[value] ?? (value.length > 0 ? `${value[0].toLocaleUpperCase('fr-CA')}${value.slice(1)}` : value);
}

export async function exportToExcel(nomFichier: string, feuilles: ExportSheet[]): Promise<void> {
  if (feuilles.length === 0) throw new Error('Aucune feuille à exporter.');
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  for (const feuille of feuilles) {
    const columns = feuille.colonnes ?? Object.keys(feuille.lignes[0] ?? {});
    const worksheet = feuille.lignes.length > 0
      ? XLSX.utils.json_to_sheet(feuille.lignes, { header: columns })
      : XLSX.utils.aoa_to_sheet([columns]);
    worksheet['!cols'] = columns.map((column) => {
      const maxLength = Math.max(column.length, ...feuille.lignes.map((row) => String(row[column] ?? '').length));
      return { wch: Math.min(Math.max(maxLength + 2, 12), 48) };
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, feuille.nom.slice(0, 31));
  }
  XLSX.writeFile(workbook, datedFilename(nomFichier, 'xlsx'));
}

export async function exportToPdf(titre: string, colonnes: ExportColumn[], lignes: ExportRow[], nomFichier: string): Promise<void> {
  if (colonnes.length === 0) throw new Error('Aucune colonne à exporter.');
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const document = new jsPDF({ orientation: colonnes.length > 5 ? 'landscape' : 'portrait' });
  const generationDate = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(new Date());

  autoTable(document, {
    startY: 38,
    columns: colonnes,
    body: lignes,
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { top: 38, right: 12, bottom: 18, left: 12 },
    didDrawPage: () => {
      document.setFont('helvetica', 'bold');
      document.setFontSize(13);
      document.setTextColor(15, 23, 42);
      document.text('primeAuto - Flotte & Logistique', 12, 14);
      document.setFont('helvetica', 'normal');
      document.setFontSize(11);
      document.text(titre, 12, 22);
      document.setFontSize(8);
      document.setTextColor(71, 85, 105);
      document.text(`Généré le ${generationDate}`, 12, 29);
    },
  });

  const pageCount = document.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8);
    document.setTextColor(100, 116, 139);
    document.text(`Page ${page} sur ${pageCount}`, document.internal.pageSize.getWidth() - 12, document.internal.pageSize.getHeight() - 8, { align: 'right' });
  }
  document.save(datedFilename(nomFichier, 'pdf'));
}
