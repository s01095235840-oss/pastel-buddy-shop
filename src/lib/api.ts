import { supabase } from './supabase';
import { Product, products as localProducts } from '@/data/products';

/**
 * 제품 관련 API 함수들
 */

// 모든 활성화된 제품 가져오기
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }

  return data || [];
}

// 특정 제품 가져오기
export async function fetchProductById(id: number): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data;
}

// 카테고리별 제품 가져오기
export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }

  return data || [];
}

// 랜덤 상품 추천 (카테고리 선택사항)
export async function fetchRandomProducts(count: number = 3, category?: string): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    // 카테고리가 있으면 필터링
    if (category) {
      query = query.eq('category', category);
    }

    // 모든 상품 가져오기
    const { data: allProducts, error } = await query;

    if (error) {
      console.error('Error fetching products for recommendations:', error);
      throw error;
    }

    if (!allProducts || allProducts.length === 0) {
      return [];
    }

    // 랜덤으로 섞기
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    
    // 요청한 개수만큼 반환 (최대 3개)
    return shuffled.slice(0, Math.min(count, shuffled.length));
  } catch (error) {
    console.error('Error fetching random products:', error);
    throw error;
  }
}

// 상품 이름으로 검색 (Supabase에서 직접 검색, 실패 시 로컬 데이터 사용)
export async function searchProducts(query: string): Promise<Product[]> {
  const searchTerm = query.trim().toLowerCase();
  
  if (!searchTerm) {
    return [];
  }

  try {
    // Supabase에서 검색 시도 (각각 필터링 후 합치기 - 더 안정적)
    const searchPattern = `%${searchTerm}%`;
    
    // name과 description에서 각각 검색 후 합치기
    const [nameResults, descResults] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('name', searchPattern)
        .order('id', { ascending: true }),
      supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('description', searchPattern)
        .order('id', { ascending: true }),
    ]);

    // 오류가 있으면 로컬 데이터로 fallback
    if (nameResults.error || descResults.error) {
      console.warn('Supabase 검색 오류, 로컬 데이터 사용:', nameResults.error || descResults.error);
      return searchLocalProducts(searchTerm);
    }

    // 두 결과를 합치고 중복 제거
    const allResults = [
      ...(nameResults.data || []),
      ...(descResults.data || []),
    ];
    
    // ID 기준으로 중복 제거
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.id, item])).values()
    );
    
    // 결과가 있으면 반환, 없으면 로컬 데이터로 fallback
    if (uniqueResults.length > 0) {
      return uniqueResults;
    }
    
    console.warn('Supabase에 검색 결과가 없어 로컬 데이터 사용');
    return searchLocalProducts(searchTerm);
    
  } catch (error) {
    console.error('Supabase 검색 예외 발생, 로컬 데이터 사용:', error);
    // Supabase 오류 시 로컬 데이터로 fallback
    return searchLocalProducts(searchTerm);
  }
}

// 로컬 products 데이터에서 검색 (fallback)
function searchLocalProducts(searchTerm: string): Product[] {
  return localProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
  );
}

/**
 * 장바구니 관련 API 함수들
 */

export interface CartItem {
  id: string;
  user_id: string;
  product_id: number;
  quantity: number;
  product?: Product;
}

// 장바구니 아이템 가져오기
export async function fetchCartItems(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching cart items:', error);
    throw error;
  }

  return data || [];
}

// 장바구니에 상품 추가
export async function addToCart(userId: string, productId: number, quantity: number = 1) {
  // 이미 장바구니에 있는지 확인
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  if (existing) {
    // 수량 증가
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // 새로 추가
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity });

    if (error) throw error;
  }
}

// 장바구니 수량 업데이트
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);

  if (error) throw error;
}

// 장바구니에서 삭제
export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (error) throw error;
}

// 장바구니 비우기
export async function clearCart(userId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * 주문 관련 API 함수들
 */

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  status: string;
  shipping_address?: string;
  phone?: string;
  payment_key?: string;
  payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

// 주문 생성
export async function createOrder(
  userId: string,
  totalAmount: number,
  items: { product_id: number; product_name: string; product_price: number; quantity: number }[],
  shippingAddress?: string,
  phone?: string
) {
  // 주문 번호 생성
  const { data: orderNumberData, error: orderNumberError } = await supabase
    .rpc('generate_order_number');

  if (orderNumberError) throw orderNumberError;

  const orderNumber = orderNumberData;

  // 주문 생성
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      total_amount: totalAmount,
      status: 'pending',
      shipping_address: shippingAddress,
      phone: phone,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 주문 상품 추가
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_price: item.product_price,
    quantity: item.quantity,
    subtotal: item.product_price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  return order;
}

// 사용자의 주문 목록 가져오기
export async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

// 특정 주문의 상품 목록 가져오기
export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (error) throw error;

  return data || [];
}

// 결제 완료 시 주문 상태 업데이트
export async function updateOrderPayment(
  orderId: string,
  paymentKey: string,
  paymentId: string,
  status: string = 'completed'
) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      payment_key: paymentKey,
      payment_id: paymentId,
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
