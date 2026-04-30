'use client';

import MenuTableRow from './MenuTableRow';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
  sortOrder: number;
}

interface MenuTableProps {
  menuItems: MenuItem[];
  categoryName: string;
  categoryId: number;
  onEdit: (id: number) => void;
  onDelete: (item: MenuItem) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
}

export default function MenuTable({ menuItems, categoryName, categoryId, onEdit, onDelete, onMoveUp, onMoveDown }: MenuTableProps) {
  if (menuItems.length === 0) return null;

  return (
    <div data-testid={`menu-table-${categoryId}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 카테고리 헤더 */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 data-testid={`menu-table-header-${categoryId}`} className="text-base font-semibold text-gray-800">
          {categoryName}
        </h3>
        <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
          {menuItems.length}개
        </span>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">순서</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">메뉴명</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">가격</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">상태</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">등록일</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {menuItems.map((item, index) => (
              <MenuTableRow
                key={item.id}
                item={item}
                onEdit={() => onEdit(item.id)}
                onDelete={() => onDelete(item)}
                onMoveUp={() => onMoveUp(item.id)}
                onMoveDown={() => onMoveDown(item.id)}
                isFirst={index === 0}
                isLast={index === menuItems.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
