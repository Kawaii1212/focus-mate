"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../../store/AppContext';
import {
  LayoutDashboard,
  Heart,
  Timer,
  Users,
  Brain,
  ShoppingBag,
  Crown,
  User,
  LogOut,
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  tier?: 1 | 2 | 3;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Trang Chủ', icon: <LayoutDashboard className="w-5 h-5" />, tier: 1 },
  { to: '/mascot-room', label: 'Phòng Mascot', icon: <Heart className="w-5 h-5" />, tier: 1 },
  { to: '/study', label: 'Học Tập', icon: <Timer className="w-5 h-5" />, tier: 1 },
  { to: '/costudy', label: 'Co-Study', icon: <Users className="w-5 h-5" />, tier: 2 },
  { to: '/planner', label: 'AI Planner', icon: <Brain className="w-5 h-5" />, tier: 2 },
  { to: '/shop', label: 'Cửa Hàng', icon: <ShoppingBag className="w-5 h-5" />, tier: 3 },
  { to: '/premium', label: 'Premium', icon: <Crown className="w-5 h-5" />, tier: 3 },
  { to: '/profile', label: 'Hồ Sơ', icon: <User className="w-5 h-5" />, tier: 3 },
  { to: '/settings', label: 'Cài Đặt', icon: <SettingsIcon className="w-5 h-5" />, tier: 3 },
];

export default function Sidebar() {
  const { dispatch } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  };

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-fm-sm"
            style={{ background: 'hsl(var(--sky))' }}
          >
            F
          </div>
          <span className="font-bold text-lg text-foreground">FocusMate</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className={
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === item.to
                  ? 'bg-sky-light text-sky shadow-fm-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
            style={pathname === item.to ? { color: 'hsl(var(--sky))' } : {}}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.tier === 3 && (
              <Crown className="w-3 h-3 ml-auto opacity-40" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng Xuất</span>
        </button>
      </div>
    </aside>
  );
}
