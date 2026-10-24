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

export interface RouteConfig {
  path: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description?: string;
  tabs?: { key: string; label: string }[];
}

export const ROUTES: Record<string, RouteConfig> = {
  // HRM
  '/hrm/employees': {
    path: '/hrm/employees',
    icon: Users,
    title: 'Hồ sơ nhân viên',
    subtitle: 'Quản lý thông tin và hồ sơ của nhân viên khách sạn.',
    tabs: [
      { key: 'all', label: 'Tất cả' },
      { key: 'active', label: 'Đang làm việc' },
      { key: 'inactive', label: 'Đã nghỉ việc' },
    ],
  },
  '/hrm/attendance': {
    path: '/hrm/attendance',
    icon: Clock,
    title: 'Chấm công',
    subtitle: 'Ghi nhận thời gian vào/ra của nhân viên theo ca.',
  },
  '/hrm/timesheet': {
    path: '/hrm/timesheet',
    icon: CalendarCheck,
    title: 'Bảng chấm công',
    subtitle: 'Tổng hợp dữ liệu chấm công theo ngày và tháng.',
  },
  '/hrm/approvals': {
    path: '/hrm/approvals',
    icon: FileCheck,
    title: 'Duyệt điều chỉnh',
    subtitle: 'Xét duyệt các yêu cầu điều chỉnh chấm công từ nhân viên.',
  },
  '/hrm/schedule': {
    path: '/hrm/schedule',
    icon: CalendarDays,
    title: 'Lịch làm việc',
    subtitle: 'Lập và quản lý lịch làm việc theo ca cho từng phòng ban.',
    tabs: [
      { key: 'week', label: 'Tuần này' },
      { key: 'month', label: 'Tháng này' },
      { key: 'draft', label: 'Bản nháp' },
    ],
  },
  '/hrm/leave': {
    path: '/hrm/leave',
    icon: BookOpen,
    title: 'Sổ phép',
    subtitle: 'Theo dõi ngày phép còn lại và lịch sử nghỉ phép.',
  },
  '/hrm/payroll': {
    path: '/hrm/payroll',
    icon: ClipboardCheck,
    title: 'Chốt công',
    subtitle: 'Khóa và tổng hợp công cuối kỳ cho từng nhân viên.',
  },
  '/hrm/config': {
    path: '/hrm/config',
    icon: Settings,
    title: 'Cấu hình HRM',
    subtitle: 'Thiết lập ca làm việc, phòng ban và quy tắc chấm công.',
  },

  // FRONT DESK
  '/frontdesk/departure': {
    path: '/frontdesk/departure',
    icon: LogOut,
    title: 'Departure Record',
    subtitle: 'Ghi nhận thông tin check-out và tình trạng phòng sau trả.',
  },
  '/frontdesk/logbook': {
    path: '/frontdesk/logbook',
    icon: NotebookPen,
    title: 'Logbook',
    subtitle: 'Nhật ký hoạt động của lễ tân trong từng ca làm việc.',
  },
  '/frontdesk/technical': {
    path: '/frontdesk/technical',
    icon: Wrench,
    title: 'Báo cáo Kỹ thuật',
    subtitle: 'Ghi nhận và theo dõi các sự cố kỹ thuật được báo cáo.',
  },
  '/frontdesk/approvals': {
    path: '/frontdesk/approvals',
    icon: FileSignature,
    title: 'Phê duyệt',
    subtitle: 'Xét duyệt yêu cầu từ lễ tân: đổi phòng, giảm giá, nâng hạng.',
  },
  '/frontdesk/config': {
    path: '/frontdesk/config',
    icon: SlidersHorizontal,
    title: 'Cấu hình Lễ tân',
    subtitle: 'Thiết lập ca lễ tân, mã giảm giá và quy trình check-in/out.',
  },

  // HOUSEKEEPING
  '/housekeeping/worksheet': {
    path: '/housekeeping/worksheet',
    icon: ClipboardList,
    title: 'Worksheet',
    subtitle: 'Phân công và theo dõi tiến độ dọn phòng theo ca.',
  },
  '/housekeeping/room-status': {
    path: '/housekeeping/room-status',
    icon: BedDouble,
    title: 'Tình trạng phòng',
    subtitle: 'Bảng tổng quan tình trạng phòng theo thời gian thực.',
    tabs: [
      { key: 'all', label: 'Tất cả' },
      { key: 'dirty', label: 'Chưa dọn' },
      { key: 'clean', label: 'Sạch' },
      { key: 'inspect', label: 'Chờ kiểm tra' },
    ],
  },
  '/housekeeping/linen-transfer': {
    path: '/housekeeping/linen-transfer',
    icon: PackageCheck,
    title: 'Giao nhận đồ vải',
    subtitle: 'Quản lý việc giao nhận đồ vải giữa buồng phòng và giặt ủi.',
  },
  '/housekeeping/linen-list': {
    path: '/housekeeping/linen-list',
    icon: ClipboardList,
    title: 'Bảng kê đồ vải',
    subtitle: 'Kiểm kê số lượng đồ vải theo loại và trạng thái.',
  },
  '/housekeeping/config': {
    path: '/housekeeping/config',
    icon: SlidersHorizontal,
    title: 'Cấu hình Buồng phòng',
    subtitle: 'Thiết lập loại phòng, tiêu chuẩn dọn và nhân sự buồng phòng.',
  },

  // INVENTORY
  '/inventory/frontdesk': {
    path: '/inventory/frontdesk',
    icon: Warehouse,
    title: 'Kho Lễ tân',
    subtitle: 'Quản lý nhập/xuất/tồn kho cho bộ phận lễ tân.',
  },
  '/inventory/housekeeping': {
    path: '/inventory/housekeeping',
    icon: Boxes,
    title: 'Kho Buồng phòng',
    subtitle: 'Quản lý nhập/xuất/tồn kho cho bộ phận buồng phòng.',
  },
  '/inventory/report': {
    path: '/inventory/report',
    icon: TrendingUp,
    title: 'Báo cáo X-N-T',
    subtitle: 'Báo cáo Xuất - Nhập - Tồn kho theo kỳ.',
  },
  '/inventory/purchase': {
    path: '/inventory/purchase',
    icon: ShoppingCart,
    title: 'Đề nghị mua hàng',
    subtitle: 'Tạo và theo dõi yêu cầu mua hàng cho các kho.',
  },
  '/inventory/config': {
    path: '/inventory/config',
    icon: SlidersHorizontal,
    title: 'Cấu hình Kho',
    subtitle: 'Thiết lập kho, nhóm hàng, đơn vị tính và tối thiểu tồn.',
  },

  // SALES & RMS
  '/sales/minirms': {
    path: '/sales/minirms',
    icon: TrendingUp,
    title: 'MiniRMS',
    subtitle: 'Quản lý doanh thu phòng, công suất và dự báo nhu cầu.',
    tabs: [
      { key: 'today', label: 'Hôm nay' },
      { key: 'forecast', label: 'Dự báo' },
      { key: 'analysis', label: 'Phân tích' },
    ],
  },
  '/sales/rates': {
    path: '/sales/rates',
    icon: Sliders,
    title: 'Bảng giá phòng',
    subtitle: 'Quản lý bảng giá theo ngày, theo loại phòng và kênh bán.',
  },
  '/sales/config': {
    path: '/sales/config',
    icon: Settings,
    title: 'Cấu hình RMS',
    subtitle: 'Thiết lập quy tắc định giá, kênh phân phối và ràng buộc.',
  },

  // SYSTEM ADMIN
  '/system/users': {
    path: '/system/users',
    icon: ShieldCheck,
    title: 'Quản lý Người dùng',
    subtitle: 'Quản lý tài khoản, phân quyền và vai trò người dùng.',
  },
  '/system/roles': {
    path: '/system/roles',
    icon: UserCog,
    title: 'Quản lý Vai trò',
    subtitle: 'Tạo và quản lý vai trò mẫu để gán nhanh cho người dùng.',
  },
  '/system/hotel-config': {
    path: '/system/hotel-config',
    icon: Hotel,
    title: 'Cấu hình Khách sạn',
    subtitle: 'Thiết lập thông tin khách sạn, loại phòng và tham số hệ thống.',
  },
};
