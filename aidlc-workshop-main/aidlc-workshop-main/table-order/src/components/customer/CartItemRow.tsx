'use client';

import type { CartItem } from '@/lib/cart';

/**
 * 장바구니 항목 행 컴포넌트
 * CS-06: 장바구니 수량 조절
 * CS-07: 장바구니 항목 삭제
 */

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export default function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
      {/* 이미지 */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
            🍽️
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 text-sm truncate">
          {item.name}
        </h3>
        <p className="text-blue-600 font-semibold text-sm mt-1">
          {(item.price * item.quantity).toLocaleString()}원
        </p>
      </div>

      {/* 수량 조절 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.quantity - 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 min-w-[44px] min-h-[44px]"
          aria-label={`${item.name} 수량 감소`}
        >
          −
        </button>
        <span className="w-6 text-center font-medium text-sm">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.quantity + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 min-w-[44px] min-h-[44px]"
          aria-label={`${item.name} 수량 증가`}
        >
          +
        </button>
      </div>

      {/* 삭제 */}
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={`${item.name} 삭제`}
      >
        🗑️
      </button>
    </div>
  );
}
