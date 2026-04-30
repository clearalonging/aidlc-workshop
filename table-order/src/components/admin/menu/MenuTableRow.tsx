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
    <tr data-testid={`menu-row-${item.id}`}>
      <td className="col-order">
        <MenuOrderButtons onMoveUp={onMoveUp} onMoveDown={onMoveDown} disableUp={isFirst} disableDown={isLast} />
      </td>
      <td className="col-name">{item.name}</td>
      <td className="col-price">{formattedPrice}원</td>
      <td className="col-status">
        <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
          {item.isAvailable ? '판매중' : '품절'}
        </span>
      </td>
      <td className="col-date">{formattedDate}</td>
      <td className="col-actions">
        <div className="action-buttons">
          <button data-testid={`menu-row-${item.id}-edit-button`} onClick={onEdit} className="btn-edit">수정</button>
          <button data-testid={`menu-row-${item.id}-delete-button`} onClick={onDelete} className="btn-delete">삭제</button>
        </div>
      </td>
    </tr>
  );
}
