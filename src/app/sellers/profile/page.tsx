'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { getSellerProfile, updateSellerProfile, uploadSellerProfileImage } from '@/services/profile-service';
import { getSellerProducts } from '@/services/product-service';
import { getOrdersForSeller } from '@/services/order-service';
import { getSellerAccountStats } from '@/services/dispute-service';
import { useLanguage } from '@/hooks/useLanguage';
import { User, Camera, MapPin, Smartphone, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function SellerProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setLoading(true);
      try {
        const [profileData, productData, orderData, disputeData] = await Promise.all([
          getSellerProfile(user.id),
          getSellerProducts(user.id),
          getOrdersForSeller(user.id),
          getSellerAccountStats(user.id),
        ]);

        setProfile(profileData);
        setProducts(productData || []);
        setOrders(orderData || []);
        setStats(disputeData || null);
        setDisplayName(profileData?.display_name || '');
        setLocation(profileData?.location || '');
        setPhone(profileData?.phone || '');
        setPictureUrl(profileData?.profile_picture_url || '');
      } catch (err) {
        console.error('Failed to load seller profile page:', err);
        setError(t('unableToLoadProfileData'));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, t]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => {
      return sum + (order.items || []).reduce((itemSum: number, item: any) => itemSum + (item.unit_price ?? 0) * (item.quantity ?? 0), 0);
    }, 0);
  }, [orders]);

  const stockValue = useMemo(() => {
    return products.reduce((sum, product) => sum + (product.price ?? 0) * (product.stock ?? 0), 0);
  }, [products]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);
    setError(null);
    try {
      const url = await uploadSellerProfileImage(file, user.id);
      setPictureUrl(url);
    } catch (err: any) {
      console.error('Failed to upload profile image:', err);
      setError(err.message || t('profileImageUploadFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const updatedProfile = await updateSellerProfile(user.id, {
        display_name: displayName,
        location,
        phone,
        profile_picture_url: pictureUrl,
      });
      if (updatedProfile) {
        setProfile(updatedProfile);
        setSuccess(t('profileUpdatedSuccessfully'));
      } else {
        setError(t('unableToSaveProfile'));
      }
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError(err.message || t('unableToSaveProfile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-semibold text-neutral-muted">{t('loadingSellerProfile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-neutral-muted">{t('sellerProfile')}</p>
              <h1 className="text-3xl font-black text-neutral-text">{t('manageShopIdentity')}</h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-neutral-muted">{t('sellerProfileIntro')}</p>
        </div>
        <div className="rounded-3xl border border-neutral-border bg-neutral-bg/60 p-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-muted">{t('sellerSummary')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-3xl bg-white border border-neutral-border p-4 text-center">
              <p className="text-3xl font-black text-neutral-text">{products.length}</p>
              <p className="text-xs text-neutral-muted mt-1">{t('productsLabel')}</p>
            </div>
            <div className="rounded-3xl bg-white border border-neutral-border p-4 text-center">
              <p className="text-3xl font-black text-neutral-text">{orders.length}</p>
              <p className="text-xs text-neutral-muted mt-1">{t('ordersLabel')}</p>
            </div>
            <div className="rounded-3xl bg-white border border-neutral-border p-4 text-center">
              <p className="text-3xl font-black text-neutral-text">{stats?.totalDisputes ?? 0}</p>
              <p className="text-xs text-neutral-muted mt-1">{t('disputesLabel')}</p>
            </div>
            <div className="rounded-3xl bg-white border border-neutral-border p-4 text-center">
              <p className="text-3xl font-black text-neutral-text">{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-neutral-muted mt-1">{t('salesFcfa')}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-neutral-border shadow-xs p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-[2rem] bg-neutral-bg border border-neutral-border">
                  {pictureUrl ? (
                    <img src={pictureUrl} alt={t('sellerProfile')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-muted">
                      <Camera className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-muted">{t('currentProfilePicture')}</p>
                  <p className="mt-1 text-sm text-neutral-text">{t('uploadStoreImage')}</p>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-border bg-neutral-bg px-4 py-3 text-sm font-semibold text-neutral-text transition hover:bg-neutral-bg/80">
                {t('changePicture')}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <div className="grid gap-4 mt-8 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-neutral-text mb-2">{t('displayName')}</label>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-3xl border border-neutral-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder={t('displayNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-text mb-2">{t('location')}</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-neutral-border" />
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="w-full rounded-3xl border border-neutral-border px-10 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder={t('locationPlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-neutral-text mb-2">{t('phoneNumber')}</label>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-neutral-border" />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-3xl border border-neutral-border px-10 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder={t('phonePlaceholder')}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-muted">{t('profileDetails')}</p>
                <p className="mt-1 text-sm text-neutral-muted">{t('profileDetailsSub')}</p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-black text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {t('saveProfile')}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-neutral-border bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-neutral-text">{t('sellerAccountHealth')}</p>
                <p className="text-xs text-neutral-muted">{t('sellerAccountHealthSub')}</p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-3xl bg-neutral-bg/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-muted">{t('profile')}</p>
                <p className="mt-2 text-sm text-neutral-text">{displayName || user?.email?.split('@')[0] || t('noDisplayNameYet')}</p>
                <p className="mt-1 text-xs text-neutral-muted">{location || t('locationNotSet')}</p>
              </div>

              <div className="rounded-3xl bg-neutral-bg/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-muted">{t('inventoryValue')}</p>
                <p className="mt-2 text-sm text-neutral-text">{stockValue.toLocaleString()} {t('priceCurrency')}</p>
                <p className="mt-1 text-xs text-neutral-muted">{t('inventoryValueSub')}</p>
              </div>

              <div className="rounded-3xl bg-neutral-bg/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-muted">{t('disputeStatus')}</p>
                <p className="mt-2 text-sm text-neutral-text">{stats?.pendingDisputes ?? 0} {t('pending').toLowerCase()}, {stats?.resolvedDisputes ?? 0} {t('resolved').toLowerCase()}</p>
                <p className="mt-1 text-xs text-neutral-muted">{t('disputeStatusSub')}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
