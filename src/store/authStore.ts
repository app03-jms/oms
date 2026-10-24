import { useSyncExternalStore } from 'react';
import type { User, UserHotelAccess, Hotel, FeaturePermissionMatrix, SubFeature, HotelRole, PermissionLevel, FeatureModule, RoleTemplate } from '@/types/auth';
import { MODULE_SUBFEATURES } from '@/types/auth';
import { ID } from '@/utils/idGenerator';

// ── Storage keys ──────────────────────────────────────────────
const K_USERS = 'oms_auth_users';
const K_HOTELS = 'oms_auth_hotels';
const K_MAPPINGS = 'oms_auth_user_hotel_mappings';
const K_ROLES = 'oms_auth_role_templates';
const K_ACTIVE_HOTEL = 'oms_active_hotel_id';

// ── Permission presets ────────────────────────────────────────
export const FULL_PERMISSIONS: FeaturePermissionMatrix = {
  hrm_profiles: 'delete',
  hrm_schedules: 'delete',
  hrm_attendance: 'delete',
  hrm_timesheet: 'delete',
  hrm_closures: 'delete',
  hrm_config: 'delete',
  frontdesk_departure: 'delete',
  frontdesk_rooms: 'delete',
  frontdesk_config: 'delete',
  housekeeping_tasks: 'delete',
  housekeeping_config: 'delete',
  inventory_stock: 'delete',
  inventory_config: 'delete',
  sales_minirms: 'delete',
  sales_rates: 'delete',
  sales_config: 'delete',
  system_users: 'delete',
  system_hotel_config: 'delete',
};

export const STAFF_PERMISSIONS: FeaturePermissionMatrix = {
  hrm_profiles: 'view',
  hrm_schedules: 'view',
  hrm_attendance: 'view',
  hrm_timesheet: 'view',
  hrm_closures: 'hidden',
  hrm_config: 'hidden',
  frontdesk_departure: 'update',
  frontdesk_rooms: 'update',
  frontdesk_config: 'hidden',
  housekeeping_tasks: 'update',
  housekeeping_config: 'hidden',
  inventory_stock: 'view',
  inventory_config: 'hidden',
  sales_minirms: 'hidden',
  sales_rates: 'hidden',
  sales_config: 'hidden',
  system_users: 'hidden',
  system_hotel_config: 'hidden',
};

export const HOTEL_ADMIN_PERMISSIONS: FeaturePermissionMatrix = {
  hrm_profiles: 'delete',
  hrm_schedules: 'delete',
  hrm_attendance: 'approve',
  hrm_timesheet: 'view_all',
  hrm_closures: 'approve',
  hrm_config: 'update',
  frontdesk_departure: 'approve',
  frontdesk_rooms: 'approve',
  frontdesk_config: 'update',
  housekeeping_tasks: 'approve',
  housekeeping_config: 'update',
  inventory_stock: 'approve',
  inventory_config: 'update',
  sales_minirms: 'approve',
  sales_rates: 'approve',
  sales_config: 'update',
  system_users: 'update',
  system_hotel_config: 'view',
};

// ── Seed role templates ───────────────────────────────────────
const SEED_ROLE_HOTEL_ADMIN: RoleTemplate = {
  id: 'role_seedadm',
  name: 'Quản lý Khách sạn',
  description: 'Toàn quyền vận hành các module khách sạn (duyệt, cập nhật, xem tất cả).',
  permissions: HOTEL_ADMIN_PERMISSIONS,
  is_builtin: true,
};

const SEED_ROLE_STAFF: RoleTemplate = {
  id: 'role_seedstf',
  name: 'Nhân viên',
  description: 'Quyền cơ bản: xem hồ sơ, cập nhật tác vụ vận hành.',
  permissions: STAFF_PERMISSIONS,
  is_builtin: true,
};

const SEED_ROLE_FULL: RoleTemplate = {
  id: 'role_seedfull',
  name: 'Toàn quyền',
  description: 'Tất cả sub-feature ở mức Xóa (dành cho Super Admin / vận hành).',
  permissions: FULL_PERMISSIONS,
  is_builtin: true,
};

const SEED_ROLES: RoleTemplate[] = [SEED_ROLE_FULL, SEED_ROLE_HOTEL_ADMIN, SEED_ROLE_STAFF];

// ── Seed data ─────────────────────────────────────────────────
const SEED_HOTEL_1: Hotel = {
  id: 'htl_seed001',
  name: 'Jenius Grand Hotel',
  code: 'JGH',
  address: '123 Nguyễn Huệ, Q.1, TP. HCM',
  logo_url: null,
  enabled_modules: ['hrm', 'frontdesk', 'housekeeping', 'inventory'],
};

const SEED_HOTEL_2: Hotel = {
  id: 'htl_seed002',
  name: 'Jenius Beach Resort',
  code: 'JBR',
  address: '456 Võ Nguyên Giáp, Đà Nẵng',
  logo_url: null,
  enabled_modules: ['hrm', 'frontdesk', 'housekeeping'],
};

const SEED_SUPER_ADMIN: User = {
  id: 'usr_seedadm',
  username: 'admin',
  password: '123',
  full_name: 'System Administrator',
  is_super_admin: true,
};

const SEED_HOTEL_ADMIN: User = {
  id: 'usr_seedhad',
  username: 'manager',
  password: '123',
  full_name: 'Hotel Manager',
  is_super_admin: false,
};

const SEED_STAFF: User = {
  id: 'usr_seedstf',
  username: 'staff',
  password: '123',
  full_name: 'Nhân viên Lễ tân',
  is_super_admin: false,
  employee_id: 'e1',
};

const SEED_MAPPINGS: UserHotelAccess[] = [
  {
    id: 'map_seed01',
    user_id: 'usr_seedadm',
    hotel_id: 'htl_seed001',
    role: 'hotel_admin',
    permissions: FULL_PERMISSIONS,
  },
  {
    id: 'map_seed02',
    user_id: 'usr_seedadm',
    hotel_id: 'htl_seed002',
    role: 'hotel_admin',
    permissions: FULL_PERMISSIONS,
  },
  {
    id: 'map_seed03',
    user_id: 'usr_seedhad',
    hotel_id: 'htl_seed001',
    role: 'hotel_admin',
    permissions: HOTEL_ADMIN_PERMISSIONS,
  },
  {
    id: 'map_seed04',
    user_id: 'usr_seedstf',
    hotel_id: 'htl_seed001',
    role: 'staff',
    permissions: STAFF_PERMISSIONS,
  },
];

// ── localStorage helpers ──────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (!Array.isArray(fallback) && (typeof parsed !== 'object' || parsed === null)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Reactive store ────────────────────────────────────────────
class SimpleStore<T> {
  private key: string;
  private value: T;
  private listeners = new Set<() => void>();

  constructor(key: string, initial: T) {
    this.key = key;
    this.value = load(key, initial);
    try { if (localStorage.getItem(key) === null) save(key, this.value); } catch { /* ignore */ }
  }

  get = (): T => this.value;
  getSnapshot = (): T => this.value;

  set(updater: T | ((prev: T) => T)): void {
    this.value = typeof updater === 'function'
      ? (updater as (prev: T) => T)(this.value)
      : updater;
    save(this.key, this.value);
    this.listeners.forEach((l) => l());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

// ── Store instances ──────────────────────────────────────────
const usersStore = new SimpleStore<User[]>(K_USERS, [SEED_SUPER_ADMIN, SEED_HOTEL_ADMIN, SEED_STAFF]);
const hotelsStore = new SimpleStore<Hotel[]>(K_HOTELS, [SEED_HOTEL_1, SEED_HOTEL_2]);
const mappingsStore = new SimpleStore<UserHotelAccess[]>(K_MAPPINGS, SEED_MAPPINGS);
const rolesStore = new SimpleStore<RoleTemplate[]>(K_ROLES, SEED_ROLES);

// ── Hooks ─────────────────────────────────────────────────────
export function useUsers(): [User[], (updater: (prev: User[]) => User[]) => void] {
  const value = useSyncExternalStore(usersStore.subscribe, usersStore.getSnapshot);
  const update = (updater: (prev: User[]) => User[]) => usersStore.set(updater);
  return [value, update];
}

export function useHotels(): [Hotel[], (updater: (prev: Hotel[]) => Hotel[]) => void] {
  const value = useSyncExternalStore(hotelsStore.subscribe, hotelsStore.getSnapshot);
  const update = (updater: (prev: Hotel[]) => Hotel[]) => hotelsStore.set(updater);
  return [value, update];
}

export function useMappings(): [UserHotelAccess[], (updater: (prev: UserHotelAccess[]) => UserHotelAccess[]) => void] {
  const value = useSyncExternalStore(mappingsStore.subscribe, mappingsStore.getSnapshot);
  const update = (updater: (prev: UserHotelAccess[]) => UserHotelAccess[]) => mappingsStore.set(updater);
  return [value, update];
}

export function useRoleTemplates(): [RoleTemplate[], (updater: (prev: RoleTemplate[]) => RoleTemplate[]) => void] {
  const value = useSyncExternalStore(rolesStore.subscribe, rolesStore.getSnapshot);
  const update = (updater: (prev: RoleTemplate[]) => RoleTemplate[]) => rolesStore.set(updater);
  return [value, update];
}

// ── Non-reactive getters (for login flow) ─────────────────────
export function getUsers(): User[] {
  return usersStore.get();
}

export function getHotels(): Hotel[] {
  return hotelsStore.get();
}

export function getMappings(): UserHotelAccess[] {
  return mappingsStore.get();
}

export function getRoleTemplates(): RoleTemplate[] {
  return rolesStore.get();
}

export function getRoleTemplateById(roleId: string): RoleTemplate | undefined {
  return rolesStore.get().find((r) => r.id === roleId);
}

export function getUserHotelAccess(userId: string): UserHotelAccess[] {
  return mappingsStore.get().filter((m) => m.user_id === userId);
}

export function getHotelById(hotelId: string): Hotel | undefined {
  return hotelsStore.get().find((h) => h.id === hotelId);
}

// ── Active hotel persistence ──────────────────────────────────
export function getActiveHotelId(): string | null {
  try { return localStorage.getItem(K_ACTIVE_HOTEL); } catch { return null; }
}

export function setActiveHotelId(hotelId: string | null): void {
  try {
    if (hotelId) localStorage.setItem(K_ACTIVE_HOTEL, hotelId);
    else localStorage.removeItem(K_ACTIVE_HOTEL);
  } catch { /* ignore */ }
}

// ── Actor context for guarded mutations ───────────────────────
export interface ActorContext {
  is_super_admin: boolean;
  activeHotelId: string | null;
}

function userBelongsToHotel(userId: string, hotelId: string): boolean {
  return mappingsStore.get().some((m) => m.user_id === userId && m.hotel_id === hotelId);
}

// ── CRUD actions (guarded) ──────────────────────────────────────
export function addUser(data: Omit<User, 'id'>, actor?: ActorContext): User {
  const safeData = actor && !actor.is_super_admin
    ? { ...data, is_super_admin: false }
    : data;
  const user: User = { ...safeData, id: ID.user() };
  usersStore.set((prev) => [...prev, user]);
  return user;
}

export function updateUser(id: string, patch: Partial<User>, actor?: ActorContext): void {
  if (actor && !actor.is_super_admin) {
    if (actor.activeHotelId && !userBelongsToHotel(id, actor.activeHotelId)) return;
    const { is_super_admin: _ignored, ...safePatch } = patch;
    usersStore.set((prev) => prev.map((u) => (u.id === id ? { ...u, ...safePatch, is_super_admin: u.is_super_admin } : u)));
    return;
  }
  usersStore.set((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
}

export function deleteUser(id: string, actor?: ActorContext): void {
  if (actor && !actor.is_super_admin) {
    if (actor.activeHotelId && !userBelongsToHotel(id, actor.activeHotelId)) return;
  }
  usersStore.set((prev) => prev.filter((u) => u.id !== id));
  mappingsStore.set((prev) => prev.filter((m) => m.user_id !== id));
}

export function addHotel(data: Omit<Hotel, 'id'>): Hotel {
  const hotel: Hotel = { ...data, id: ID.hotel() };
  hotelsStore.set((prev) => [...prev, hotel]);
  return hotel;
}

export function updateHotel(id: string, patch: Partial<Hotel>): void {
  hotelsStore.set((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
}

export function deleteUserHotelMapping(id: string): void {
  mappingsStore.set((prev) => prev.filter((m) => m.id !== id));
}

// ── Role Template CRUD ──────────────────────────────────────────
export function addRoleTemplate(data: Omit<RoleTemplate, 'id'>): RoleTemplate {
  const role: RoleTemplate = { ...data, id: ID.role() };
  rolesStore.set((prev) => [...prev, role]);
  return role;
}

export function updateRoleTemplate(id: string, patch: Partial<Omit<RoleTemplate, 'id'>>): void {
  rolesStore.set((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function deleteRoleTemplate(id: string): void {
  // Built-in templates cannot be deleted
  const role = rolesStore.get().find((r) => r.id === id);
  if (!role || role.is_builtin) return;
  rolesStore.set((prev) => prev.filter((r) => r.id !== id));
}

export function setUserHotelMappings(userId: string, assignments: { hotel_id: string; role: HotelRole; permissions: FeaturePermissionMatrix }[], actor?: ActorContext): void {
  const safeAssignments = actor && !actor.is_super_admin && actor.activeHotelId
    ? assignments.filter((a) => a.hotel_id === actor.activeHotelId)
    : assignments;
  mappingsStore.set((prev) => {
    const filtered = actor && !actor.is_super_admin && actor.activeHotelId
      ? prev.filter((m) => !(m.user_id === userId && m.hotel_id === actor.activeHotelId))
      : prev.filter((m) => m.user_id !== userId);
    const newMappings: UserHotelAccess[] = safeAssignments.map((a) => ({
      id: ID.mapping(),
      user_id: userId,
      hotel_id: a.hotel_id,
      role: a.role,
      permissions: a.permissions,
    }));
    return [...filtered, ...newMappings];
  });
}

export function getPermissionForSubFeature(
  userId: string,
  hotelId: string,
  subFeature: SubFeature,
): PermissionLevel {
  const mapping = mappingsStore.get().find((m) => m.user_id === userId && m.hotel_id === hotelId);
  if (!mapping) return 'hidden';
  return mapping.permissions[subFeature] ?? 'hidden';
}

/** Returns the highest permission level across all sub-features of a module */
export function getPermissionForModule(
  userId: string,
  hotelId: string,
  module: FeatureModule,
): PermissionLevel {
  const mapping = mappingsStore.get().find((m) => m.user_id === userId && m.hotel_id === hotelId);
  if (!mapping) return 'hidden';
  const subs = MODULE_SUBFEATURES[module] ?? [];
  let best: PermissionLevel = 'hidden';
  const rank: Record<PermissionLevel, number> = { hidden: 0, view: 1, view_all: 2, update: 3, approve: 4, delete: 5 };
  for (const sf of subs) {
    const lvl = mapping.permissions[sf] ?? 'hidden';
    if (rank[lvl] > rank[best]) best = lvl;
  }
  return best;
}

// ── Permission level labels ───────────────────────────────────
export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  hidden: 'Không hiển thị',
  view: 'Xem cá nhân',
  view_all: 'Xem tất cả (Giám sát)',
  update: 'Cập nhật',
  approve: 'Duyệt',
  delete: 'Xóa',
};

export const MODULE_LABELS: Record<FeatureModule, string> = {
  hrm: 'Nhân sự',
  frontdesk: 'Lễ tân',
  housekeeping: 'Buồng phòng',
  inventory: 'Kho',
  sales: 'Sales & RMS',
  system: 'Hệ thống',
};

export const SUBFEATURE_LABELS: Record<SubFeature, string> = {
  hrm_profiles: 'Hồ sơ nhân viên',
  hrm_schedules: 'Lịch làm việc',
  hrm_attendance: 'Chấm công',
  hrm_timesheet: 'Bảng chấm công',
  hrm_closures: 'Chốt công',
  hrm_config: 'Cấu hình HRM',
  frontdesk_departure: 'Departure',
  frontdesk_rooms: 'Tình trạng phòng',
  frontdesk_config: 'Cấu hình Lễ tân',
  housekeeping_tasks: 'Nhiệm vụ buồng phòng',
  housekeeping_config: 'Cấu hình Buồng phòng',
  inventory_stock: 'Tồn kho',
  inventory_config: 'Cấu hình Kho',
  sales_minirms: 'MiniRMS',
  sales_rates: 'Bảng giá',
  sales_config: 'Cấu hình Sales',
  system_users: 'Người dùng',
  system_hotel_config: 'Cấu hình khách sạn',
};
