import { MonthlyPeriodData, PeriodFinancialSummary } from '../types/finance';
import { formatIDR } from './calculations';

export type TrackerExportFormat = 'PDF' | 'XLSX' | 'JPG';

/**
 * Menghasilkan konten XML SpreadsheetML (.xlsx / Excel Workbook) untuk Tracker Harian
 * lengkap dengan ringkasan Umum/Operasional dan Jajan De Aira + Nabung.
 */
export function buildExcelWorkbookXml(
  period: MonthlyPeriodData,
  summary: PeriodFinancialSummary,
  filterTag: 'ALL' | 'OPERASIONAL' | 'AIRA_SAVING' = 'ALL'
): string {
  const rows = period.dailyExpenses.filter((item) =>
    filterTag === 'ALL' ? true : item.groupTag === filterTag
  );

  const escapeXml = (str: string) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const xmlRows = rows
    .map(
      (item, idx) => `
      <Row>
        <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(item.date)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(item.description)}</Data></Cell>
        <Cell><Data ss:Type="String">${
          item.groupTag === 'AIRA_SAVING' ? 'Jajan De Aira + Nabung' : 'Umum / Operasional'
        }</Data></Cell>
        <Cell><Data ss:Type="Number">${item.qty}</Data></Cell>
        <Cell><Data ss:Type="Number">${item.unitPrice}</Data></Cell>
        <Cell><Data ss:Type="Number">${item.total}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(item.paymentMethod)}</Data></Cell>
      </Row>`
    )
    .join('');

  const filteredTotal = rows.reduce((acc, r) => acc + r.total, 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Tracker Harian ${escapeXml(period.periodId)}">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">LAPORAN TRACKER PENGELUARAN HARIAN - FINPAY PRO BY MROFIQI.ID (${escapeXml(
          period.monthLabel.toUpperCase()
        )})</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Tracker Harian</Data></Cell>
        <Cell><Data ss:Type="Number">${summary.dailyTrackerTotal}</Data></Cell>
        <Cell><Data ss:Type="String">Umum / Operasional</Data></Cell>
        <Cell><Data ss:Type="Number">${summary.dailyTrackerOperationalTotal}</Data></Cell>
        <Cell><Data ss:Type="String">Jajan De Aira + Nabung</Data></Cell>
        <Cell><Data ss:Type="Number">${summary.dailyTrackerAiraSavingTotal}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">No</Data></Cell>
        <Cell><Data ss:Type="String">Tanggal</Data></Cell>
        <Cell><Data ss:Type="String">Keterangan Pengeluaran</Data></Cell>
        <Cell><Data ss:Type="String">Kelompok Pos</Data></Cell>
        <Cell><Data ss:Type="String">Qty</Data></Cell>
        <Cell><Data ss:Type="String">Harga Satuan (Rp)</Data></Cell>
        <Cell><Data ss:Type="String">Total Otomatis (Rp)</Data></Cell>
        <Cell><Data ss:Type="String">Metode Pembayaran</Data></Cell>
      </Row>
      ${xmlRows}
      <Row>
        <Cell><Data ss:Type="String">TOTAL TRANSAKSI TERFILTER (${rows.length} ITEM)</Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="Number">${filteredTotal}</Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;
}

/**
 * Menghasilkan dokumen biner PDF asli (ISO-32000 %PDF-1.4) tanpa bergantung pada window.open
 */
export function buildValidPdfDocument(
  period: MonthlyPeriodData,
  summary: PeriodFinancialSummary,
  filterTag: 'ALL' | 'OPERASIONAL' | 'AIRA_SAVING' = 'ALL'
): string {
  const rows = period.dailyExpenses.filter((item) =>
    filterTag === 'ALL' ? true : item.groupTag === filterTag
  );

  const sanitizePdfText = (txt: string) =>
    String(txt)
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const lines: string[] = [
    `LAPORAN TRACKER HARIAN - FINPAY PRO (${period.monthLabel.toUpperCase()})`,
    `Pemilik: itptgaramofficial@gmail.com | Periode: ${period.periodId}`,
    `--------------------------------------------------------------------------------`,
    `Total Tracker Harian    : ${formatIDR(summary.dailyTrackerTotal)} (${summary.dailyTrackerCount}x transaksi)`,
    `Pos Umum / Operasional  : ${formatIDR(summary.dailyTrackerOperationalTotal)}`,
    `Jajan De Aira + Nabung  : ${formatIDR(summary.dailyTrackerAiraSavingTotal)}`,
    `Rekap COD / Transfer TF : COD ${formatIDR(summary.totalCodExpenses)} | TF ${formatIDR(summary.totalTfExpenses)}`,
    `--------------------------------------------------------------------------------`,
    `NO | TANGGAL  | KETERANGAN PENGELUARAN            | QTY | HARGA SATUAN | TOTAL        | METODE`,
    `--------------------------------------------------------------------------------`,
  ];

  rows.slice(0, 34).forEach((r, idx) => {
    const no = String(idx + 1).padStart(2, '0');
    const dateStr = r.date.padEnd(8, ' ').slice(0, 8);
    const descStr = r.description.padEnd(33, ' ').slice(0, 33);
    const qtyStr = String(r.qty).padStart(3, ' ');
    const unitStr = formatIDR(r.unitPrice).padStart(12, ' ');
    const totStr = formatIDR(r.total).padStart(12, ' ');
    const mtdStr = r.paymentMethod;
    lines.push(`${no} | ${dateStr} | ${descStr} | ${qtyStr} | ${unitStr} | ${totStr} | ${mtdStr}`);
  });

  if (rows.length > 34) {
    lines.push(`... dan ${rows.length - 34} transaksi lainnya (Total ${rows.length} transaksi)`);
  }

  lines.push(`--------------------------------------------------------------------------------`);
  const filteredTotal = rows.reduce((acc, r) => acc + r.total, 0);
  lines.push(`TOTAL KESELURUHAN (${rows.length} TRANSAKSI): ${formatIDR(filteredTotal)}`);

  const contentOps: string[] = ['BT', '/F1 8.5 Tf', '36 800 Td', '13 TL'];
  lines.forEach((line, i) => {
    const safe = sanitizePdfText(line);
    if (i === 0) {
      contentOps.push(`(${safe}) Tj`);
    } else {
      contentOps.push(`T* (${safe}) Tj`);
    }
  });
  contentOps.push('ET');

  const streamBody = contentOps.join('\n');

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`,
    `5 0 obj\n<< /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

/**
 * Mengunduh berkas Tracker Harian sesuai format yang dipilih (.PDF, .XLSX, atau .JPG)
 */
export function triggerTrackerExportDownload(
  format: TrackerExportFormat,
  period: MonthlyPeriodData,
  summary: PeriodFinancialSummary,
  filterTag: 'ALL' | 'OPERASIONAL' | 'AIRA_SAVING' = 'ALL'
): { filename: string; formatLabel: string; count: number } {
  const rows = period.dailyExpenses.filter((item) =>
    filterTag === 'ALL' ? true : item.groupTag === filterTag
  );

  if (format === 'XLSX') {
    const xmlContent = buildExcelWorkbookXml(period, summary, filterTag);
    const filename = `TRACKER_HARIAN_${period.periodId}.xlsx`;
    const blob = new Blob([xmlContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { filename, formatLabel: 'Excel (.xlsx)', count: rows.length };
  }

  if (format === 'PDF') {
    const pdfContent = buildValidPdfDocument(period, summary, filterTag);
    const filename = `TRACKER_HARIAN_${period.periodId}.pdf`;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { filename, formatLabel: 'Dokumen PDF (.pdf)', count: rows.length };
  }

  // Format JPG: Render laporan infografis resolusi tinggi pada HTML5 Canvas
  const filename = `TRACKER_HARIAN_${period.periodId}.jpg`;
  const displayRows = rows.slice(0, 22);
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = Math.max(760, 320 + displayRows.length * 36);
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Dark Luxury Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#07162c');
    bgGrad.addColorStop(1, '#091f24');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Accent Bar
    const accentGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    accentGrad.addColorStop(0, '#10b981');
    accentGrad.addColorStop(0.5, '#06b6d4');
    accentGrad.addColorStop(1, '#6366f1');
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, canvas.width, 10);

    // Title & Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(
      `LAPORAN TRACKER PENGELUARAN HARIAN — ${period.monthLabel.toUpperCase()}`,
      48,
      64
    );

    ctx.fillStyle = '#34d399';
    ctx.font = '16px monospace';
    ctx.fillText(
      `FinPay Pro Enterprise by mrofiqi.id | Total Tracker: ${formatIDR(
        summary.dailyTrackerTotal
      )} | Jajan De Aira + Nabung: ${formatIDR(summary.dailyTrackerAiraSavingTotal)}`,
      48,
      98
    );

    // Table Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(48, 130, canvas.width - 96, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('NO', 64, 155);
    ctx.fillText('TANGGAL', 120, 155);
    ctx.fillText('KETERANGAN PENGELUARAN', 250, 155);
    ctx.fillText('KELOMPOK POS', 720, 155);
    ctx.fillText('QTY', 960, 155);
    ctx.fillText('TOTAL OTOMATIS', 1050, 155);
    ctx.fillText('METODE', 1250, 155);

    // Table Rows
    displayRows.forEach((r, idx) => {
      const y = 198 + idx * 34;
      if (idx % 2 === 0) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.35)';
        ctx.fillRect(48, y - 22, canvas.width - 96, 32);
      }
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px monospace';
      ctx.fillText(String(idx + 1).padStart(2, '0'), 64, y);
      ctx.fillText(r.date, 120, y);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(r.description.slice(0, 38), 250, y);
      ctx.fillStyle = r.groupTag === 'AIRA_SAVING' ? '#fbbf24' : '#38bdf8';
      ctx.fillText(
        r.groupTag === 'AIRA_SAVING' ? 'Jajan De Aira + Nabung' : 'Umum / Operasional',
        720,
        y
      );
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(String(r.qty), 965, y);
      ctx.fillStyle = '#34d399';
      ctx.fillText(formatIDR(r.total), 1050, y);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(r.paymentMethod, 1250, y);
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return { filename, formatLabel: 'Gambar Infografis (.jpg)', count: rows.length };
}
