'use client';

/**
 * 장바구니 유틸리티 (클라이언트 측 localStorage)
 * CS-05: 장바구니에 메뉴 추가
 * CS-06: 장바구니 수량 조절
 * CS-07: 장바구니 항목 삭제 및 비우기
 * CS-08: 장바구니 로컬 저장
 */

const CART_STORAGE_KEY = 'table-order-cart';

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

/**
 * localStorage에서 장바구니를 로드합니다.
 */
export function loadCart(): Cart {
  if (typeof window === 'undefined') {
    return { items: [], updatedAt: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(stored) as Cart;
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * 장바구니를 localStorage에 저장합니다.
 */
export function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return;
  cart.updatedAt = new Date().toISOString();
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/**
 * 장바구니에 메뉴를 추가합니다.
 * 이미 존재하는 메뉴는 수량을 1 증가시킵니다.
 */
export function addToCart(item: Omit<CartItem, 'quantity'>): Cart {
  const cart = loadCart();
  const existingIndex = cart.items.findIndex(
    (i) => i.menuItemId === item.menuItemId,
  );

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += 1;
  } else {
    cart.items.push({ ...item, quantity: 1 });
  }

  saveCart(cart);
  return cart;
}

/**
 * 장바구니 항목의 수량을 변경합니다.
 * 수량이 0 이하가 되면 항목을 제거합니다.
 */
export function updateQuantity(menuItemId: number, quantity: number): Cart {
  const cart = loadCart();

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.menuItemId !== menuItemId);
  } else {
    const item = cart.items.find((i) => i.menuItemId === menuItemId);
    if (item) {
      item.quantity = quantity;
    }
  }

  saveCart(cart);
  return cart;
}

/**
 * 장바구니에서 특정 항목을 제거합니다.
 */
export function removeFromCart(menuItemId: number): Cart {
  const cart = loadCart();
  cart.items = cart.items.filter((i) => i.menuItemId !== menuItemId);
  saveCart(cart);
  return cart;
}

/**
 * 장바구니를 비웁니다.
 */
export function clearCart(): Cart {
  const cart: Cart = { items: [], updatedAt: new Date().toISOString() };
  saveCart(cart);
  return cart;
}

/**
 * 장바구니 총 금액을 계산합니다.
 */
export function getCartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * 장바구니 총 수량을 계산합니다.
 */
export function getCartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
