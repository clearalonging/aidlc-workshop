'use client';

import type { TableWithOrders } from '@/lib/services/table-service';

interface TableCardProps {
  table: TableWithOrders;
  isNew: boolean;
  onClick: (tableId: number) => void;
}

/**
 * 테이블 카드 컴포넌트
 * AS-03: 실시간 주문 목록 확인
 * AS-06: 신규 주문 시각적 알림
 */
export default function TableCard({ table, isNew, onClick }: TableCardProps) {
  const latestOrder = table.currentOrders[0] ?? null;
  const hasOrders = table.currentOrders.length > 0;

  return (
    <button
      onClick={() => onClick(table.id)}
      className={[
        'w-full text-left p-4 rounded-lg border-2 shadow-sm transition-all duration-300 cursor-pointer',
        isNew
          ? 'border-red-400 bg-red-50 animate-pulse'
          : hasOrders
          ? 'border-blue-300 bg-white hover:border-blue-500 hover:shadow-md'
          : 'border-gray-200 bg-gray-50 hover:border-gray-400',
      ].join(' ')}
      data-testid={`table-card-${table.tableNumber}`}
      aria-label={`테이블 ${table.tableNumber}번 - ${hasOrders ? `${table.currentOrders.length}건 주문` : '주문 없음'}`}
    >
      {/* 테이블 번호 + 신규 주문 배지 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-gray-800">
          {table.tableNumber}번
        </span>
        {isNew && (
          <span
            className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full"
            data-testid={`table-card-new-badge-${table.tableNumber}`}
          >
            NEW
          </span>
        )}
      </div>

      {/* 주문 요약 */}
      {hasOrders ? (
        <>
          <div className="text-sm text-gray-600 mb-1">
            주문 {table.currentOrders.length}건
          </div>
          <div className="text-base font-semibold text-blue-700">
            {table.totalAmount.toLocaleString()}원
          </div>
          {latestOrder && (
            <div
              className="mt-2 text-xs text-gray-500 truncate"
              data-testid={`table-card-latest-order-${table.tableNumber}`}
            >
              최근: {latestOrder.items[0]?.menuItemName ?? ''}
              {latestOrder.items.length > 1
                ? ` 외 ${latestOrder.items.length - 1}개`
                : ''}
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-gray-400">주문 없음</div>
      )}
    </button>
  );
}
