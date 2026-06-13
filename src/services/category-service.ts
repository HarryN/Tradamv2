import { supabase } from '@/lib/supabase';
import { Category } from '@/types';

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err: any) {
    // Enrich common network/fetch failures with actionable guidance
    if (err?.message?.toLowerCase?.().includes('fetch failed') || err?.message?.toLowerCase?.().includes('failed to fetch')) {
      throw new Error(
        'Network request to Supabase failed. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment, ensure the URL starts with https://<project>.supabase.co, and verify network access to Supabase.'
      );
    }
    throw err;
  }
}

export async function createCategory(name: string): Promise<Category> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } catch (err: any) {
    if (err?.message?.toLowerCase?.().includes('fetch failed') || err?.message?.toLowerCase?.().includes('failed to fetch')) {
      throw new Error(
        'Network request to Supabase failed. Check your environment variables and network connectivity.'
      );
    }
    throw err;
  }
}
