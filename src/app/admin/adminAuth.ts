"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isPremium?: boolean;
}

export function useAdminAuth() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fm_admin_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAdmin(parsed);
      } else {
        // Fallback: check if regular user in focusmate_state has role === 'admin'
        const appStateRaw = localStorage.getItem('focusmate_state');
        if (appStateRaw) {
          const appState = JSON.parse(appStateRaw);
          if (appState.user && appState.user.role === 'admin') {
            const adminUser: AdminUser = {
              id: appState.user.id,
              name: appState.user.name,
              email: appState.user.email,
              role: 'admin',
              isPremium: appState.user.isPremium,
            };
            setAdmin(adminUser);
            localStorage.setItem('fm_admin_user', JSON.stringify(adminUser));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAsAdmin = (adminUser: AdminUser, token?: string) => {
    localStorage.setItem('fm_admin_user', JSON.stringify(adminUser));
    if (token) localStorage.setItem('fm_admin_token', token);
    setAdmin(adminUser);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('fm_admin_user');
    localStorage.removeItem('fm_admin_token');
    setAdmin(null);
    router.push('/admin/login');
  };

  return { admin, loading, loginAsAdmin, logoutAdmin };
}
