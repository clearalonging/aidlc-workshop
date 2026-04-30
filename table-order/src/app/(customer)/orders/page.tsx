'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import OrderCard from '@/components/customer/OrderCard';

/**
 * 주문 내역 페이지
 * CS-12: 현재 세션 주문 내역 조회
 * CS-13: 주문 상태 확인
 */

interface OrderItem {
  id: number;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setIsLoading(true);
      setError('');
      const result = await apiFetch<{ success: boolean; data: Order[] }>(
        '/api/orders',
      );
      setOrders(result.data);
    } catch (err) {
      setError('주문 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  // 총 주문 금액 계산
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">주문 내역 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">📋 주문 내역</h1>
          <button
            onClick={fetchOrders}
            className="text-sm text-blue-600 hover:text-blue-700 min-h-[44px] flex items-center"
            aria-label="새로고침"
          >
            🔄 새로고침
          </button>
        </div>
        {orders.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            총 {orders.length}건 · {totalSpent.toLocaleString()}원
          </div>
        )}
      </header>

      {/* 주문 목록 */}
      <div className="flex-1 p-4">
        {error ? (
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 min-h-[44px]"
            >
              다시 시도
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-gray-400">
            <span className="text-4xl mb-3">📋</span>
            <p>아직 주문 내역이 없습니다.</p>
            <p className="text-sm mt-1">메뉴에서 주문해 보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                orderNumber={order.orderNumber}
                status={order.status}
                totalAmount={order.totalAmount}
                createdAt={order.createdAt}
                items={order.items}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
