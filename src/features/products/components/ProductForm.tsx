'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ImagePlus, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Tag,
  Package,
  FileText,
  ToggleLeft,
  ToggleRight,
  Info,
  Banknote,
  Sparkles
} from 'lucide-react';
import { getCategories, createCategory } from '@/services/category-service';
import { generateProductDescription } from '@/services/ai-service';
import { Category, ProductFormData } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';

const OTHERS_ID = '__others__';
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData, resolvedCategoryId: string) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

export default function ProductForm({
  initialData,
  onSubmit,
  submitLabel,
  loading = false,
}: ProductFormProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [customCategoryName, setCustomCategoryName] = useState(initialData?.custom_category_name || '');
  const [customCategoryError, setCustomCategoryError] = useState<string | null>(null);
  const [price, setPrice] = useState(initialData?.price || '');
  const [stock, setStock] = useState(initialData?.stock || '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const displaySubmitLabel = submitLabel || t('saveProduct');

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load categories on mount
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setFormError(t('loadingCategoriesError')))
      .finally(() => setLoadingCategories(false));
  }, [t]);

  // Validate custom category name in real-time
  useEffect(() => {
    if (categoryId !== OTHERS_ID || !customCategoryName.trim()) {
      setCustomCategoryError(null);
      return;
    }
    const normalized = customCategoryName.trim().toLowerCase();
    const clash = categories.find(c => c.name.toLowerCase() === normalized);
    if (clash) {
      setCustomCategoryError(
        `"${clash.name}" ${t('categoryExists')}`
      );
    } else {
      setCustomCategoryError(null);
    }
  }, [customCategoryName, categoryId, categories, t]);

  // Image handling
  const processImageFile = useCallback((file: File) => {
    setImageError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError(t('fileConstraints'));
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setImageError(t('fileConstraints'));
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processImageFile(file);
  }, [processImageFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = t('fillAllFields');
    if (title.trim().length < 3) errors.title = t('passwordMinLength');
    if (!description.trim()) errors.description = t('fillAllFields');
    if (!categoryId) errors.category = t('selectCategory');
    if (categoryId === OTHERS_ID) {
      if (!customCategoryName.trim()) errors.customCategory = t('fillAllFields');
      if (customCategoryError) errors.customCategory = customCategoryError;
    }
    const priceNum = parseFloat(price.toString());
    if (!price || isNaN(priceNum) || priceNum < 0) errors.price = t('fillAllFields');
    const stockNum = parseInt(stock.toString());
    if (!stock || isNaN(stockNum) || stockNum < 0) errors.stock = t('fillAllFields');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    try {
      let resolvedCategoryId = categoryId;

      // If "Others" selected, create the new category first
      if (categoryId === OTHERS_ID) {
        const newCategory = await createCategory(customCategoryName.trim());
        resolvedCategoryId = newCategory.id;
        // Add to local list to prevent duplicates on re-submit
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      }

      const formData: ProductFormData = {
        title: title.trim(),
        description: description.trim(),
        category_id: resolvedCategoryId,
        custom_category_name: categoryId === OTHERS_ID ? customCategoryName.trim() : undefined,
        price: price.toString(),
        stock: stock.toString(),
        image_file: imageFile,
        image_url: imagePreview && !imageFile ? imagePreview : null,
        is_active: isActive,
      };

      await onSubmit(formData, resolvedCategoryId);
    } catch (err: any) {
      setFormError(err.message || t('statusUpdateError'));
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm text-neutral-text placeholder:text-neutral-muted bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
      fieldErrors[field] ? 'border-red-400 bg-red-50/30' : 'border-neutral-border'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {formError && (
        <div className="flex items-start gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Image Upload */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-neutral-muted mb-3">
          {t('productImage')}
        </label>

        {imagePreview ? (
          <div className="relative group w-full max-w-xs">
            <img
              src={imagePreview}
              alt="Product preview"
              className="w-full h-52 object-cover rounded-xl border border-neutral-border shadow-sm"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-neutral-muted hover:text-red-600 rounded-full shadow-sm transition-colors border border-neutral-border"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors" />
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-neutral-border hover:border-primary/50 hover:bg-primary/2 bg-neutral-bg/40'
            }`}
          >
            <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-primary/10 text-primary' : 'bg-neutral-border/40 text-neutral-muted'}`}>
              <ImagePlus className="w-6 h-6" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-neutral-text">
                {isDragging ? t('dropImageHere') : t('clickOrDrag')}
              </p>
              <p className="text-xs text-neutral-muted mt-1">
                {t('fileConstraints')}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])}
            />
          </div>
        )}
        {imageError && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {imageError}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-xs font-bold uppercase tracking-widest text-neutral-muted mb-2">
          {t('productTitle')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="title"
            type="text"
            placeholder={t('titlePlaceholder')}
            value={title}
            onChange={e => { setTitle(e.target.value); setFieldErrors(p => ({ ...p, title: '' })); }}
            className={`${inputClass('title')} pl-10`}
          />
          <FileText className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        {fieldErrors.title && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {fieldErrors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="description" className="block text-xs font-bold uppercase tracking-widest text-neutral-muted">
            {t('description')} <span className="text-red-500">*</span>
          </label>
        </div>
        <textarea
          id="description"
          rows={4}
          placeholder={t('descPlaceholder')}
          value={description}
          onChange={e => { setDescription(e.target.value); setFieldErrors(p => ({ ...p, description: '' })); }}
          className={`${inputClass('description')} resize-none leading-relaxed`}
        />
        <div className="flex items-center justify-between mt-1.5">
          {fieldErrors.description ? (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {fieldErrors.description}
            </p>
          ) : <span />}
          <span className={`text-xs ${description.length > 500 ? 'text-red-500' : 'text-neutral-muted'}`}>
            {description.length}/500
          </span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-xs font-bold uppercase tracking-widest text-neutral-muted mb-2">
          {t('category')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="category"
            value={categoryId}
            onChange={e => { setCategoryId(e.target.value); setCustomCategoryName(''); setFieldErrors(p => ({ ...p, category: '' })); }}
            className={`${inputClass('category')} pl-10 appearance-none cursor-pointer`}
            disabled={loadingCategories}
          >
            <option value="">{loadingCategories ? t('loadingCategories') : t('selectCategory')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{t(cat.name)}</option>
            ))}
            <option value={OTHERS_ID}>── {t('othersManual')}</option>
          </select>
          <Tag className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        {fieldErrors.category && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {fieldErrors.category}
          </p>
        )}

        {/* Custom Category Input (visible only when "Others" selected) */}
        {categoryId === OTHERS_ID && (
          <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 mb-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {t('customCategoryLabel')}
              </p>
            </div>
            <input
              type="text"
              placeholder={t('categoryPlaceholder')}
              value={customCategoryName}
              onChange={e => { setCustomCategoryName(e.target.value); setFieldErrors(p => ({ ...p, customCategory: '' })); }}
              className={`w-full px-4 py-3 rounded-xl border text-sm text-neutral-text placeholder:text-neutral-muted bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                customCategoryError || fieldErrors.customCategory
                  ? 'border-red-400 bg-red-50/30'
                  : customCategoryName.trim() && !customCategoryError
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-neutral-border'
              }`}
            />
            {customCategoryError ? (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {customCategoryError}
              </p>
            ) : customCategoryName.trim() && !customCategoryError && (
              <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                "{customCategoryName.trim()}" {t('newCategoryNotice')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Price & Stock side by side on tablet+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-xs font-bold uppercase tracking-widest text-neutral-muted mb-2">
            {t('price')} ({t('priceCurrency')}) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="price"
              type="number"
              min="0"
              step="50"
              placeholder={t('pricePlaceholder')}
              value={price}
              onChange={e => { setPrice(e.target.value); setFieldErrors(p => ({ ...p, price: '' })); }}
              className={`${inputClass('price')} pl-12`}
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Banknote className="w-4 h-4 text-neutral-muted" />
            </div>
          </div>
          {fieldErrors.price && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {fieldErrors.price}
            </p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="stock" className="block text-xs font-bold uppercase tracking-widest text-neutral-muted mb-2">
            {t('stock')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="stock"
              type="number"
              min="0"
              step="1"
              placeholder={t('stockPlaceholder')}
              value={stock}
              onChange={e => { setStock(e.target.value); setFieldErrors(p => ({ ...p, stock: '' })); }}
              className={`${inputClass('stock')} pl-10`}
            />
            <Package className="w-4 h-4 text-neutral-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          {fieldErrors.stock && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {fieldErrors.stock}
            </p>
          )}
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between p-4 bg-neutral-bg/60 rounded-xl border border-neutral-border">
        <div>
          <p className="text-sm font-bold text-neutral-text">{t('publishProduct')}</p>
          <p className="text-xs text-neutral-muted mt-0.5">
            {isActive
              ? t('productLiveDesc')
              : t('productHiddenDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
            isActive
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-neutral-border/60 text-neutral-muted hover:bg-neutral-border'
          }`}
        >
          {isActive ? (
            <><ToggleRight className="w-5 h-5" /> {t('live')}</>
          ) : (
            <><ToggleLeft className="w-5 h-5" /> {t('draft')}</>
          )}
        </button>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !!customCategoryError}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-primary/40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('saving')}
            </>
          ) : displaySubmitLabel}
        </button>
      </div>
    </form>
  );
}
