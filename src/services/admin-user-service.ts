import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

export type AdminManagedUser = Profile;

export async function getAdminUsers(): Promise<AdminManagedUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as AdminManagedUser[];
}
