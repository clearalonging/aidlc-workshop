'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartTotal,
  getCartItemCount,
  type Cart,
  type CartItem,
} from '@/lib/cart';
import { apiFetch, ApiError } from '@/lib/api-client';
import CartItemRow from '@/components/customer/CartItemRow';

/**
 * 장바구니 페이지
 * CS-05 ~ CS-11: 장바구니 관리 및 주문 확정
 */

interface OrderResponse {
  success: boolean;
  data: {
    id: number;
    orderNumber: string;
    status: string;
    totalAmount: number;
  };
  message: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({ items: [], updatedAt: '' });
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    orderNumber?: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    setCart(loadCart());
  }, []);

  function handleUpdateQuantity(menuItemId: number, quantity: number) {
    const updated = updateQuantity(menuItemId, quantity);
    setCart(updated);
  }

  function handleRemove(menuItemId: number) {
    const updated = removeFromCart(menuItemId);
    setCart(updated);
  }

  function handleClearCart() {
    if (cart.items.length === 0) return;
    if (confirm('장바구니를 비우시겠습니까?')) {
      const updated = clearCart();
      setCart(updated);
    }
  }

  async function handleOrder() {
    if (cart.items.length === 0) {
      setOrderResult({
        success: false,
        message: '장바구니가 비어있습니다.',
      });
      return;
    }

    setIsOrdering(true);
    setOrderResult(null);

    try {
      const result = await apiFetch<OrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.items.map((item: CartItem) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
        }),
      });

      // 주문 성공: 장바구니 비우기 (CS-10)
      clearCart();
      setCart({ items: [], updatedAt: '' });
      setOrderResult({
        success: true,
        orderNumber: result.data.orderNumber,
        message: result.message,
      });

      // 3초 후 메뉴 화면으로 리다이렉트
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err) {
      // 주문 실패: 장바구니 유지 (CS-11)
      const message =
        err instanceof ApiError
          ? err.message
          : '주문에 실패했습니다. 다시 시도해 주세요.';
      setOrderResult({ success: false, message });
    } finally {
      setIsOrdering(false);
    }
  }

  const total = getCartTotal(cart);
  const itemCount = getCartItemCount(cart);

  // 주문 성공 화면
  if (orderResult?.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          주문이 완료되었습니다!
        </h2>
        <p className="text-gray-500 mb-4">{orderResult.message}</p>
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600">주문 번호</p>
          <p className="text-lg font-bold text-blue-600">
            {orderResult.orderNumber}
          </p>
        </div>
        <p className="text-sm text-gray-400">
          잠시 후 메뉴 화면으로 이동합니다...
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 min-h-[44px]"
        >
          메뉴로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">🛒 장바구니</h1>
          {cart.items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-500 hover:text-red-600 min-h-[44px] flex items-center"
            >
              전체 삭제
            </button>
          )}
        </div>
      </header>

      {/* 장바구니 내용 */}
      <div className="flex-1 p-4">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-gray-400">
            <span className="text-4xl mb-3">🛒</span>
            <p>장바구니가 비어있습니다.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 min-h-[44px]"
            >
              메뉴 보러 가기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.items.map((item: CartItem) => (
              <CartItemRow
                key={item.menuItemId}
                item={item}
                onUpdateQuantity={(qty) =>
                  handleUpdateQuantity(item.menuItemId, qty)
                }
                onRemove={() => handleRemove(item.menuItemId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {orderResult && !orderResult.success && (
        <div className="mx-4 mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg" role="alert">
          {orderResult.message}
        </div>
      )}

      {/* 하단 주문 바 */}
      {cart.items.length > 0 && (
        <div className="sticky bottom-16 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">
              총 {itemCount}개 항목
            </span>
            <span className="text-xl font-bold text-gray-900">
              {total.toLocaleString()}원
            </span>
          </div>
          <button
            onClick={handleOrder}
            disabled={isOrdering}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {isOrdering ? '주문 처리 중...' : `${total.toLocaleString()}원 주문하기`}
          </button>
        </div>
      )}
    </div>
  );
}
