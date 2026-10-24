import { useState } from 'react';
import {
  useRoleTemplates,
  addRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate,
  PERMISSION_LABELS,
  MODULE_LABELS,
  SUBFEATURE_LABELS,
  HOTEL_ADMIN_PERMISSIONS,
  STAFF_PERMISSIONS,
  FULL_PERMISSIONS,
} from '@/store/authStore';
import type { RoleTemplate, FeaturePermissionMatrix, SubFeature, PermissionLevel, FeatureModule } from '@/types/auth';
import { MODULE_SUBFEATURES } from '@/types/auth';
import { Button, Badge, TextInput, Field, Select, Toggle } from '@/components/ui';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Save,
  ChevronDown,
  Lock,
  CheckCircle2,
} from 'lucide-react';

const PERMISSION_LEVELS: PermissionLevel[] = ['hidden', 'view', 'view_all', 'update', 'approve', 'delete'];
const HOTEL_MODULES: FeatureModule[] = ['hrm', 'frontdesk', 'housekeeping', 'inventory', 'sales', 'system'];
const ALL_SUBFEATURES: SubFeature[] = HOTEL_MODULES.flatMap((m) => MODULE_SUBFEATURES[m]);

const LEVEL_RANK: Record<PermissionLevel, number> = {
  hidden: 0,
  view: 1,
  view_all: 2,
  update: 3,
  approve: 4,
  delete: 5,
};

const LEVEL_BADGE_COLOR: Record<PermissionLevel, 'info' | 'primary' | 'success' | 'danger'> = {
  hidden: 'info',
  view: 'info',
  view_all: 'primary',
  update: 'primary',
  approve: 'success',
  delete: 'danger',
};

function blankRole(): RoleTemplate {
  const perms: FeaturePermissionMatrix = {};
  for (const sf of ALL_SUBFEATURES) perms[sf] = 'hidden';
  return { id: '', name: '', description: '', permissions: perms, is_builtin: false };
}

function isModuleEnabled(perms: FeaturePermissionMatrix, module: FeatureModule): boolean {
  return MODULE_SUBFEATURES[module].some((sf) => (perms[sf] ?? 'hidden') !== 'hidden');
}

function setModuleEnabled(
  perms: FeaturePermissionMatrix,
  module: FeatureModule,
  enabled: boolean,
): FeaturePermissionMatrix {
  const next = { ...perms };
  for (const sf of MODULE_SUBFEATURES[module]) {
    next[sf] = enabled ? 'view' : 'hidden';
  }
  return next;
}

function summarizePermissions(perms: FeaturePermissionMatrix): { total: number; visible: number } {
  let visible = 0;
  for (const sf of ALL_SUBFEATURES) {
    if ((perms[sf] ?? 'hidden') !== 'hidden') visible++;
  }
  return { total: ALL_SUBFEATURES.length, visible };
}

function RoleFormModal({
  editingRole,
  onSave,
  onClose,
}: {
  editingRole: RoleTemplate | null;
  onSave: (data: { role: Omit<RoleTemplate, 'id'> | RoleTemplate; isNew: boolean }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editingRole?.name ?? '');
  const [description, setDescription] = useState(editingRole?.description ?? '');
  const [permissions, setPermissions] = useState<FeaturePermissionMatrix>(() => {
    const base: FeaturePermissionMatrix = {};
    for (const sf of ALL_SUBFEATURES) {
      base[sf] = (editingRole?.permissions?.[sf] as PermissionLevel) ?? 'hidden';
    }
    return base;
  });
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const toggleModuleEnabled = (module: FeatureModule) => {
    setPermissions((prev) => setModuleEnabled(prev, module, !isModuleEnabled(prev, module)));
  };

  const updateSubFeature = (sf: SubFeature, level: PermissionLevel) => {
    setPermissions((prev) => ({ ...prev, [sf]: level }));
  };

  const toggleExpand = (key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const applyPreset = (preset: FeaturePermissionMatrix) => {
    const next: FeaturePermissionMatrix = {};
    for (const sf of ALL_SUBFEATURES) {
      next[sf] = (preset[sf] as PermissionLevel) ?? 'hidden';
    }
    setPermissions(next);
  };

  const submit = () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên vai trò.');
      return;
    }
    onSave({
      role: editingRole
        ? { ...editingRole, name: name.trim(), description: description.trim(), permissions }
        : { name: name.trim(), description: description.trim(), permissions, is_builtin: false },
      isNew: !editingRole,
    });
  };

  const isBuiltin = editingRole?.is_builtin === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-line/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/30">
          <h3 className="text-base font-semibold text-ink">
            {editingRole ? 'Sửa vai trò mẫu' : 'Thêm vai trò mẫu'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-info hover:bg-primary-soft/40 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">{error}</div>
          )}

          {isBuiltin && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-info/10 border border-info/20 text-xs text-info">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Vai trò mẫu mặc định — có thể chỉnh sửa quyền nhưng không đổi tên hoặc xóa.</span>
            </div>
          )}

          <Field label="Tên vai trò">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Quản lý Buồng phòng"
              disabled={isBuiltin}
              autoFocus
            />
          </Field>
          <Field label="Mô tả (tùy chọn)">
            <TextInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về vai trò này"
            />
          </Field>

          {/* Quick presets */}
          <div>
            <p className="text-xs font-medium text-info mb-2">Áp dụng mẫu nhanh</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => applyPreset(FULL_PERMISSIONS)}>
                Toàn quyền
              </Button>
              <Button variant="secondary" size="sm" onClick={() => applyPreset(HOTEL_ADMIN_PERMISSIONS)}>
                Quản lý khách sạn
              </Button>
              <Button variant="secondary" size="sm" onClick={() => applyPreset(STAFF_PERMISSIONS)}>
                Nhân viên
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => applyPreset(Object.fromEntries(ALL_SUBFEATURES.map((sf) => [sf, 'hidden'])) as FeaturePermissionMatrix)}
              >
                Xóa tất cả
              </Button>
            </div>
          </div>

          {/* Permission matrix */}
          <div>
            <p className="text-xs font-medium text-info mb-2">Phân quyền theo tính năng</p>
            <div className="space-y-1.5">
              {HOTEL_MODULES.map((mod) => {
                const enabled = isModuleEnabled(permissions, mod);
                const expandKey = mod;
                const isExpanded = expandedModules.has(expandKey);
                const subs = MODULE_SUBFEATURES[mod];
                return (
                  <div key={mod} className="rounded-lg border border-line/20 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-bg-main/70">
                      <div className="flex items-center gap-2 flex-1">
                        <Toggle checked={enabled} onChange={() => toggleModuleEnabled(mod)} />
                        <span className={`text-xs font-medium ${enabled ? 'text-ink' : 'text-line'}`}>
                          {MODULE_LABELS[mod]}
                        </span>
                      </div>
                      {enabled && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(expandKey)}
                          className="p-1 rounded text-info hover:bg-primary-soft/30 transition-colors"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    {enabled && isExpanded && (
                      <div className="px-3 py-2 space-y-1.5 bg-bg-main/30 border-t border-line/15">
                        {subs.map((sf) => (
                          <div key={sf} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-info">{SUBFEATURE_LABELS[sf]}</span>
                            <Select
                              value={permissions[sf] ?? 'hidden'}
                              onChange={(e) => updateSubFeature(sf, e.target.value as PermissionLevel)}
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
        </div>

        <div className="px-6 py-4 border-t border-line/30 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={submit}><Save className="w-3.5 h-3.5" /> Lưu</Button>
        </div>
      </div>
    </div>
  );
}

export default function RoleManagementPage() {
  const [roles] = useRoleTemplates();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RoleTemplate | null>(null);

  const handleSave = (data: { role: Omit<RoleTemplate, 'id'> | RoleTemplate; isNew: boolean }) => {
    if (data.isNew) {
      addRoleTemplate(data.role as Omit<RoleTemplate, 'id'>);
    } else {
      const role = data.role as RoleTemplate;
      updateRoleTemplate(role.id, {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteRoleTemplate(id);
  };

  const openEdit = (role: RoleTemplate) => {
    setEditing(role);
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(blankRole());
    setShowForm(true);
  };

  const getHighestLevel = (perms: FeaturePermissionMatrix): PermissionLevel => {
    let best: PermissionLevel = 'hidden';
    for (const sf of ALL_SUBFEATURES) {
      const lvl = perms[sf] ?? 'hidden';
      if (LEVEL_RANK[lvl] > LEVEL_RANK[best]) best = lvl;
    }
    return best;
  };

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>SYSTEM ADMIN</span>
          <span className="text-line">›</span>
          <span className="text-ink">Quản lý Vai trò</span>
        </nav>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink leading-tight">Quản lý Vai trò</h1>
              <p className="text-sm text-info mt-0.5">Tạo và quản lý vai trò mẫu để gán nhanh cho người dùng.</p>
            </div>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4" /> Thêm vai trò
          </Button>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const { total, visible } = summarizePermissions(role.permissions);
          const highest = getHighestLevel(role.permissions);
          return (
            <div key={role.id} className="bg-card rounded-xl border border-line/30 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink truncate">{role.name}</h3>
                    {role.is_builtin && (
                      <Badge color="primary">
                        <Lock className="w-2.5 h-2.5 mr-1" /> Mặc định
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-info mt-1 line-clamp-2">{role.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-info">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>{visible}/{total} tính năng được cấp quyền</span>
                <span className="ml-auto">
                  Cao nhất: <Badge color={LEVEL_BADGE_COLOR[highest]}>{PERMISSION_LABELS[highest]}</Badge>
                </span>
              </div>

              {/* Permission preview chips */}
              <div className="flex flex-wrap gap-1">
                {HOTEL_MODULES.map((mod) => {
                  const enabled = isModuleEnabled(role.permissions, mod);
                  if (!enabled) return null;
                  return (
                    <span
                      key={mod}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-soft/40 text-info border border-line/40"
                    >
                      {MODULE_LABELS[mod]}
                    </span>
                  );
                })}
                {visible === 0 && <span className="text-xs text-line">Chưa cấp quyền</span>}
              </div>

              <div className="flex items-center justify-end gap-1 mt-auto pt-2 border-t border-line/20">
                <button
                  onClick={() => openEdit(role)}
                  className="p-1.5 rounded text-info hover:bg-primary-soft/40 transition-colors"
                  title="Sửa vai trò"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {!role.is_builtin && (
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
                    title="Xóa vai trò"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {roles.length === 0 && (
        <div className="bg-card rounded-xl border border-line/30 py-12 text-center">
          <ShieldCheck className="w-10 h-10 text-line mx-auto mb-2" />
          <p className="text-sm text-info">Chưa có vai trò mẫu nào. Nhấn "Thêm vai trò" để bắt đầu.</p>
        </div>
      )}

      {showForm && editing && (
        <RoleFormModal
          editingRole={editing.id ? editing : null}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
