import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

export interface ExportOption {
  key: string;
  label: string;
  icon: 'xlsx' | 'pdf';
  onClick: () => void;
}

interface ExportDropdownProps {
  options: ExportOption[];
}

export default function ExportDropdown({ options }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all active:scale-[0.98] bg-primary-soft/40 text-ink hover:bg-primary-soft/60 border border-line/40 px-4 py-2 text-sm"
      >
        <Download className="w-4 h-4" />
        Xuất dữ liệu
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-52 bg-card rounded-xl shadow-xl border border-line/30 z-50 overflow-hidden py-1">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setOpen(false); opt.onClick(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink hover:bg-primary-soft/30 transition-colors"
            >
              {opt.icon === 'xlsx' ? <FileSpreadsheet className="w-4 h-4 text-success" /> : <FileText className="w-4 h-4 text-danger" />}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
