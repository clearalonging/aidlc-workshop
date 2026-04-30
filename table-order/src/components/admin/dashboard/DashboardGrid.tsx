'use client';

import TableCard from './TableCard';
import type { TableWithOrders } from '@/lib/services/table-service';

interface DashboardGridProps {
  tables: TableWithOrders[];
  newOrderTableIds: Set<number>;
  onTableClick: (tableId: number) => void;
}

/**
 * 대시보드 테이블 그리드 컴포넌트
 * AS-03: 실시간 주문 목록 확인
 */
export default function DashboardGrid({
  tables,
  newOrderTableIds,
  onTableClick,
}: DashboardGridProps) {
  if (tables.length === 0) {
    return (
      <div
        className="text-center py-16 text-gray-400"
        data-testid="dashboard-grid-empty"
      >
        <p className="text-lg">등록된 테이블이 없습니다.</p>
        <p className="text-sm mt-1">테이블 관리에서 테이블을 추가해 주세요.</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      data-testid="dashboard-grid"
    >
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          isNew={newOrderTableIds.has(table.id)}
          onClick={onTableClick}
        />
      ))}
    </div>
  );
}
