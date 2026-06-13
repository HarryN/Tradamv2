import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

export const PUBLIC_SELLER_SELECT =
  'id, email, role, display_name, location, phone, profile_picture_url';

export function isMissingRelationshipError(error: any): boolean {
  const message = String(error?.message || '');
  return message.includes("Could not find a relationship between 'products' and 'profiles'");
}

export async function getProfilesByIds(ids: string[], select = PUBLIC_SELLER_SELECT): Promise<Record<string, Profile>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select(select)
    .in('id', uniqueIds);

  if (error) throw new Error(error.message);

  const map: Record<string, Profile> = {};
  (data || []).forEach((row: any) => {
    map[row.id] = row as Profile;
  });
  return map;
}

export function attachSellersToProducts<T extends { seller_id?: string; seller?: Profile | null }>(
  products: T[],
  sellersById: Record<string, Profile>
): T[] {
  return products.map((product) => {
    const sellerId = (product as any).seller_id;
    if (sellerId && sellersById[sellerId]) {
      return { ...product, seller: sellersById[sellerId] };
    }
    return product;
  });
}
