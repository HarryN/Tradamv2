import { supabase } from '@/lib/supabase';

export interface SellerProfileData {
  id: string;
  email: string;
  role: string;
  profile_picture_url?: string | null;
  display_name?: string | null;
  location?: string | null;
  phone?: string | null;
  created_at: string;
}

export async function getSellerProfile(userId: string): Promise<SellerProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, profile_picture_url, display_name, location, phone, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching seller profile:', error.message);
    return null;
  }

  return data as SellerProfileData;
}

export async function updateSellerProfile(
  userId: string,
  profile: Partial<Pick<SellerProfileData, 'profile_picture_url' | 'display_name' | 'location' | 'phone'>>
): Promise<SellerProfileData | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select('id, email, role, profile_picture_url, display_name, location, phone, created_at')
    .single();

  if (error) {
    console.error('Error updating seller profile:', error.message);
    return null;
  }

  return data as SellerProfileData;
}

export async function uploadSellerProfileImage(file: File, sellerId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `seller-profile/${sellerId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
