import { supabase } from '@/lib/supabase';

export type InteractionType = 'view' | 'cart_add' | 'purchase';

export async function trackInteraction(
  userId: string | undefined,
  productId: string,
  type: InteractionType,
  weight?: number
) {
  // If no user, we might want to track anonymously with session ID later, 
  // but for now we only track for logged in users as requested for "user behavior".
  if (!userId) return;

  const interactionWeight = weight ?? (
    type === 'view' ? 1.0 :
    type === 'cart_add' ? 3.0 :
    type === 'purchase' ? 10.0 : 1.0
  );

  const { error } = await supabase.from('user_interactions').insert({
    user_id: userId,
    product_id: productId,
    interaction_type: type,
    weight: interactionWeight,
  });

  if (error) {
    console.error('Failed to track interaction:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }
}

export async function getUserInteractions(userId: string) {
  const { data, error } = await supabase
    .from('user_interactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get user interactions:', error);
    return [];
  }

  return data;
}

export async function getAllInteractionsForClustering() {
  const { data, error } = await supabase
    .from('user_interactions')
    .select('product_id, weight');

  if (error) {
    console.error('Failed to get all interactions:', error);
    return [];
  }

  return data;
}
