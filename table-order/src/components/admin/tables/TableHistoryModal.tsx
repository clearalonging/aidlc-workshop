'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TableHistorySession } from '@/lib/services/table-service';

interface TableHistoryModalProps {
  tableId: number;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  PREPARING: '준비중',
  COMPLETED: '완료',
};

/**
 * 테이블 과거 주문 내역 모달 컴포넌트
 * AS-10: 과거 주문 내역 조회
 */
export default function TableHistoryModal({
  tableId,
  onClose,
}: TableHistoryModalProps) {
  const [history, setHistory] = useState<TableHistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadHistory = useCallback(
    async (from?: string, to?: string) => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (from) params.set('dateFrom', new Date(from).toISOString());
        if (to) params.set('dateTo', new Date(to + 'T23:59:59').toISOString());

        const url = `/api/admin/tables/${tableId}/history${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.message ?? '내역을 불러오는 중 오류가 발생했습니다.');
          return;
        }

        setHistory(data.data);
      } catch {
        setError('서버와 통신 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [tableId],
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFilter = () => {
    loadHistory(dateFrom || undefined, dateTo || undefined);
  };

  const handleResetFilter = () => {
    setDateFrom('');
    setDateTo('');
    loadHistory();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-testid="table-history-modal"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">과거 주문 내역</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            data-testid="table-history-close-button"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 날짜 필터 (AS-10 Scenario 2) */}
        <div className="px-6 py-3 border-b bg-gray-50 flex flex-wrap gap-3 items-end">
          <div>
            <label
              htmlFor="dateFrom"
              className="block text-xs text-gray-500 mb-1"
            >
              시작 날짜
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid="table-history-date-from-input"
            />
          </div>
          <div>
            <label
              htmlFor="dateTo"
              className="block text-xs text-gray-500 mb-1"
            >
              종료 날짜
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              data-testid="table-history-date-to-input"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            data-testid="table-history-filter-button"
          >
            조회
          </button>
          <button
            onClick={handleResetFilter}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            data-testid="table-history-reset-button"
          >
            초기화
          </button>
        </div>

        {/* 내역 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="text-center text-gray-400 py-8" data-testid="table-history-loading">
              로딩 중...
            </p>
          ) : error ? (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
              data-testid="table-history-error"
            >
              {error}
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-400 py-8" data-testid="table-history-empty">
              과거 주문 내역이 없습니다.
            </p>
          ) : (
            <div className="space-y-6" data-testid="table-history-list">
              {history.map((session) => (
                <div
                  key={session.sessionId}
                  className="border rounded-lg overflow-hidden"
                  data-testid={`history-session-${session.sessionId}`}
                >
                  {/* 세션 헤더 */}
                  <div className="bg-gray-50 px-4 py-2 flex justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(session.startedAt).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(session.completedAt).toLocaleTimeString('ko-KR')} 이용 완료
                    </span>
                    <span className="font-semibold text-gray-800">
                      합계 {session.totalAmount.toLocaleString()}원
                    </span>
                  </div>

                  {/* 주문 목록 */}
                  <div className="divide-y">
                    {session.orders.map((order) => (
                      <div key={order.id} className="px-4 py-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString('ko-KR')}
                          </span>
                        </div>
                        <ul className="text-xs text-gray-500 space-y-0.5">
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
                        <div className="flex justify-between text-xs font-medium mt-1 pt-1 border-t">
                          <span>{STATUS_LABELS[order.status]}</span>
                          <span>{order.totalAmount.toLocaleString()}원</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            data-testid="table-history-footer-close-button"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
