import { supabase } from '@/lib/supabase';
import { BuyerOrder, CartItem, Order, OrderItem } from '@/types';
import { clearCart } from '@/services/cart-service';
import { getProfilesByIds } from '@/services/profile-utils';

async function assertOrderItemsArePurchasable(items: CartItem[]): Promise<void> {
  const productIds = Array.from(
    new Set(
      items
        .map((item) => item.product_id ?? item.product?.id)
        .filter(Boolean)
    )
  ) as string[];

  if (productIds.length === 0) {
    throw new Error('Cart is empty');
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, is_active, seller_id')
    .in('id', productIds);

  if (error) throw new Error(error.message);

  const products = data || [];
  if (products.length !== productIds.length) {
    throw new Error('Some products are no longer available.');
  }

  const sellerIds = (products || []).map((p: any) => p.seller_id).filter(Boolean);
  const sellers = await getProfilesByIds(sellerIds, 'id, role');

  const blockedProduct = products.find((product: any) => {
    const seller = sellers[product.seller_id];
    return !product.is_active || !seller || seller.role !== 'seller';
  });

  if (blockedProduct) {
    throw new Error('One or more items are no longer available for purchase.');
  }
}

export async function createPendingOrder(
  buyerId: string, 
  items: CartItem[], 
  paymentPhone?: string
): Promise<Order> {
  if (!items || items.length === 0) {
      throw new Error('Cart is empty');
  }

  await assertOrderItemsArePurchasable(items);

  const totalPrice = items.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  // 1. Create the Order in 'pending' status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ 
      buyer_id: buyerId, 
      total_price: totalPrice, 
      status: 'pending',
      payment_phone: paymentPhone
    })
    .select('*')
    .single();

  if (orderError) throw new Error(orderError.message);

  // 2. Create Order Items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id ?? item.product?.id,
    quantity: item.quantity,
    unit_price: item.product?.price ?? 0,
    seller_id: item.product?.seller_id ?? null,
    seller_status: 'pending',
  }));

  const missingSellerIds = orderItems.filter((it) => !it.seller_id).map((it) => it.product_id);
  if (missingSellerIds.length > 0) {
    const { data: productsData } = await supabase
      .from('products')
      .select('id, seller_id')
      .in('id', missingSellerIds);
    const sellerMap: Record<string, string> = {};
    (productsData || []).forEach((p: any) => { sellerMap[p.id] = p.seller_id; });
    orderItems.forEach((it) => {
      if (!it.seller_id) it.seller_id = sellerMap[it.product_id] ?? null;
    });
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw new Error(itemsError.message);

  // Note: We don't clear the cart yet. We clear it when payment is successful.
  // This allows the user to try again easily if the payment initiation fails.
  
  return order as Order;
}

export async function markOrderAsPaid(orderId: string, paymentReference: string, buyerId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'paid',
      payment_reference: paymentReference,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) throw new Error(error.message);

  // Payment successful, now clear the cart
  await clearCart(buyerId);
}

export async function createOrderFromCart(
  buyerId: string, 
  items: CartItem[], 
  paymentReference?: string
): Promise<Order> {
  if (!items || items.length === 0) {
      throw new Error('Cart is empty');
  }

  await assertOrderItemsArePurchasable(items);

  const totalPrice = items.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ 
      buyer_id: buyerId, 
      total_price: totalPrice, 
      status: 'paid', // Mark as paid since we only call this after successful payment
      payment_reference: paymentReference 
    })
    .select('*')
    .single();

    if (orderError) {
      if (/could not find the table|relation ".*" does not exist/i.test(orderError.message)) {
        throw new Error(
          'Database table "orders" not found. Run the database migrations or create the `orders` table in Supabase.'
        );
      }
      throw new Error(orderError.message);
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id ?? item.product?.id,
    quantity: item.quantity,
    unit_price: item.product?.price ?? 0,
    seller_id: item.product?.seller_id ?? null,
    seller_status: 'pending',
  }));

  // Ensure we have seller_id for every order item. If some items lack product.seller_id, fetch them in batch.
  const missingSellerIds = orderItems.filter((it) => !it.seller_id).map((it) => it.product_id);
  if (missingSellerIds.length > 0) {
    const { data: productsData } = await supabase
      .from('products')
      .select('id, seller_id')
      .in('id', missingSellerIds);
    const sellerMap: Record<string, string> = {};
    (productsData || []).forEach((p: any) => { sellerMap[p.id] = p.seller_id; });
    orderItems.forEach((it) => {
      if (!it.seller_id) it.seller_id = sellerMap[it.product_id] ?? null;
    });
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
      if (/could not find the table|relation ".*" does not exist/i.test(itemsError.message)) {
        throw new Error(
          'Database table "order_items" not found. Run the database migrations or create the `order_items` table in Supabase.'
        );
      }
    throw new Error(itemsError.message);
  }

  await clearCart(buyerId);

  return order as Order;
}

export async function getOrdersByBuyerId(buyerId: string): Promise<BuyerOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*)), buyer:profiles!buyer_id(*)')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    buyer_id: row.buyer_id,
    status: row.status,
    total_price: row.total_price,
    payment_phone: row.payment_phone,
    payment_reference: row.payment_reference,
    created_at: row.created_at,
    buyer: row.buyer,
    items: (row.order_items || []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      seller_id: item.seller_id,
      seller_status: item.seller_status,
      product: item.product,
    })),
  }));
}

// Get aggregated orders and items relevant to a seller (orders that include at least one item from this seller)
export async function getOrdersForSeller(sellerId: string): Promise<Array<{ order: Order; items: OrderItem[] }>> {
  // fetch order_items with joined product and order data
  const { data, error } = await supabase
    .from('order_items')
    .select('*, order:orders(*, buyer:profiles!buyer_id(*)), product:products(*)')
    .eq('seller_id', sellerId);

  if (error) throw new Error(error.message);

  const rows = (data || []) as any[];

  const sellerItems = rows.filter((r) => r.order && (r.seller_id === sellerId || r.product?.seller_id === sellerId));

  // group by order
  const grouped: Record<string, { order: Order; items: OrderItem[] }> = {};
  for (const row of sellerItems) {
    const o: Order = {
      ...row.order,
      buyer: row.order.buyer
    };
    const item: OrderItem = {
      id: row.id,
      order_id: row.order_id,
      product_id: row.product_id,
      quantity: row.quantity,
      unit_price: row.unit_price,
      seller_id: row.seller_id ?? row.product?.seller_id,
      seller_status: row.seller_status,
      product: row.product,
    };

    if (!grouped[o.id]) grouped[o.id] = { order: o, items: [] };
    grouped[o.id].items.push(item);
  }

  return Object.values(grouped);
}

export async function updateOrderItemStatus(itemId: string, status: string): Promise<OrderItem> {
  const { data, error } = await supabase
    .from('order_items')
    .update({ seller_status: status })
    .eq('id', itemId)
    .select('*')
    .single();

  if (error) {
    if (/could not find the table|relation ".*" does not exist/i.test(error.message)) {
      throw new Error('Database table "order_items" not found. Run the database migrations.');
    }
    throw new Error(error.message);
  }

  return data as OrderItem;
}

export async function getBuyerOrderById(orderId: string): Promise<BuyerOrder | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*)), buyer:profiles!buyer_id(*)')
    .eq('id', orderId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    buyer_id: data.buyer_id,
    status: data.status,
    total_price: data.total_price,
    payment_phone: data.payment_phone,
    payment_reference: data.payment_reference,
    created_at: data.created_at,
    buyer: data.buyer,
    items: (data.order_items || []).map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      seller_id: item.seller_id,
      seller_status: item.seller_status,
      product: item.product,
    })),
  };
}
