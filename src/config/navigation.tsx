import {
  Users,
  Clock,
  CalendarCheck,
  FileCheck,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Settings,
  LogOut,
  NotebookPen,
  Wrench,
  FileSignature,
  SlidersHorizontal,
  Brush,
  BedDouble,
  PackageCheck,
  ClipboardList,
  Warehouse,
  Boxes,
  TrendingUp,
  ShoppingCart,
  Sliders,
  ShieldCheck,
  Hotel,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import type { SubFeature } from '@/types/auth';

export interface NavChildItem {
  label: string;
  path: string;
  icon: LucideIcon;
  subFeature: SubFeature;
}

export interface NavConfigItem {
  module: string;
  label: string;
  icon: LucideIcon;
  children: NavChildItem[];
}

export const NAVIGATION: NavConfigItem[] = [
  {
    module: 'hrm',
    label: 'HRM',
    icon: Users,
    children: [
      { label: 'Hồ sơ nhân viên', path: '/hrm/employees', icon: Users, subFeature: 'hrm_profiles' },
      { label: 'Chấm công', path: '/hrm/attendance', icon: Clock, subFeature: 'hrm_attendance' },
      { label: 'Bảng chấm công', path: '/hrm/timesheet', icon: CalendarCheck, subFeature: 'hrm_timesheet' },
      { label: 'Duyệt điều chỉnh', path: '/hrm/approvals', icon: FileCheck, subFeature: 'hrm_attendance' },
      { label: 'Lịch làm việc', path: '/hrm/schedule', icon: CalendarDays, subFeature: 'hrm_schedules' },
      { label: 'Sổ phép', path: '/hrm/leave', icon: BookOpen, subFeature: 'hrm_schedules' },
      { label: 'Chốt công', path: '/hrm/payroll', icon: ClipboardCheck, subFeature: 'hrm_closures' },
      { label: 'Cấu hình HRM', path: '/hrm/config', icon: Settings, subFeature: 'hrm_config' },
    ],
  },
  {
    module: 'frontdesk',
    label: 'FRONT DESK',
    icon: LogOut,
    children: [
      { label: 'Departure Record', path: '/frontdesk/departure', icon: LogOut, subFeature: 'frontdesk_departure' },
      { label: 'Logbook', path: '/frontdesk/logbook', icon: NotebookPen, subFeature: 'frontdesk_departure' },
      { label: 'Báo cáo Kỹ thuật', path: '/frontdesk/technical', icon: Wrench, subFeature: 'frontdesk_departure' },
      { label: 'Phê duyệt', path: '/frontdesk/approvals', icon: FileSignature, subFeature: 'frontdesk_departure' },
      { label: 'Cấu hình Lễ tân', path: '/frontdesk/config', icon: SlidersHorizontal, subFeature: 'frontdesk_config' },
    ],
  },
  {
    module: 'housekeeping',
    label: 'HOUSEKEEPING',
    icon: Brush,
    children: [
      { label: 'Worksheet', path: '/housekeeping/worksheet', icon: ClipboardList, subFeature: 'housekeeping_tasks' },
      { label: 'Tình trạng phòng', path: '/housekeeping/room-status', icon: BedDouble, subFeature: 'frontdesk_rooms' },
      { label: 'Giao nhận đồ vải', path: '/housekeeping/linen-transfer', icon: PackageCheck, subFeature: 'housekeeping_tasks' },
      { label: 'Bảng kê đồ vải', path: '/housekeeping/linen-list', icon: ClipboardList, subFeature: 'housekeeping_tasks' },
      { label: 'Cấu hình Buồng phòng', path: '/housekeeping/config', icon: SlidersHorizontal, subFeature: 'housekeeping_config' },
    ],
  },
  {
    module: 'inventory',
    label: 'INVENTORY',
    icon: Warehouse,
    children: [
      { label: 'Kho Lễ tân', path: '/inventory/frontdesk', icon: Warehouse, subFeature: 'inventory_stock' },
      { label: 'Kho Buồng phòng', path: '/inventory/housekeeping', icon: Boxes, subFeature: 'inventory_stock' },
      { label: 'Báo cáo X-N-T', path: '/inventory/report', icon: TrendingUp, subFeature: 'inventory_stock' },
      { label: 'Đề nghị mua hàng', path: '/inventory/purchase', icon: ShoppingCart, subFeature: 'inventory_stock' },
      { label: 'Cấu hình Kho', path: '/inventory/config', icon: SlidersHorizontal, subFeature: 'inventory_config' },
    ],
  },
  {
    module: 'sales',
    label: 'SALES & RMS',
    icon: TrendingUp,
    children: [
      { label: 'MiniRMS', path: '/sales/minirms', icon: TrendingUp, subFeature: 'sales_minirms' },
      { label: 'Bảng giá phòng', path: '/sales/rates', icon: Sliders, subFeature: 'sales_rates' },
      { label: 'Cấu hình RMS', path: '/sales/config', icon: Settings, subFeature: 'sales_config' },
    ],
  },
  {
    module: 'system',
    label: 'SYSTEM ADMIN',
    icon: ShieldCheck,
    children: [
      { label: 'Quản lý Người dùng', path: '/system/users', icon: Users, subFeature: 'system_users' },
      { label: 'Quản lý Vai trò', path: '/system/roles', icon: UserCog, subFeature: 'system_users' },
      { label: 'Cấu hình Khách sạn', path: '/system/hotel-config', icon: Hotel, subFeature: 'system_hotel_config' },
    ],
  },
];

export function findNavByPath(path: string): { module: string; moduleLabel: string; childLabel: string } | null {
  for (const nav of NAVIGATION) {
    for (const child of nav.children) {
      if (path === child.path || path.startsWith(child.path + '/')) {
        return {
          module: nav.module,
          moduleLabel: nav.label,
          childLabel: child.label,
        };
      }
    }
  }
  return null;
}
