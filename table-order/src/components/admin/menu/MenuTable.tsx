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
    <div data-testid={`menu-table-${categoryId}`} className="card">
      <div className="card-header">
        <h3 data-testid={`menu-table-header-${categoryId}`}>{categoryName}</h3>
        <span className="badge">{menuItems.length}개</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th className="col-order">순서</th>
            <th>메뉴명</th>
            <th style={{ textAlign: 'right' }}>가격</th>
            <th style={{ textAlign: 'center' }}>상태</th>
            <th style={{ textAlign: 'center' }}>등록일</th>
            <th style={{ textAlign: 'center' }}>관리</th>
          </tr>
        </thead>
        <tbody>
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
  );
}
