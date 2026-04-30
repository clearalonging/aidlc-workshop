'use client';

import MenuOrderButtons from './MenuOrderButtons';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
}

interface MenuTableRowProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function MenuTableRow({ item, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: MenuTableRowProps) {
  const formattedPrice = new Intl.NumberFormat('ko-KR').format(item.price);
  const formattedDate = new Date(item.createdAt).toLocaleDateString('ko-KR');

  return (
    <tr data-testid={`menu-row-${item.id}`} className="hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4">
        <MenuOrderButtons onMoveUp={onMoveUp} onMoveDown={onMoveDown} disableUp={isFirst} disableDown={isLast} />
      </td>
      <td className="py-3 px-4">
        <span className="font-medium text-gray-900 text-sm">{item.name}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-semibold text-gray-700 tabular-nums">{formattedPrice}원</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          item.isAvailable
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
            : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
        }`}>
          {item.isAvailable ? '판매중' : '품절'}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-xs text-gray-400">{formattedDate}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2 justify-center">
          <button
            data-testid={`menu-row-${item.id}-edit-button`}
            onClick={onEdit}
            className="px-3 py-1.5 min-h-[36px] text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors ring-1 ring-indigo-700/10"
          >
            수정
          </button>
          <button
            data-testid={`menu-row-${item.id}-delete-button`}
            onClick={onDelete}
            className="px-3 py-1.5 min-h-[36px] text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ring-1 ring-red-700/10"
          >
            삭제
          </button>
        </div>
      </td>
    </tr>
  );
}
