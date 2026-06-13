'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import ProductForm from '@/features/products/components/ProductForm';
import { getProductById, updateProduct, uploadProductImage, deleteProductImage } from '@/services/product-service';
import { Product, ProductFormData } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

export default function EditProductPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load existing product
  useEffect(() => {
    if (!productId) return;
    getProductById(productId)
      .then((data) => {
        if (!data) {
          setFetchError(t('productNotFound'));
          return;
        }
        // Ensure this product belongs to the current seller
        if (data.seller_id !== user?.id) {
          setFetchError(t('accessRestricted'));
          return;
        }
        setProduct(data);
      })
      .catch(() => setFetchError(t('loadProductsError')))
      .finally(() => setFetching(false));
  }, [productId, user?.id, t]);

  const handleSubmit = async (formData: ProductFormData, resolvedCategoryId: string) => {
    if (!user || !product) return;
    setLoading(true);

    try {
      let imageUrl: string | null = formData.image_url || null;

      if (formData.image_file) {
        // Delete old image if exists and is a Supabase URL
        if (product.image_url && product.image_url.includes('supabase')) {
          await deleteProductImage(product.image_url);
        }
        imageUrl = await uploadProductImage(formData.image_file, user.id);
      } else if (!formData.image_url && product.image_url) {
        // User removed the image
        if (product.image_url.includes('supabase')) {
          await deleteProductImage(product.image_url);
        }
        imageUrl = null;
      }

      await updateProduct(product.id, {
        category_id: resolvedCategoryId || null,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price.toString()),
        stock: parseInt(formData.stock.toString()),
        image_url: imageUrl,
        is_active: formData.is_active,
      });

      setSuccess(true);
      setTimeout(() => router.push('/sellers/products'), 2000);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm text-neutral-muted">{t('loadingProduct')}</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto w-full">
        <div className="flex items-start gap-3 bg-red-50 text-red-700 px-5 py-4 rounded-2xl border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">{fetchError}</p>
            <Link href="/sellers/products" className="text-xs font-semibold mt-2 inline-block underline">
              {t('backToProducts')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-neutral-text">{t('changesSaved')}</h2>
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
          {t('editProduct')}
        </h1>
        <p className="mt-1 text-sm text-neutral-muted line-clamp-1">
          {t('editing')}: <span className="font-bold text-neutral-text">{product?.title}</span>
        </p>
      </div>

      {/* Form Card */}
      {product && (
        <div className="bg-white rounded-2xl border border-neutral-border shadow-xs p-6 lg:p-8">
          <ProductForm
            initialData={{
              title: product.title,
              description: product.description,
              category_id: product.category_id || '',
              price: product.price.toString(),
              stock: product.stock.toString(),
              image_url: product.image_url || null,
              is_active: product.is_active,
            }}
            onSubmit={handleSubmit}
            submitLabel={t('saveProduct')}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
