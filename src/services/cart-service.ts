import { supabase } from '@/lib/supabase';
import { CartItem, Product } from '@/types';
import { attachSellersToProducts, getProfilesByIds } from '@/services/profile-utils';

interface CartData {
  id: string;
  buyer_id: string;
}

const CART_PRODUCT_SELECT = '*, category:categories(id, name)';

async function hydrateCartItems(items: CartItem[]): Promise<CartItem[]> {
  const products = items.map((item) => item.product).filter(Boolean) as Product[];
  const sellers = await getProfilesByIds(products.map((p) => p.seller_id));
  const hydratedProducts = attachSellersToProducts(products, sellers);
  const productMap: Record<string, Product> = {};
  hydratedProducts.forEach((p) => { productMap[p.id] = p; });
  return items.map((item) => {
    const productId = item.product_id ?? item.product?.id;
    if (productId && productMap[productId]) {
      return { ...item, product: productMap[productId] };
    }
    return item;
  });
}

async function assertProductCanBePurchased(productId: string): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .select('id, is_active, seller_id')
    .eq('id', productId)
    .single();

  if (error || !data || !data.is_active) {
    throw new Error('This product is not available for purchase.');
  }

  const sellers = await getProfilesByIds([(data as any).seller_id], 'id, role');
  const seller = sellers[(data as any).seller_id];
  if (!seller || seller.role !== 'seller') {
    throw new Error('This seller is currently unavailable.');
  }
}

export async function getOrCreateCart(buyerId: string): Promise<CartData> {
  const { data, error } = await supabase
    .from('carts')
    .select('id, buyer_id')
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (error) {
    if (/could not find the table|relation ".*" does not exist/i.test(error.message)) {
      throw new Error(
        'Database table "carts" not found. Run the database migrations or create the `carts` table in Supabase.'
      );
    }
    throw new Error(error.message);
  }
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from('carts')
    .insert({ buyer_id: buyerId })
    .select('id, buyer_id')
    .single();
  if (createError) {
    if (/could not find the table|relation ".*" does not exist/i.test(createError.message)) {
      throw new Error(
        'Database table "carts" not found. Run the database migrations or create the `carts` table in Supabase.'
      );
    }
    throw new Error(createError.message);
  }
  return created;
}

export async function getCartItems(buyerId: string): Promise<CartItem[]> {
  const cart = await getOrCreateCart(buyerId);

  const { data, error } = await supabase
    .from('cart_items')
    .select(`id, cart_id, product_id, quantity, product:products(${CART_PRODUCT_SELECT})`)
    .eq('cart_id', cart.id);
  if (error) {
    if (/could not find the table|relation ".*" does not exist/i.test(error.message)) {
      throw new Error(
        'Database table "cart_items" not found. Run the database migrations or create the `cart_items` table in Supabase.'
      );
    }
    throw new Error(error.message);
  }
  const items = await hydrateCartItems((data || []) as unknown as CartItem[]);
  const invalidItemIds = items
    .filter((item) => {
      const product = item.product;
      const seller = product?.seller;
      return !product || !product.is_active || seller?.role !== 'seller';
    })
    .map((item) => item.id);

  if (invalidItemIds.length > 0) {
    await supabase
      .from('cart_items')
      .delete()
      .in('id', invalidItemIds);
  }

  return items.filter((item) => !invalidItemIds.includes(item.id));
}

export async function addProductToCart(buyerId: string, productId: string, quantity = 1): Promise<CartItem> {
  const cart = await getOrCreateCart(buyerId);
  await assertProductCanBePurchased(productId);

  const { data: existingItem, error: fetchError } = await supabase
    .from('cart_items')
    .select(`id, cart_id, product_id, quantity, product:products(${CART_PRODUCT_SELECT})`)
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (fetchError) {
    if (/could not find the table|relation ".*" does not exist/i.test(fetchError.message)) {
      throw new Error(
        'Database table "cart_items" not found. Run the database migrations or create the `cart_items` table in Supabase.'
      );
    }
    throw new Error(fetchError.message);
  }

  if (existingItem) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id)
      .select(`id, cart_id, product_id, quantity, product:products(${CART_PRODUCT_SELECT})`)
      .single();

    if (error) {
      if (/could not find the table|relation ".*" does not exist/i.test(error.message)) {
        throw new Error(
          'Database table "cart_items" not found. Run the database migrations or create the `cart_items` table in Supabase.'
        );
      }
      throw new Error(error.message);
    }
    const [hydrated] = await hydrateCartItems([data as unknown as CartItem]);
    return hydrated;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({ cart_id: cart.id, product_id: productId, quantity })
    .select(`id, cart_id, product_id, quantity, product:products(${CART_PRODUCT_SELECT})`)
    .single();
  if (error) {
    if (/could not find the table|relation ".*" does not exist/i.test(error.message)) {
      throw new Error(
        'Database table "cart_items" not found. Run the database migrations or create the `cart_items` table in Supabase.'
      );
    }
    throw new Error(error.message);
  }
  const [hydrated] = await hydrateCartItems([data as unknown as CartItem]);
  return hydrated;
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItem | null> {
  if (quantity <= 0) {
    await removeCartItem(itemId);
    return null;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select(`id, cart_id, product_id, quantity, product:products(${CART_PRODUCT_SELECT})`)
    .single();
  if (error) {
    if (/could not find the table|relation ".*" does not exist/i.test(error.message)) {
      throw new Error(
        'Database table "cart_items" not found. Run the database migrations or create the `cart_items` table in Supabase.'
      );
    }
    throw new Error(error.message);
  }
  const [hydrated] = await hydrateCartItems([data as unknown as CartItem]);
  return hydrated;
}

export async function removeCartItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);
  if (error) {
    if (/could not find the table|relation ".*" does not exist/i.test(error.message)) {
      throw new Error(
        'Database table "cart_items" not found. Run the database migrations or create the `cart_items` table in Supabase.'
      );
    }
    throw new Error(error.message);
  }
}

export async function clearCart(buyerId: string): Promise<void> {
  const cart = await getOrCreateCart(buyerId);
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.id);
  if (error) {
    if (/could not find the table|relation ".*" does not exist/i.test(error.message)) {
      throw new Error(
        'Database table "cart_items" not found. Run the database migrations or create the `cart_items` table in Supabase.'
      );
    }
    throw new Error(error.message);
  }
}
