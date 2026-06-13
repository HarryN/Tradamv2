import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { attachSellersToProducts, getProfilesByIds, isMissingRelationshipError, PUBLIC_SELLER_SELECT } from '@/services/profile-utils';

const PRODUCT_WITH_SELLER_SELECT = `*, category:categories(id, name), seller:profiles!seller_id(${PUBLIC_SELLER_SELECT})`;
function filterVisibleProducts(products: Product[] | null | undefined): Product[] {
  return (products || []).filter((product) => product.seller?.role === 'seller');
}

export async function getSellerProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_WITH_SELLER_SELECT)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (!error) return (data || []) as Product[];

  if (!isMissingRelationshipError(error)) {
    throw new Error(error.message);
  }

  const { data: products, error: fallbackError } = await supabase
    .from('products')
    .select('*, category:categories(id, name)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (fallbackError) throw new Error(fallbackError.message);
  const list = (products || []) as Product[];
  const sellers = await getProfilesByIds(list.map((p) => p.seller_id));
  return attachSellersToProducts(list, sellers);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_WITH_SELLER_SELECT)
    .eq('id', id)
    .single();

  if (!error) return data as Product;
  if (!isMissingRelationshipError(error)) return null;

  const { data: product, error: fallbackError } = await supabase
    .from('products')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .single();

  if (fallbackError || !product) return null;
  const sellers = await getProfilesByIds([(product as any).seller_id]);
  return attachSellersToProducts([product as Product], sellers)[0] || null;
}

export async function getPublicProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_WITH_SELLER_SELECT)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!error && data) {
    return data as Product;
  }

  if (error && !isMissingRelationshipError(error)) return null;

  const { data: product, error: fallbackError } = await supabase
    .from('products')
    .select('*, category:categories(id, name)')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (fallbackError || !product) return null;
  const sellers = await getProfilesByIds([(product as any).seller_id]);
  const hydrated = attachSellersToProducts([product as Product], sellers)[0];
  if (!hydrated || hydrated.seller?.role !== 'seller') return null;
  return hydrated;
}

export async function getProducts(options?: {
  search?: string;
  category_id?: string | null;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  const { search, category_id, limit = 24, offset = 0 } = options || {};

  let query = supabase
    .from('products')
    .select(PRODUCT_WITH_SELLER_SELECT)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    .eq('is_active', true);

  if (category_id) {
    query = query.eq('category_id', category_id);
  }

  if (search && search.trim().length > 0) {
    const q = `%${search.trim()}%`;
    query = query.or(`title.ilike.${q},description.ilike.${q}`);
  }

  const { data, error } = await query;
  if (!error) {
    return filterVisibleProducts((data || []) as Product[]);
  }

  if (!isMissingRelationshipError(error)) {
    throw new Error(error.message);
  }

  let fallbackQuery = supabase
    .from('products')
    .select('*, category:categories(id, name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    .eq('is_active', true);

  if (category_id) {
    fallbackQuery = fallbackQuery.eq('category_id', category_id);
  }

  if (search && search.trim().length > 0) {
    const q = `%${search.trim()}%`;
    fallbackQuery = fallbackQuery.or(`title.ilike.${q},description.ilike.${q}`);
  }

  const { data: products, error: fallbackError } = await fallbackQuery;
  if (fallbackError) throw new Error(fallbackError.message);
  const list = (products || []) as Product[];
  const sellers = await getProfilesByIds(list.map((p) => p.seller_id));
  return filterVisibleProducts(attachSellersToProducts(list, sellers));
}

export async function createProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'seller'>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select(PRODUCT_WITH_SELLER_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'created_at' | 'category' | 'seller'>>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(PRODUCT_WITH_SELLER_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function uploadProductImage(file: File, sellerId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${sellerId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  const urlParts = imageUrl.split('/product-images/');
  if (urlParts.length < 2) return;
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('product-images')
    .remove([filePath]);

  if (error) console.error('Failed to delete image:', error.message);
}
