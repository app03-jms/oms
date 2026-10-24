interface PdfColumn {
  label: string;
  width?: string;
}

interface PdfExportOptions {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  rows: (string | number | null)[][];
  summary?: { label: string; value: string | number }[];
  signatureBlocks?: { title: string; subtitle: string }[];
  fileName?: string;
}

export function exportToPdf(opts: PdfExportOptions): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Vui lòng cho phép cửa sổ popup để xuất PDF.');
    return;
  }

  const headerCells = opts.columns
    .map((c) => `<th style="${c.width ? `width:${c.width};` : ''}">${escapeHtml(c.label)}</th>`)
    .join('');

  const bodyRows = opts.rows
    .map(
      (row, ri) =>
        `<tr style="background:${ri % 2 === 0 ? '#fff' : '#f8fafc'}">
          ${row
            .map(
              (cell) =>
                `<td style="text-align:left;padding:6px 8px;border:1px solid #e2e8f0;font-size:11px;color:#1e293b">${cell === null || cell === '' ? '&mdash;' : escapeHtml(String(cell))}</td>`,
            )
            .join('')}
        </tr>`,
    )
    .join('');

  const summaryHtml = opts.summary
    ? `<div style="margin-top:20px;display:flex;gap:16px;flex-wrap:wrap">
        ${opts.summary
          .map(
            (s) =>
              `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;min-width:120px">
                <div style="font-size:11px;color:#64748b">${escapeHtml(s.label)}</div>
                <div style="font-size:20px;font-weight:700;color:#0f172a;margin-top:2px">${escapeHtml(String(s.value))}</div>
              </div>`,
          )
          .join('')}
      </div>`
    : '';

  const signatureHtml = opts.signatureBlocks?.length
    ? `<div style="margin-top:40px;display:flex;justify-content:space-between;gap:40px">
        ${opts.signatureBlocks
          .map(
            (b) =>
              `<div style="text-align:center;flex:1">
                <div style="font-weight:700;font-size:12px;color:#0f172a">${escapeHtml(b.title)}</div>
                <div style="font-size:11px;color:#64748b;margin-bottom:50px">${escapeHtml(b.subtitle)}</div>
                <div style="border-top:1px solid #475569;width:200px;margin:0 auto;padding-top:4px;font-size:11px;color:#64748b">${escapeHtml(b.title)}</div>
              </div>`,
          )
          .join('')}
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${escapeHtml(opts.title)}</title>
<style>
  @page { margin: 16mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; }
  th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; }
</style>
</head>
<body>
  <div style="border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:16px">
    <h1 style="font-size:18px;margin:0;color:#0f172a">${escapeHtml(opts.title)}</h1>
    ${opts.subtitle ? `<p style="font-size:12px;color:#64748b;margin:4px 0 0 0">${escapeHtml(opts.subtitle)}</p>` : ''}
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${summaryHtml}
  ${signatureHtml}
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 300); };
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
