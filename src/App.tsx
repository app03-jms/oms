import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { RouterProvider, useRouter } from '@/router/RouterContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/AppLayout';
import GenericPage from '@/pages/GenericPage';
import { Shield } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import HrmConfigPage from '@/pages/hrm/HrmConfigPage';
import EmployeesPage from '@/pages/hrm/EmployeesPage';
import SchedulePage from '@/pages/hrm/SchedulePage';
import LeavePage from '@/pages/hrm/LeavePage';
import AttendancePage from '@/pages/hrm/AttendancePage';
import TimesheetPage from '@/pages/hrm/TimesheetPage';
import ApprovalsPage from '@/pages/hrm/ApprovalsPage';
import PayrollPage from '@/pages/hrm/PayrollPage';
import UserManagementPage from '@/pages/settings/UserManagementPage';
import RoleManagementPage from '@/pages/settings/RoleManagementPage';
import HotelConfigPage from '@/pages/system/HotelConfigPage';
import HotelSelectionScreen from '@/pages/HotelSelectionScreen';
import ChangePasswordModal from '@/components/ChangePasswordModal';

// Map of routes that have custom page implementations
const CUSTOM_PAGES: Record<string, React.ComponentType> = {
  '/hrm/config': HrmConfigPage,
  '/hrm/employees': EmployeesPage,
  '/hrm/schedule': SchedulePage,
  '/hrm/leave': LeavePage,
  '/hrm/attendance': AttendancePage,
  '/hrm/timesheet': TimesheetPage,
  '/hrm/approvals': ApprovalsPage,
  '/hrm/payroll': PayrollPage,
  '/system/users': UserManagementPage,
  '/system/roles': RoleManagementPage,
  '/system/hotel-config': HotelConfigPage,
};

// Preload SheetJS CDN script on mount so schedule import/export is ready
function usePreloadXLSX() {
  useEffect(() => {
    if ((window as any).XLSX) return;
    const existing = document.querySelector('script[data-xlsx-cdn]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.setAttribute('data-xlsx-cdn', 'true');
    script.async = true;
    document.head.appendChild(script);
  }, []);
}

function Dashboard() {
  return (
    <div className="px-8 pt-6 pb-8">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
          <span>HRM</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary text-lg font-bold">J</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink leading-tight">Tổng quan</h1>
            <p className="text-sm text-info mt-0.5">Chào mừng trở lại hệ thống OMS by Jenius.</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Nhân viên', value: '5', hint: 'Đang làm việc' },
          { label: 'Ca hôm nay', value: '3', hint: 'Ca Sáng / Chiều / Đêm' },
          { label: 'Số phép TB', value: '12.0', hint: 'Ngày / nhân viên' },
          { label: 'Bộ phận', value: '4', hint: 'Lễ tân, Buồng, Bếp, Bảo trì' },
        ].map((card) => (
          <div key={card.label} className="bg-card rounded-xl border border-line/30 p-5">
            <p className="text-xs font-medium text-info mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-ink">{card.value}</p>
            <p className="text-xs text-line mt-0.5">{card.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const SUPER_ADMIN_ONLY_ROUTES = new Set(['/system/hotel-config']);

function AppContent() {
  const { isAuthenticated, needsHotelSelection, user } = useAuth();
  const { path, navigate } = useRouter();
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  usePreloadXLSX();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated but no hotel selected — show hotel selection screen
  if (needsHotelSelection) {
    return <HotelSelectionScreen />;
  }

  // Forced password change on first login — block all usage until updated
  if (user?.must_change_password === true) {
    return (
      <>
        <AppLayout>
          <div className="px-8 pt-6 pb-8">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-warning" />
              </div>
              <h1 className="text-xl font-bold text-ink">Yêu cầu đổi mật khẩu</h1>
              <p className="text-sm text-info mt-2 max-w-md">
                Tài khoản của bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.
              </p>
            </div>
          </div>
        </AppLayout>
        <ChangePasswordModal open forced />
      </>
    );
  }

  // Route guard: block non-super-admins from accessing super-admin-only routes
  if (SUPER_ADMIN_ONLY_ROUTES.has(path) && user?.is_super_admin !== true) {
    return (
      <AppLayout>
        <div className="px-8 pt-6 pb-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink leading-tight">Không có quyền truy cập</h1>
                <p className="text-sm text-info mt-0.5">Bạn không có quyền truy cập vào trang này.</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-line/30 p-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-info text-center max-w-md">
                Bạn không có quyền truy cập vào Cấu hình Khách sạn Hệ thống. Vui lòng liên hệ Super Admin nếu cần hỗ trợ.
              </p>
              <button
                onClick={() => navigate('/hrm/timesheet')}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Về trang chính
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Custom page implementation
  const CustomPage = CUSTOM_PAGES[path];
  if (CustomPage) {
    return (
      <AppLayout>
        <CustomPage />
      </AppLayout>
    );
  }

  const route = ROUTES[path];
  if (!route) {
    // Catch-all fallback: render Dashboard for any unknown path
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }

  const activeTabKey = activeTabs[route.path] ?? route.tabs?.[0]?.key ?? '';

  return (
    <AppLayout>
      <GenericPage
        path={route.path}
        icon={route.icon}
        title={route.title}
        subtitle={route.subtitle}
        description={route.description}
        tabs={route.tabs}
        activeTab={activeTabKey}
        onTabChange={(key) =>
          setActiveTabs((prev) => ({ ...prev, [route.path]: key }))
        }
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
