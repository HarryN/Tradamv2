'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import ProductForm from '@/features/products/components/ProductForm';
import { createProduct, uploadProductImage } from '@/services/product-service';
import { ProductFormData } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

export default function NewProductPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      router.push('/sellers/products');
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [success, router]);

  const handleSubmit = async (formData: ProductFormData, resolvedCategoryId: string) => {
    if (!user) return;
    setLoading(true);

    try {
      let imageUrl: string | null = formData.image_url || null;

      // Upload image if a new file was selected
      if (formData.image_file) {
        imageUrl = await uploadProductImage(formData.image_file, user.id);
      }

      await createProduct({
        seller_id: user.id,
        category_id: resolvedCategoryId || null,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price.toString()),
        stock: parseInt(formData.stock.toString()),
        image_url: imageUrl,
        is_active: formData.is_active,
      });

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-neutral-text">{t('productCreated')}</h2>
        <p className="mt-2 text-sm text-neutral-muted">{t('redirecting')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
      {/* Back link */}
      <Link
        href="/sellers/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToProducts')}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-text">
          {t('addProduct')}
        </h1>
        <p className="mt-1 text-sm text-neutral-muted">
          {t('requiredFields')}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-neutral-border shadow-xs p-6 lg:p-8">
        <ProductForm
          onSubmit={handleSubmit}
          submitLabel={t('publishProduct')}
          loading={loading}
        />
      </div>
    </div>
  );
}
