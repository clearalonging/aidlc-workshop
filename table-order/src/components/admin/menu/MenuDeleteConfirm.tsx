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

/**
 * 메뉴 삭제 확인 모달 (AS-13)
 * item이 null이면 모달 숨김
 */
export default function MenuDeleteConfirm({
  item,
  onConfirm,
  onCancel,
  isDeleting,
}: MenuDeleteConfirmProps) {
  if (!item) return null;

  return (
    <div
      data-testid="menu-delete-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />

      {/* 모달 */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h2 id="delete-modal-title" className="text-lg font-semibold mb-4">
          메뉴 삭제
        </h2>
        <p className="text-gray-600 mb-6">
          <strong>&quot;{item.name}&quot;</strong>을(를) 정말 삭제하시겠습니까?
          <br />
          <span className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</span>
        </p>
        <div className="flex gap-3 justify-end">
          <button
            data-testid="menu-delete-cancel-button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 min-w-[44px] min-h-[44px] text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            취소
          </button>
          <button
            data-testid="menu-delete-confirm-button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 min-w-[44px] min-h-[44px] text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
