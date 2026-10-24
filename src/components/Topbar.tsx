import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Circle, LogOut, User as UserIcon, Building2, ChevronDown, RefreshCw, Check, KeyRound } from 'lucide-react';
import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function Topbar() {
  const { user, activeHotel, hotels, switchHotel, logout } = useAuth();
  const [hotelMenuOpen, setHotelMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hotelMenuOpen && !userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (hotelMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHotelMenuOpen(false);
      }
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [hotelMenuOpen, userMenuOpen]);

  const handleSwitch = (hotelId: string) => {
    switchHotel(hotelId);
    setHotelMenuOpen(false);
  };

  const showSwitcher = hotels.length > 1;

  return (
    <>
      <header className="h-16 shrink-0 bg-card border-b border-line/30 flex items-center justify-between px-6">
        {/* Brand & hotel badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Logo className="w-7 h-7 shrink-0" />
            <span className="text-sm font-bold text-ink tracking-tight hidden md:inline">OMS BY JENIUS</span>
          </div>

          {/* Active hotel badge / switcher */}
          {showSwitcher ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setHotelMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft/40 border border-primary/15 hover:bg-primary-soft/60 transition-all"
              >
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-ink max-w-[140px] truncate">
                  {(activeHotel?.name || '—').toUpperCase()}
                </span>
                <ChevronDown className="w-3 h-3 text-info" />
              </button>
              {hotelMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-line/30 z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-line/20 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-ink">Đổi Khách Sạn</span>
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {hotels.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => handleSwitch(h.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-primary-soft/30 transition-colors ${
                          activeHotel?.id === h.id ? 'bg-primary-soft/20' : ''
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-info shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-ink truncate">{(h.name || '').toUpperCase()}</p>
                          <p className="text-[10px] text-line font-mono">{h.code}</p>
                        </div>
                        {activeHotel?.id === h.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft/40 border border-primary/15">
              <span className="text-xs font-medium text-ink">
                {(activeHotel?.name || '—').toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <Circle className="w-2 h-2 fill-success text-success animate-pulse" />
            <span className="text-xs font-medium text-success hidden sm:inline">Hoạt động</span>
          </div>
        </div>

        {/* User info & menu */}
        <div className="flex items-center gap-4">
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg hover:bg-primary-soft/30 transition-colors px-1.5 py-1"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-ink leading-tight">{(user?.full_name || 'User').toUpperCase()}</p>
                <p className="text-[11px] text-info leading-tight">{user?.is_super_admin ? 'Super Admin' : 'Staff'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-info hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-card rounded-xl shadow-xl border border-line/30 z-50 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-line/20">
                  <p className="text-sm font-semibold text-ink truncate">{user?.full_name || 'User'}</p>
                  <p className="text-[11px] text-info font-mono truncate">{user?.username}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); setPwModalOpen(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-ink hover:bg-primary-soft/30 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-info shrink-0" />
                    <span>Đổi mật khẩu</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal open={pwModalOpen} onClose={() => setPwModalOpen(false)} />
    </>
  );
}
