'use client';

interface MenuOrderButtonsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
}

export default function MenuOrderButtons({ onMoveUp, onMoveDown, disableUp, disableDown }: MenuOrderButtonsProps) {
  return (
    <div className="order-buttons">
      <button onClick={onMoveUp} disabled={disableUp} aria-label="위로 이동" className="btn-icon">▲</button>
      <button onClick={onMoveDown} disabled={disableDown} aria-label="아래로 이동" className="btn-icon">▼</button>
    </div>
  );
}
