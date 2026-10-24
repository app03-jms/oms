import { useState, useMemo, useRef } from 'react';
import { useRouter } from '@/router/RouterContext';
import { useAuth } from '@/auth/AuthContext';
import {
  useUsers,
  useHotels,
  useMappings,
  useRoleTemplates,
  addUser,
  updateUser,
  deleteUser,
  adminResetPassword,
  setUserHotelMappings,
  getPermissionForSubFeature,
  HOTEL_ADMIN_PERMISSIONS,
  STAFF_PERMISSIONS,
  PERMISSION_LABELS,
  MODULE_LABELS,
  SUBFEATURE_LABELS,
} from '@/store/authStore';
import type { User, HotelRole, PermissionLevel, FeatureModule, SubFeature, FeaturePermissionMatrix, RoleTemplate } from '@/types/auth';
import { MODULE_SUBFEATURES } from '@/types/auth';
import { Button, Badge, TextInput, Select, Field, Toggle } from '@/components/ui';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Save,
  Shield,
  Building2,
  CheckCircle2,
  Lock,
  Download,
  Upload,
  FileDown,
  ChevronDown,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { exportToXlsx, downloadTemplate, parseXlsx, type SheetColumn } from '@/utils/xlsx';
import { generateUniqueId } from '@/utils/idGenerator';
import { useEmployees } from '@/hrm/store';

type ImportableUser = User & { role: HotelRole; hotel_id: string };

const USER_COLUMNS: SheetColumn<ImportableUser>[] = [
  { key: 'username', label: 'Tên đăng nhập' },
  { key: 'full_name', label: 'Họ tên' },
  { key: 'password', label: 'Mật khẩu' },
  { key: 'role', label: 'Vai trò' },
  { key: 'hotel_id', label: 'Khách sạn' },
];

const PERMISSION_LEVELS: PermissionLevel[] = ['hidden', 'view', 'view_all', 'update', 'approve', 'delete'];
const ALL_MODULES: FeatureModule[] = ['hrm', 'frontdesk', 'housekeeping', 'inventory', 'sales', 'system'];
// Operational modules only — 'system' is super-admin-exclusive and never exposed to hotel staff
const HOTEL_MODULES: FeatureModule[] = ['hrm', 'frontdesk', 'housekeeping', 'inventory', 'sales'];

const LEVEL_RANK: Record<PermissionLevel, number> = { hidden: 0, view: 1, view_all: 2, update: 3, approve: 4, delete: 5 };

/** All sub-features across all modules */
const ALL_SUBFEATURES: SubFeature[] = ALL_MODULES.flatMap((m) => MODULE_SUBFEATURES[m]);
const HOTEL_SUBFEATURES: SubFeature[] = HOTEL_MODULES.flatMap((m) => MODULE_SUBFEATURES[m]);

interface HotelAssignment {
  hotel_id: string;
  role: HotelRole;
  permissions: FeaturePermissionMatrix;
}

function defaultPermissionsForRole(role: HotelRole): FeaturePermissionMatrix {
  const base = role === 'hotel_admin' ? { ...HOTEL_ADMIN_PERMISSIONS } : { ...STAFF_PERMISSIONS };
  const out: FeaturePermissionMatrix = {};
  for (const sf of ALL_SUBFEATURES) {
    out[sf] = base[sf] ?? 'hidden';
  }
  return out;
}

/** Check if a parent module is "enabled" (at least one sub-feature is not hidden) */
function isModuleEnabled(perms: FeaturePermissionMatrix, module: FeatureModule): boolean {
  const subs = MODULE_SUBFEATURES[module];
  return subs.some((sf) => (perms[sf] ?? 'hidden') !== 'hidden');
}

/** Set all sub-features of a module to a given level (or hidden if disabling) */
function setModuleEnabled(perms: FeaturePermissionMatrix, module: FeatureModule, enabled: boolean, role: HotelRole): FeaturePermissionMatrix {
  const next = { ...perms };
  const subs = MODULE_SUBFEATURES[module];
  const template = role === 'hotel_admin' ? HOTEL_ADMIN_PERMISSIONS : STAFF_PERMISSIONS;
  for (const sf of subs) {
    next[sf] = enabled ? (template[sf] ?? 'view') : 'hidden';
  }
  return next;
}

function UserFormModal({
  editingUser,
  hotels,
  existingMappings,
  isSuperAdminActor,
  lockedHotelId,
  employees,
  roleTemplates,
  onSave,
  onClose,
}: {
  editingUser: User | null;
  hotels: { id: string; name: string; code: string }[];
  existingMappings: { hotel_id: string; role: HotelRole; permissions: Record<string, PermissionLevel> }[];
  isSuperAdminActor: boolean;
  lockedHotelId: string | null;
  employees: { id: string; employee_code: string; full_name: string; display_name: string }[];
  roleTemplates: RoleTemplate[];
  onSave: (data: { user: Omit<User, 'id'> | User; assignments: HotelAssignment[]; isNew: boolean }) => void;
  onClose: () => void;
}) {
  const [username, setUsername] = useState(editingUser?.username ?? '');
  const [password, setPassword] = useState(editingUser?.password ?? '');
  const [fullName, setFullName] = useState(editingUser?.full_name ?? '');
  const [employeeId, setEmployeeId] = useState(editingUser?.employee_id ?? '');
  const [isSuperAdmin, setIsSuperAdmin] = useState(editingUser?.is_super_admin ?? false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<HotelAssignment[]>(() => {
    if (existingMappings.length > 0) {
      return existingMappings.map((m) => ({
        hotel_id: m.hotel_id,
        role: m.role,
        permissions: ALL_SUBFEATURES.reduce((acc, sf) => {
          acc[sf] = (m.permissions[sf] as PermissionLevel) ?? 'hidden';
          return acc;
        }, {} as FeaturePermissionMatrix),
      }));
    }
    // Non-super-admin: pre-assign to locked hotel
    if (lockedHotelId) {
      return [{ hotel_id: lockedHotelId, role: 'staff' as HotelRole, permissions: defaultPermissionsForRole('staff') }];
    }
    return [];
  });
  const [error, setError] = useState('');
  const [appliedTemplateId, setAppliedTemplateId] = useState('');

  const applyRoleTemplate = (templateId: string) => {
    setAppliedTemplateId(templateId);
    if (!templateId) return;
    const tpl = roleTemplates.find((r) => r.id === templateId);
    if (!tpl) return;
    setAssignments((prev) =>
      prev.map((a) => ({
        ...a,
        permissions: ALL_SUBFEATURES.reduce((acc, sf) => {
          acc[sf] = (tpl.permissions[sf] as PermissionLevel) ?? 'hidden';
          return acc;
        }, {} as FeaturePermissionMatrix),
      }))
    );
  };

  const toggleHotel = (hotelId: string) => {
    const existing = assignments.find((a) => a.hotel_id === hotelId);
    if (existing) {
      setAssignments((prev) => prev.filter((a) => a.hotel_id !== hotelId));
    } else {
      setAssignments((prev) => [...prev, { hotel_id: hotelId, role: 'staff' as HotelRole, permissions: defaultPermissionsForRole('staff') }]);
    }
  };

  const updateRole = (hotelId: string, role: HotelRole) => {
    setAssignments((prev) =>
      prev.map((a) => (a.hotel_id === hotelId ? { ...a, role, permissions: defaultPermissionsForRole(role) } : a))
    );
  };

  const toggleModuleEnabled = (hotelId: string, module: FeatureModule) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.hotel_id !== hotelId) return a;
        const currentlyEnabled = isModuleEnabled(a.permissions, module);
        return { ...a, permissions: setModuleEnabled(a.permissions, module, !currentlyEnabled, a.role) };
      })
    );
  };

  const updateSubFeaturePermission = (hotelId: string, sf: SubFeature, level: PermissionLevel) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.hotel_id === hotelId ? { ...a, permissions: { ...a.permissions, [sf]: level } } : a
      )
    );
  };

  const toggleModuleExpanded = (key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = () => {
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (!isSuperAdmin && assignments.length === 0) {
      setError('Phân công ít nhất 1 khách sạn cho nhân viên.');
      return;
    }
    // Hard safety: non-super-admin can never set is_super_admin
    const finalIsSuper = isSuperAdminActor ? isSuperAdmin : false;
    const userData = {
      username: username.trim(),
      password: password.trim(),
      full_name: fullName.trim(),
      is_super_admin: finalIsSuper,
      employee_id: employeeId || undefined,
    };
    onSave({ user: editingUser ? { ...editingUser, ...userData } : userData, assignments: finalIsSuper ? [] : assignments, isNew: !editingUser });
  };

  // Available hotels: super admin sees all, hotel admin sees only their locked hotel
  const availableHotels = lockedHotelId ? hotels.filter((h) => h.id === lockedHotelId) : hotels;
  const modulesToShow = isSuperAdminActor ? ALL_MODULES : HOTEL_MODULES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <h3 className="text-base font-semibold text-ink">{editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tên đăng nhập">
              <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="VD: nvan" />
            </Field>
            <Field label="Mật khẩu">
              <TextInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
            </Field>
          </div>
          <Field label="Họ và tên">
            <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="VD: Nguyễn Văn An" />
          </Field>

          {/* Liên kết Mã NV */}
          <Field label="Liên kết Mã NV">
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">— Chưa liên kết —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  [{emp.employee_code}] — {emp.full_name || emp.display_name}
                </option>
              ))}
            </Select>
          </Field>

          {/* Super Admin toggle: only visible to super admins */}
          {isSuperAdminActor && (
            <div className="p-4 rounded-lg bg-primary-soft/20 border border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-ink">Super Admin</span>
                  <p className="text-xs text-info mt-0.5">Toàn quyền trên mọi khách sạn, không cần phân công</p>
                </div>
                <Toggle checked={isSuperAdmin} onChange={setIsSuperAdmin} />
              </div>
            </div>
          )}

          {/* Non-super-admin notice */}
          {!isSuperAdminActor && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-info/10 border border-info/20 text-xs text-info">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Bạn chỉ có thể tạo/sửa người dùng trong khách sạn hiện tại.</span>
            </div>
          )}

          {/* Role template quick-apply */}
          {!isSuperAdmin && assignments.length > 0 && roleTemplates.length > 0 && (
            <Field label="Áp dụng vai trò mẫu">
              <Select value={appliedTemplateId} onChange={(e) => applyRoleTemplate(e.target.value)}>
                <option value="">— Chọn vai trò mẫu —</option>
                {roleTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}{tpl.is_builtin ? ' (mặc định)' : ''}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-line mt-1">Áp dụng quyền của vai trò mẫu cho tất cả khách sạn đã phân công.</p>
            </Field>
          )}

          {!isSuperAdmin && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-ink">Phân công khách sạn & quyền</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableHotels.map((h) => {
                  const assigned = assignments.find((a) => a.hotel_id === h.id);
                  const isLocked = !!lockedHotelId;
                  return (
                    <button
                      key={h.id}
                      onClick={() => !isLocked && toggleHotel(h.id)}
                      disabled={isLocked}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                        assigned ? 'border-primary bg-primary/10' : 'border-line/30 bg-bg-main'
                      } ${isLocked ? 'cursor-not-allowed opacity-90' : 'hover:border-line'}`}
                    >
                      <Building2 className="w-4 h-4 text-info shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{(h.name || '').toUpperCase()}</p>
                        <p className="text-[10px] text-line font-mono">{h.code}</p>
                      </div>
                      {assigned && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      {isLocked && <Lock className="w-3 h-3 text-line shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {assignments.map((a) => {
                const hotel = hotels.find((h) => h.id === a.hotel_id);
                if (!hotel) return null;
                return (
                  <div key={a.hotel_id} className="rounded-lg border border-line/30 p-3 bg-bg-main/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{(hotel.name || '').toUpperCase()}</span>
                      <Select value={a.role} onChange={(e) => updateRole(a.hotel_id, e.target.value as HotelRole)} className="w-auto">
                        <option value="staff">Nhân viên</option>
                        <option value="hotel_admin">Quản lý khách sạn</option>
                      </Select>
                    </div>
                    {/* Parent module toggles with expandable sub-features */}
                    <div className="space-y-1.5">
                      {modulesToShow.map((mod) => {
                        const enabled = isModuleEnabled(a.permissions, mod);
                        const expandKey = `${a.hotel_id}:${mod}`;
                        const isExpanded = expandedModules.has(expandKey);
                        const subs = MODULE_SUBFEATURES[mod];
                        return (
                          <div key={mod} className="rounded-lg border border-line/20 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-bg-main/70">
                              <div className="flex items-center gap-2 flex-1">
                                <Toggle
                                  checked={enabled}
                                  onChange={() => toggleModuleEnabled(a.hotel_id, mod)}
                                />
                                <span className={`text-xs font-medium ${enabled ? 'text-ink' : 'text-line'}`}>
                                  {MODULE_LABELS[mod]}
                                </span>
                              </div>
                              {enabled && (
                                <button
                                  type="button"
                                  onClick={() => toggleModuleExpanded(expandKey)}
                                  className="p-1 rounded text-info hover:bg-primary-soft/30 transition-colors"
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>
                            {/* Expanded sub-feature rows */}
                            {enabled && isExpanded && (
                              <div className="px-3 py-2 space-y-1.5 bg-bg-main/30 border-t border-line/15">
                                {subs.map((sf) => (
                                  <div key={sf} className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-info">{SUBFEATURE_LABELS[sf]}</span>
                                    <Select
                                      value={a.permissions[sf] ?? 'hidden'}
                                      onChange={(e) => updateSubFeaturePermission(a.hotel_id, sf, e.target.value as PermissionLevel)}
                                      className="w-auto text-xs py-1"
                                    >
                                      {PERMISSION_LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>{PERMISSION_LABELS[lvl]}</option>
                                      ))}
                                    </Select>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={submit}><Save className="w-3.5 h-3.5" /> Lưu</Button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  targetUser,
  actor,
  onClose,
}: {
  targetUser: User;
  actor: { is_super_admin: boolean; activeHotelId: string | null };
  onClose: () => void;
}) {
  const DEFAULT_PASSWORD = '123456';
  const [newPassword, setNewPassword] = useState(DEFAULT_PASSWORD);
  const [requireForceChange, setRequireForceChange] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = () => {
    setError('');
    if (newPassword.trim().length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    adminResetPassword(targetUser.id, newPassword.trim(), requireForceChange, actor);
    setDone(true);
    setTimeout(onClose, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-ink">Đặt lại mật khẩu</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 px-6">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm font-medium text-ink">Đã đặt lại mật khẩu cho <span className="font-mono">{targetUser.username}</span>.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-primary-soft/20 border border-primary/10 px-3 py-2 text-xs text-info">
                <span>Tài khoản: <span className="font-mono font-medium text-ink">{targetUser.username}</span></span>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-info mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-20 py-2.5 rounded-lg border border-line/50 bg-bg-main text-ink text-sm placeholder:text-line/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setNewPassword(DEFAULT_PASSWORD)}
                      className="px-2 py-1 rounded text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      Mặc định
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="p-1 rounded text-line hover:text-info transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-bg-main/50 border border-line/20">
                <div>
                  <span className="text-sm font-medium text-ink">Bắt buộc đổi mật khẩu lúc đăng nhập</span>
                  <p className="text-xs text-line mt-0.5">Người dùng sẽ phải tự đổi mật khẩu ở lần đăng nhập tiếp theo.</p>
                </div>
                <Toggle checked={requireForceChange} onChange={setRequireForceChange} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>Hủy</Button>
              <Button onClick={submit}>
                <KeyRound className="w-3.5 h-3.5" /> Đặt lại
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { path } = useRouter();
  const { user: currentUser, session } = useAuth();
  const [users] = useUsers();
  const [hotels] = useHotels();
  const [mappings] = useMappings();
  const [hrmEmployees] = useEmployees();
  const [roleTemplates] = useRoleTemplates();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');

  const isSuperAdmin = currentUser?.is_super_admin === true;
  const activeHotelId = session?.activeHotelId ?? null;

  // Permission level for the system_users sub-feature
  const systemPermission: PermissionLevel = currentUser && activeHotelId
    ? (isSuperAdmin ? 'delete' : getPermissionForSubFeature(currentUser.id, activeHotelId, 'system_users'))
    : 'hidden';
  const canView = LEVEL_RANK[systemPermission] >= LEVEL_RANK.view;
  const canEdit = LEVEL_RANK[systemPermission] >= LEVEL_RANK.update;
  const canDelete = LEVEL_RANK[systemPermission] >= LEVEL_RANK.delete;

  // Parse hotelId from query string (e.g. /system/users?hotelId=htl_xxx)
  const filterHotelId = useMemo(() => {
    const qIndex = path.indexOf('?');
    if (qIndex < 0) return null;
    const queryStr = path.slice(qIndex + 1);
    const params = new URLSearchParams(queryStr);
    return params.get('hotelId');
  }, [path]);

  const filterHotelName = filterHotelId ? hotels.find((h) => h.id === filterHotelId)?.name ?? filterHotelId : null;

  const hotelName = (id: string) => hotels.find((h) => h.id === id)?.name ?? '—';
  const userHotels = (userId: string) => mappings.filter((m) => m.user_id === userId);
  const userMappings = (userId: string) => mappings.filter((m) => m.user_id === userId);

  const filtered = useMemo(() => {
    let result = users;

    // Non-super-admin: strict tenant isolation — only see users in their active hotel
    if (!isSuperAdmin && activeHotelId) {
      const userIdsForHotel = new Set(
        mappings.filter((m) => m.hotel_id === activeHotelId).map((m) => m.user_id)
      );
      result = result.filter((u) => userIdsForHotel.has(u.id));
    } else if (filterHotelId) {
      // Super admin with query param filter
      const userIdsForHotel = new Set(
        mappings.filter((m) => m.hotel_id === filterHotelId).map((m) => m.user_id)
      );
      result = result.filter((u) => u.is_super_admin || userIdsForHotel.has(u.id));
    }

    if (search.trim()) {
      const q = (search || '').toLowerCase();
      result = result.filter((u) =>
        (u?.username || '').toLowerCase().includes(q) ||
        (u?.full_name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, mappings, search, filterHotelId, isSuperAdmin, activeHotelId]);

  const blankUser = (): User => ({
    id: '',
    username: '',
    password: '',
    full_name: '',
    is_super_admin: false,
    employee_id: undefined,
  });

  const actor = {
    is_super_admin: isSuperAdmin,
    activeHotelId,
  };

  const handleSave = (data: { user: Omit<User, 'id'> | User; assignments: HotelAssignment[]; isNew: boolean }) => {
    if (data.isNew) {
      const created = addUser(data.user as Omit<User, 'id'>, actor);
      if (data.assignments.length > 0) {
        setUserHotelMappings(created.id, data.assignments, actor);
      }
    } else {
      const user = data.user as User;
      updateUser(user.id, { username: user.username, password: user.password, full_name: user.full_name, is_super_admin: user.is_super_admin, employee_id: user.employee_id }, actor);
      setUserHotelMappings(user.id, data.assignments, actor);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteUser(id, actor);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate<ImportableUser>(
      USER_COLUMNS,
      'Mau_nguoi_dung',
      { username: 'nvan', full_name: 'Nguyễn Văn An', password: '123', role: 'staff', hotel_id: 'JGH' },
    );
  };

  const handleExport = () => {
    const hotelNameById = (id: string) => hotels.find((h) => h.id === id)?.code ?? id;
    const rows: ImportableUser[] = users.map((u) => {
      const map = mappings.find((m) => m.user_id === u.id);
      return {
        ...u,
        role: map?.role ?? 'staff',
        hotel_id: map ? hotelNameById(map.hotel_id) : '',
      };
    });
    exportToXlsx<ImportableUser>(rows, USER_COLUMNS, 'Danh_sach_nguoi_dung');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseXlsx<ImportableUser>(file, USER_COLUMNS);
      let count = 0;
      for (const row of parsed) {
        const username = String(row.username || '').trim();
        const fullName = String(row.full_name || '').trim();
        const password = String(row.password || '').trim();
        if (!username || !fullName || !password) continue;
        const roleStr = String(row.role || '').trim().toLowerCase();
        const role: HotelRole = roleStr.includes('admin') ? 'hotel_admin' : 'staff';
        let targetHotelId = activeHotelId ?? '';
        const rawHotel = String(row.hotel_id || '').trim();
        if (rawHotel) {
          const byId = hotels.find((h) => h.id === rawHotel);
          const byCode = hotels.find((h) => h.code.toLowerCase() === rawHotel.toLowerCase());
          const byName = hotels.find((h) => h.name.toLowerCase() === rawHotel.toLowerCase());
          if (byId) targetHotelId = byId.id;
          else if (byCode) targetHotelId = byCode.id;
          else if (byName) targetHotelId = byName.id;
        }
        if (!targetHotelId) continue;
        const perms = role === 'hotel_admin' ? HOTEL_ADMIN_PERMISSIONS : STAFF_PERMISSIONS;
        const created = addUser({ username, password, full_name: fullName, is_super_admin: false }, actor);
        setUserHotelMappings(created.id, [{ hotel_id: targetHotelId, role, permissions: perms }], actor);
        count++;
      }
      setImportMsg(`Đã nhập ${count} người dùng.`);
    } catch {
      setImportMsg('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Hotels available for the modal: super admin sees all, hotel admin locked to their hotel
  const modalHotels = isSuperAdmin ? hotels : (activeHotelId ? hotels.filter((h) => h.id === activeHotelId) : []);
  const lockedHotelId = isSuperAdmin ? null : activeHotelId;

  return (
    <div className="px-8 pt-6 pb-8">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>SYSTEM ADMIN</span>
          <span className="text-line">›</span>
          <span className="text-ink">Quản lý Người dùng</span>
          {filterHotelName && (
            <>
              <span className="text-line">›</span>
              <span className="text-primary">{(filterHotelName || '').toUpperCase()}</span>
            </>
          )}
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">Quản lý Người dùng</h1>
              <p className="text-sm text-info mt-0.5">Tạo tài khoản, phân quyền và gán khách sạn cho người dùng.</p>
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => { setEditing(blankUser()); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> Thêm người dùng
            </Button>
          )}
        </div>
        {canEdit && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
              <FileDown className="w-3.5 h-3.5" /> Tải File Mẫu
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" /> Xuất Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleImportClick}>
              <Upload className="w-3.5 h-3.5" /> Nhập Excel
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" />
          </div>
        )}
        {importMsg && (
          <p className="mt-2 text-xs text-info">{importMsg}</p>
        )}
      </div>

      <div className="bg-card rounded-xl border border-line/30 p-4 mb-4">
        <div className="relative flex-1 max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-line" />
          <TextInput className="pl-10" placeholder="Tìm theo tên, username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-line/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/30 text-info text-xs bg-bg-main/50">
                <th className="text-left py-3 px-4 font-medium">Tên đăng nhập</th>
                <th className="text-left py-3 px-4 font-medium">Họ tên</th>
                <th className="text-left py-3 px-4 font-medium">Mã NV</th>
                <th className="text-left py-3 px-4 font-medium">Vai trò</th>
                <th className="text-left py-3 px-4 font-medium">Khách sạn</th>
                {canEdit && <th className="text-right py-3 px-4 font-medium">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-12 text-center">
                    <Users className="w-10 h-10 text-line mx-auto mb-2" />
                    <p className="text-sm text-info">Không có người dùng nào</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const uHotels = userHotels(u.id);
                  const isSuper = u.is_super_admin;
                  return (
                    <tr key={u.id} className="border-b border-line/20 hover:bg-bg-main/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-medium text-ink">{u.username}</span>
                      </td>
                      <td className="py-3 px-4"><span className="font-medium text-ink">{(u.full_name || '—').toUpperCase()}</span></td>
                      <td className="py-3 px-4">
                        {u.employee_id
                          ? <span className="font-mono text-xs font-medium text-ink">{hrmEmployees.find((e) => e.id === u.employee_id)?.employee_code ?? '—'}</span>
                          : <span className="text-xs text-line">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        {isSuper ? (
                          <Badge color="primary">Super Admin</Badge>
                        ) : (
                          <Badge color="info">Người dùng</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isSuper ? (
                          <span className="text-xs text-primary font-medium">Tất cả khách sạn</span>
                        ) : uHotels.length === 0 ? (
                          <span className="text-xs text-line">Chưa phân công</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {uHotels.map((h) => (
                              <Badge key={h.id} color="info">{(hotelName(h.hotel_id) || '').toUpperCase()}</Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditing(u); setShowForm(true); }} className="p-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors" title="Sửa">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setResetTarget(u)} className="p-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors" title="Đặt lại mật khẩu">
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors" title="Xóa">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && editing && (
        <UserFormModal
          editingUser={editing.id ? editing : null}
          hotels={modalHotels}
          existingMappings={editing.id ? userMappings(editing.id) : []}
          isSuperAdminActor={isSuperAdmin}
          lockedHotelId={lockedHotelId}
          employees={hrmEmployees}
          roleTemplates={roleTemplates}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          targetUser={resetTarget}
          actor={actor}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
