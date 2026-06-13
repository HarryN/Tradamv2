'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { AdminManagedUser, getAdminUsers } from '@/services/admin-user-service';
import { useLanguage } from '@/hooks/useLanguage';

type RoleFilter = 'all' | 'buyer' | 'seller' | 'admin';

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || t('adminUsersLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter((user) => user.role === roleFilter);
  }, [users, roleFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-text tracking-tight">{t('adminUsersTitle')}</h1>
          <p className="mt-2 text-sm text-neutral-muted">
            {t('adminUsersSub')}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-neutral-border bg-white p-1 shadow-sm">
          {(['all', 'buyer', 'seller', 'admin'] as RoleFilter[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                roleFilter === role ? 'bg-primary text-white' : 'text-neutral-muted hover:bg-neutral-bg'
              }`}
            >
              {t(role)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            return (
              <div key={user.id} className="rounded-3xl border border-neutral-border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-neutral-text">{user.display_name || user.email}</h2>
                      <span className="rounded-full bg-neutral-bg px-3 py-1 text-[10px] font-black uppercase tracking-widest text-neutral-muted">
                        {user.role}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-neutral-muted">
                      <p>{user.email}</p>
                      <p>{user.location || t('adminUsersNoLocation')}</p>
                      <p>{user.phone || t('adminUsersNoPhone')}</p>
                      <p>{t('adminUsersJoined')} {new Date(user.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-bg px-4 py-3 text-sm font-bold text-neutral-muted">
                    <ShieldAlert className="h-4 w-4" />
                    {profile?.role === 'admin' ? t('role') : t('adminAccessDenied')}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="rounded-3xl border border-dashed border-neutral-border bg-white p-12 text-center text-sm font-medium text-neutral-muted">
              {t('adminUsersEmpty')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
