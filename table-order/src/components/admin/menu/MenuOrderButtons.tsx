'use client';

interface MenuOrderButtonsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
}

export default function MenuOrderButtons({ onMoveUp, onMoveDown, disableUp, disableDown }: MenuOrderButtonsProps) {
  return (
    <div className="flex flex-col gap-0.5 items-center">
      <button
        onClick={onMoveUp}
        disabled={disableUp}
        aria-label="위로 이동"
        className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs"
      >
        ▲
      </button>
      <button
        onClick={onMoveDown}
        disabled={disableDown}
        aria-label="아래로 이동"
        className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs"
      >
        ▼
      </button>
    </div>
  );
}
