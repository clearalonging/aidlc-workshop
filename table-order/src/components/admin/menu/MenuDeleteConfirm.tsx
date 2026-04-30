'use client';

interface MenuItem {
  id: number;
  name: string;
}

interface MenuDeleteConfirmProps {
  item: MenuItem | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function MenuDeleteConfirm({ item, onConfirm, onCancel, isDeleting }: MenuDeleteConfirmProps) {
  if (!item) return null;

  return (
    <div
      data-testid="menu-delete-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-lg">🗑️</span>
          </div>
          <h2 id="delete-modal-title" className="text-lg font-bold text-gray-900">
            메뉴 삭제
          </h2>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          <strong className="text-gray-900">&quot;{item.name}&quot;</strong>을(를) 정말 삭제하시겠습니까?
          <br />
          <span className="text-gray-400 text-xs mt-1 block">이 작업은 되돌릴 수 없습니다.</span>
        </p>
        <div className="flex gap-3 justify-end">
          <button
            data-testid="menu-delete-cancel-button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-5 py-2.5 min-h-[44px] text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            data-testid="menu-delete-confirm-button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
