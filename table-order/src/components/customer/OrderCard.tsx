'use client';

/**
 * 주문 카드 컴포넌트
 * CS-12: 현재 세션 주문 내역 조회
 * CS-13: 주문 상태 확인
 */

interface OrderItem {
  id: number;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
}

interface OrderCardProps {
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
  PREPARING: { label: '준비중', color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-800' },
};

export default function OrderCard({
  orderNumber,
  status,
  totalAmount,
  createdAt,
  items,
}: OrderCardProps) {
  const statusInfo = STATUS_MAP[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800',
  };

  const formattedTime = new Date(createdAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-50">
        <div>
          <span className="text-xs text-gray-500">{orderNumber}</span>
          <span className="text-xs text-gray-400 ml-2">{formattedTime}</span>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.color}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* 주문 항목 */}
      <div className="p-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.menuItemName}{' '}
              <span className="text-gray-400">x{item.quantity}</span>
            </span>
            <span className="text-gray-900 font-medium">
              {(item.unitPrice * item.quantity).toLocaleString()}원
            </span>
          </div>
        ))}
      </div>

      {/* 합계 */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
        <span className="text-sm font-medium text-gray-600">합계</span>
        <span className="font-bold text-blue-600">
          {totalAmount.toLocaleString()}원
        </span>
      </div>
    </div>
  );
}
