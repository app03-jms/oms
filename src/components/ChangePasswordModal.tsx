import { useState } from 'react';
import { Eye, EyeOff, Lock, Save, AlertCircle, KeyRound } from 'lucide-react';
import { changePassword } from '@/store/authStore';
import { Button } from '@/components/ui';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  /** When true, the modal cannot be dismissed (forced change on first login). */
  forced?: boolean;
  /** Called after a successful password change. */
  onSuccess?: () => void;
}

const MIN_LENGTH = 6;

export default function ChangePasswordModal({ open, onClose, forced = false, onSuccess }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError('');
    setShowCurrent(false);
    setShowNext(false);
    setShowConfirm(false);
    setSubmitting(false);
    setDone(false);
  };

  const handleClose = () => {
    if (submitting) return;
    if (forced) return; // cannot dismiss a forced change
    reset();
    onClose();
  };

  const submit = () => {
    setError('');
    if (!current || !next || !confirm) {
      setError('Vui lòng điền đầy đủ các trường.');
      return;
    }
    if (next.length < MIN_LENGTH) {
      setError(`Mật khẩu mới phải có ít nhất ${MIN_LENGTH} ký tự.`);
      return;
    }
    if (next !== confirm) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }
    if (next === current) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }
    setSubmitting(true);
    const result = changePassword(current, next);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? 'Đổi mật khẩu thất bại.');
      return;
    }
    setDone(true);
    if (onSuccess) onSuccess();
    if (!forced) {
      // Auto-close shortly after success for non-forced flows
      setTimeout(() => { reset(); onClose(); }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-ink">Đổi mật khẩu</h3>
          </div>
          {!forced && (
            <button onClick={handleClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">
              ✕
            </button>
          )}
        </div>

        {forced && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-xs text-warning">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.</span>
          </div>
        )}

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 px-6">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm font-medium text-ink">Đổi mật khẩu thành công.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <PasswordInput
                label="Mật khẩu hiện tại"
                value={current}
                onChange={setCurrent}
                show={showCurrent}
                toggle={() => setShowCurrent((s) => !s)}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <PasswordInput
                label="Mật khẩu mới"
                value={next}
                onChange={setNext}
                show={showNext}
                toggle={() => setShowNext((s) => !s)}
                placeholder={`Ít nhất ${MIN_LENGTH} ký tự`}
              />
              <PasswordInput
                label="Xác nhận mật khẩu mới"
                value={confirm}
                onChange={setConfirm}
                show={showConfirm}
                toggle={() => setShowConfirm((s) => !s)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
              {!forced && (
                <Button variant="secondary" onClick={handleClose}>Hủy</Button>
              )}
              <Button onClick={submit} disabled={submitting}>
                <Save className="w-3.5 h-3.5" /> {submitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  toggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-info mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-line/50 bg-bg-main text-ink text-sm placeholder:text-line/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          placeholder={placeholder}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-line hover:text-info transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
