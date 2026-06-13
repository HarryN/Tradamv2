import { supabase } from '@/lib/supabase';
import { Dispute, DisputeEvidence, DisputeStatus } from '@/types';

export async function createDispute(
  orderItemId: string,
  initiatorId: string,
  reason: string,
  description: string
): Promise<Dispute> {
  const { data, error } = await supabase
    .from('disputes')
    .insert({
      order_item_id: orderItemId,
      initiator_id: initiatorId,
      reason,
      description,
      status: 'pending'
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // Automatically send the description as the first message
  try {
    await sendDisputeMessage(data.id, initiatorId, description);
  } catch (msgError) {
    console.error('Failed to send initial dispute message:', msgError);
  }

  return data as Dispute;
}

export async function getDisputesByUserId(userId: string): Promise<Dispute[]> {
  // RLS handles the security, ensuring users only see disputes they are involved in.
  // We fetch all disputes and let Supabase filter them based on the logged-in user.
  const { data, error } = await supabase
    .from('disputes')
    .select('*, order_item:order_items(*, product:products(*))')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Dispute[];
}

export async function getDisputeById(id: string): Promise<Dispute & { evidence: DisputeEvidence[] }> {
  const { data: dispute, error: disputeError } = await supabase
    .from('disputes')
    .select('*, order_item:order_items(*, product:products(*))')
    .eq('id', id)
    .single();

  if (disputeError) throw new Error(disputeError.message);

  const { data: evidence, error: evidenceError } = await supabase
    .from('dispute_evidence')
    .select('*')
    .eq('dispute_id', id);

  if (evidenceError) throw new Error(evidenceError.message);

  return { ...dispute, evidence: evidence || [] } as Dispute & { evidence: DisputeEvidence[] };
}

export async function addDisputeEvidence(
  disputeId: string,
  submitterId: string,
  type: 'image' | 'document' | 'message_log',
  url: string,
  description?: string
): Promise<DisputeEvidence> {
  const { data, error } = await supabase
    .from('dispute_evidence')
    .insert({
      dispute_id: disputeId,
      submitter_id: submitterId,
      evidence_type: type,
      evidence_url: url,
      description
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as DisputeEvidence;
}

export async function getDisputeEvidence(disputeId: string): Promise<DisputeEvidence[]> {
  const { data, error } = await supabase
    .from('dispute_evidence')
    .select('*')
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as DisputeEvidence[];
}

export async function updateDisputeStatus(
  disputeId: string,
  status: DisputeStatus,
  resolution?: string,
  adminNotes?: string
): Promise<Dispute> {
  const { data, error } = await supabase
    .from('disputes')
    .update({
      status,
      resolution,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', disputeId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Dispute;
}

export interface DisputeAccountStats {
  totalDisputes: number;
  pendingDisputes: number;
  underReviewDisputes: number;
  resolvedDisputes: number;
  closedDisputes: number;
  totalOrders?: number;
  totalProducts?: number;
  totalOrderItems?: number;
  firstDisputeDate?: string;
}

export async function getBuyerAccountStats(buyerId: string): Promise<DisputeAccountStats> {
  const { data, error } = await supabase
    .from('disputes')
    .select('status, created_at')
    .eq('initiator_id', buyerId);

  if (error) throw new Error(error.message);

  const stats = {
    totalDisputes: data?.length ?? 0,
    pendingDisputes: data?.filter((row) => row.status === 'pending').length ?? 0,
    underReviewDisputes: data?.filter((row) => row.status === 'under_review').length ?? 0,
    resolvedDisputes: data?.filter((row) => row.status === 'resolved').length ?? 0,
    closedDisputes: data?.filter((row) => row.status === 'closed').length ?? 0,
    firstDisputeDate: data?.length ? data[0].created_at : undefined,
  };

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id')
    .eq('buyer_id', buyerId);

  if (ordersError) throw new Error(ordersError.message);
  return { ...stats, totalOrders: orders?.length ?? 0 };
}

export async function getSellerAccountStats(sellerId: string): Promise<DisputeAccountStats> {
  const { data, error } = await supabase
    .from('disputes')
    .select('status, created_at, order_item:order_items!inner(seller_id)')
    .eq('order_item.seller_id', sellerId);

  if (error) throw new Error(error.message);

  const stats = {
    totalDisputes: data?.length ?? 0,
    pendingDisputes: data?.filter((row) => row.status === 'pending').length ?? 0,
    underReviewDisputes: data?.filter((row) => row.status === 'under_review').length ?? 0,
    resolvedDisputes: data?.filter((row) => row.status === 'resolved').length ?? 0,
    closedDisputes: data?.filter((row) => row.status === 'closed').length ?? 0,
    firstDisputeDate: data?.length ? data[0].created_at : undefined,
  };

  const [{ data: products, error: productsError }, { data: orderItems, error: orderItemsError }] = await Promise.all([
    supabase.from('products').select('id').eq('seller_id', sellerId),
    supabase.from('order_items').select('id').eq('seller_id', sellerId),
  ]);

  if (productsError) throw new Error(productsError.message);
  if (orderItemsError) throw new Error(orderItemsError.message);

  return {
    ...stats,
    totalProducts: products?.length ?? 0,
    totalOrderItems: orderItems?.length ?? 0,
  };
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_profile?: {
    email: string;
    role: string;
  };
}

export async function getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
  const { data, error } = await supabase
    .from('dispute_messages')
    .select('*')
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as DisputeMessage[];
}

export async function sendDisputeMessage(disputeId: string, senderId: string, message: string): Promise<DisputeMessage> {
  const { data, error } = await supabase
    .from('dispute_messages')
    .insert({
      dispute_id: disputeId,
      sender_id: senderId,
      message
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as DisputeMessage;
}
