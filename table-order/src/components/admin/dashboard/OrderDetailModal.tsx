'use client';

import { useState } from 'react';
import type { TableWithOrders, OrderSummary } from '@/lib/services/table-service';

interface OrderDetailModalProps {
  table: TableWithOrders;
  onClose: () => void;
  onOrderUpdated: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  PREPARING: '준비중',
  COMPLETED: '완료',
};

const STATUS_NEXT: Record<string, string | null> = {
  PENDING: 'PREPARING',
  PREPARING: 'COMPLETED',
  COMPLETED: null,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

/**
 * 주문 상세 모달 컴포넌트
 * AS-04: 주문 상세 보기
 * AS-05: 주문 상태 변경
 * AS-08: 주문 삭제
 */
export default function OrderDetailModal({
  table,
  onClose,
  onOrderUpdated,
}: OrderDetailModalProps) {
  const [deleteConfirmOrderId, setDeleteConfirmOrderId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('adminToken');

  // 주문 상태 변경 (AS-05)
  const handleStatusChange = async (order: OrderSummary) => {
    const nextStatus = STATUS_NEXT[order.status];
    if (!nextStatus) return;

    const token = getToken();
    if (!token) return;

    setIsUpdating(order.id);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message ?? '상태 변경에 실패했습니다.');
        return;
      }

      onOrderUpdated();
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(null);
    }
  };

  // 주문 삭제 (AS-08)
  const handleDeleteOrder = async (orderId: number) => {
    const token = getToken();
    if (!token) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message ?? '주문 삭제에 실패했습니다.');
        return;
      }

      setDeleteConfirmOrderId(null);
      onOrderUpdated();
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* 모달 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
        onClick={onClose}
        data-testid="order-detail-modal-overlay"
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          data-testid="order-detail-modal"
        >
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-800">
              {table.tableNumber}번 테이블 주문 내역
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              data-testid="order-detail-modal-close-button"
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div
              role="alert"
              className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
              data-testid="order-detail-error-message"
            >
              {error}
            </div>
          )}

          {/* 주문 목록 */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {table.currentOrders.length === 0 ? (
              <p className="text-center text-gray-400 py-8">주문이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {table.currentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4"
                    data-testid={`order-item-${order.id}`}
                  >
                    {/* 주문 헤더 */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-medium text-gray-800">
                          {order.orderNumber}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString('ko-KR')}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}
                        data-testid={`order-status-badge-${order.id}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    {/* 주문 항목 */}
                    <ul className="text-sm text-gray-600 space-y-1 mb-3">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>
                            {item.menuItemName} × {item.quantity}
                          </span>
                          <span>
                            {(item.unitPrice * item.quantity).toLocaleString()}원
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* 합계 */}
                    <div className="flex justify-between font-semibold text-sm border-t pt-2">
                      <span>합계</span>
                      <span>{order.totalAmount.toLocaleString()}원</span>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 mt-3 justify-end">
                      {STATUS_NEXT[order.status] && (
                        <button
                          onClick={() => handleStatusChange(order)}
                          disabled={isUpdating === order.id}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          data-testid={`order-status-change-button-${order.id}`}
                        >
                          {isUpdating === order.id
                            ? '변경 중...'
                            : `→ ${STATUS_LABELS[STATUS_NEXT[order.status]!]}`}
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirmOrderId(order.id)}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                        data-testid={`order-delete-button-${order.id}`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 모달 푸터 */}
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">
              총 {table.totalAmount.toLocaleString()}원
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              data-testid="order-detail-modal-footer-close-button"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 삭제 확인 팝업 (AS-08) */}
      {deleteConfirmOrderId !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          data-testid="delete-confirm-modal"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              주문 삭제
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              이 주문을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmOrderId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                data-testid="delete-confirm-cancel-button"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteConfirmOrderId)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50"
                data-testid="delete-confirm-ok-button"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
