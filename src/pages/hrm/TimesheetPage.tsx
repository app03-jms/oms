import { useState, useMemo } from 'react';
import { useAttendanceLogs, useApprovalRequests, useEmployees, useShifts } from '@/hrm/store';
import type { AttendanceLog, AttendanceStatus } from '@/hrm/types';
import { Badge, Select, TextInput } from '@/components/ui';
import { CalendarCheck, Search, MapPin } from 'lucide-react';
import ExportDropdown from '@/components/ExportDropdown';
import { exportToPdf } from '@/utils/pdf';
import { localDateStr } from '@/hrm/dateUtils';

function formatDate(d: Date): string {
  return localDateStr(d);
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function monthStart(): string {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function monthEnd(): string {
  const d = new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function weekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

function weekEnd(): string {
  const start = new Date(weekStart());
  start.setDate(start.getDate() + 6);
  return formatDate(start);
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: 'success' | 'danger' | 'info' | 'primary' }> = {
  valid: { label: 'Đúng ca', color: 'success' },
  pending_approval: { label: 'Chờ duyệt', color: 'danger' },
  rejected: { label: 'Từ chối', color: 'info' },
};

export default function TimesheetPage() {
  const [logs] = useAttendanceLogs();
  const [approvals] = useApprovalRequests();
  const [employees] = useEmployees();
  const [shifts] = useShifts();
  const [fromDate, setFromDate] = useState<string>(monthStart());
  const [toDate, setToDate] = useState<string>(monthEnd());
  const [empFilter, setEmpFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const empName = (id: string) => employees.find((e) => e.id === id)?.display_name ?? '—';
  const empCode = (id: string) => employees.find((e) => e.id === id)?.employee_code ?? '';
  const shiftName = (id: string | null) => {
    if (!id) return '—';
    const s = shifts.find((x) => x.id === id);
    return s ? s.name : '—';
  };
  const shiftCode = (id: string | null) => {
    if (!id) return '';
    const s = shifts.find((x) => x.id === id);
    return (s?.code || 'OFF').toUpperCase();
  };

  // Find the approval request for a given attendance log
  const getApproval = (attId: string) => approvals.find((a) => a.attendance_id === attId);

  // Determine if adjusted shift differs from scheduled shift
  const hasAdjustedShift = (log: AttendanceLog) => {
    return log.actual_shift_id !== null && log.actual_shift_id !== log.shift_id;
  };

  const filtered = useMemo(() => {
    let list = [...logs];
    if (fromDate) list = list.filter((l) => l.date >= fromDate);
    if (toDate) list = list.filter((l) => l.date <= toDate);
    if (empFilter) list = list.filter((l) => l.employee_id === empFilter);
    if (search.trim()) {
      const q = (search || '').toLowerCase();
      list = list.filter((l) => {
        const name = (empName(l.employee_id) || '').toLowerCase();
        const code = (empCode(l.employee_id) || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    }
    return list.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.clock_in || '').localeCompare(a.clock_in || '');
    });
  }, [logs, fromDate, toDate, empFilter, search, employees]);

  const quickSelect = (preset: 'today' | 'week' | 'month') => {
    const today = formatDate(new Date());
    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === 'week') {
      setFromDate(weekStart());
      setToDate(weekEnd());
    } else {
      setFromDate(monthStart());
      setToDate(monthEnd());
    }
  };

  const exportTimesheetPdf = () => {
    const columns = [
      { label: 'Ngày' },
      { label: 'Nhân viên' },
      { label: 'Ca' },
      { label: 'Giờ vào', width: '55px' },
      { label: 'Giờ ra', width: '55px' },
      { label: 'Trạng thái' },
      { label: 'Ghi chú' },
    ];
    const rows = filtered.map((log) => {
      const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.valid;
      return [
        formatDateDisplay(log.date),
        `${empName(log.employee_id)} (${empCode(log.employee_id)})`,
        shiftCode(log.shift_id) || '—',
        log.clock_in || '—',
        log.clock_out || '—',
        cfg.label,
        log.mismatch_reason || log.admin_note || '',
      ];
    });
    const rangeLabel = `${formatDateDisplay(fromDate)} – ${formatDateDisplay(toDate)}`;
    exportToPdf({
      title: 'Bảng chấm công',
      subtitle: `Kỳ ${rangeLabel} · ${filtered.length} bản ghi`,
      columns,
      rows,
      summary: [
        { label: 'Tổng bản ghi', value: filtered.length },
        { label: 'Đúng ca', value: filtered.filter((l) => l.status === 'valid').length },
        { label: 'Chờ duyệt', value: filtered.filter((l) => l.status === 'pending_approval').length },
        { label: 'Ngoài bán kính', value: filtered.filter((l) => l.is_outside_radius).length },
      ],
      signatureBlocks: [
        { title: 'Người lập biểu', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'Trưởng phòng', subtitle: '(Ký, ghi rõ họ tên)' },
        { title: 'Giám đốc', subtitle: '(Ký, ghi rõ họ tên)' },
      ],
      fileName: `Bang_cham_cong_${rangeLabel.replace(/[/\s–]/g, '_')}.pdf`,
    });
  };

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Page header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>HRM</span>
          <span className="text-line">›</span>
          <span className="text-ink">Bảng chấm công</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ink leading-tight">Bảng chấm công</h1>
            <p className="text-sm text-info mt-0.5">Tổng hợp dữ liệu chấm công theo ngày và tháng.</p>
          </div>
          <ExportDropdown options={[
            { key: 'pdf', label: 'Xuất PDF (.pdf)', icon: 'pdf', onClick: exportTimesheetPdf },
          ]} />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-line/30 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick select */}
          <div className="inline-flex gap-1 bg-primary-soft/30 border border-line/40 rounded-lg p-1">
            {[
              { key: 'today', label: 'Hôm nay' },
              { key: 'week', label: 'Tuần này' },
              { key: 'month', label: 'Tháng này' },
            ].map((q) => (
              <button
                key={q.key}
                onClick={() => quickSelect(q.key as 'today' | 'week' | 'month')}
                className="px-3 py-1.5 text-xs font-medium rounded-md text-info hover:text-ink hover:bg-primary-soft/40 transition-all"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-[10px] text-line mb-0.5">Từ ngày</label>
              <TextInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-auto" />
            </div>
            <div className="mt-4 text-line">—</div>
            <div>
              <label className="block text-[10px] text-line mb-0.5">Đến ngày</label>
              <TextInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-auto" />
            </div>
          </div>

          {/* Employee filter */}
          <div>
            <label className="block text-[10px] text-line mb-0.5">Nhân viên</label>
            <Select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)} className="w-auto min-w-[160px]">
              <option value="">Tất cả</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.display_name}</option>
              ))}
            </Select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <label className="block text-[10px] text-line mb-0.5">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
              <TextInput
                className="pl-10"
                placeholder="Tên / mã NV..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-line/30 p-4">
          <p className="text-xs text-info mb-1">Tổng bản ghi</p>
          <p className="text-2xl font-bold text-ink">{filtered.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-line/30 p-4">
          <p className="text-xs text-info mb-1">Đúng ca</p>
          <p className="text-2xl font-bold text-success">
            {filtered.filter((l) => l.status === 'valid').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-line/30 p-4">
          <p className="text-xs text-info mb-1">Chờ duyệt</p>
          <p className="text-2xl font-bold text-danger">
            {filtered.filter((l) => l.status === 'pending_approval').length}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-line/30 p-4">
          <p className="text-xs text-info mb-1">Ngoài bán kính</p>
          <p className="text-2xl font-bold text-warning">
            {filtered.filter((l) => l.is_outside_radius).length}
          </p>
        </div>
      </div>

      {/* Timesheet table */}
      <div className="bg-card rounded-xl border border-line/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 text-info text-xs bg-bg-main/50">
                <th className="text-left py-3 px-4 font-medium">Ngày</th>
                <th className="text-left py-3 px-4 font-medium">Nhân viên</th>
                <th className="text-left py-3 px-4 font-medium">Ca lịch trình</th>
                <th className="text-left py-3 px-4 font-medium">Ca điều chỉnh</th>
                <th className="text-left py-3 px-4 font-medium">Giờ vào</th>
                <th className="text-left py-3 px-4 font-medium">Giờ ra</th>
                <th className="text-left py-3 px-4 font-medium">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <CalendarCheck className="w-10 h-10 text-line mx-auto mb-2" />
                    <p className="text-sm text-info">Không có dữ liệu chấm công trong khoảng thời gian này.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const cfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.valid;
                  const approval = getApproval(log.id);
                  const adjusted = hasAdjustedShift(log);
                  return (
                    <tr key={log.id} className="border-b border-line/20 hover:bg-bg-main/30 transition-colors">
                      <td className="py-3 px-4 text-info font-mono text-xs">{formatDateDisplay(log.date)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-ink text-sm">{empName(log.employee_id)}</span>
                          <span className="text-[10px] text-line font-mono">{empCode(log.employee_id)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {shiftCode(log.shift_id) && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-bold border bg-primary/10 text-primary border-primary/20">
                              {shiftCode(log.shift_id)}
                            </span>
                          )}
                          <span className="text-xs text-info">{shiftName(log.shift_id)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {adjusted ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-bold border bg-primary/15 text-primary border-primary/25">
                              {shiftCode(log.actual_shift_id)}
                            </span>
                            <span className="text-xs text-ink">{shiftName(log.actual_shift_id)}</span>
                            {approval && approval.status === 'pending' && (
                              <Badge color="danger">Chờ duyệt</Badge>
                            )}
                            {approval && approval.status === 'approved' && (
                              <Badge color="success">Đã duyệt</Badge>
                            )}
                            {approval && approval.status === 'rejected' && (
                              <Badge color="info">Từ chối</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-line">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-ink font-mono text-xs">{log.clock_in || '—'}</td>
                      <td className="py-3 px-4 text-ink font-mono text-xs">{log.clock_out || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge color={cfg.color}>{cfg.label}</Badge>
                          {log.is_outside_radius && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-warning">
                              <MapPin className="w-3 h-3" /> Ngoài bán kính
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-info max-w-[200px] truncate" title={log.mismatch_reason || log.admin_note || ''}>
                        {log.mismatch_reason || log.admin_note || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
