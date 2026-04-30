'use client';

/**
 * 메뉴 상세 모달 컴포넌트
 * CS-03: 메뉴 상세 정보 조회
 */

interface MenuDetailModalProps {
  menu: {
    id: number;
    name: string;
    price: number;
    description: string | null;
    imageUrl: string | null;
    category: { name: string };
  };
  onClose: () => void;
  onAddToCart: () => void;
}

export default function MenuDetailModal({
  menu,
  onClose,
  onAddToCart,
}: MenuDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-detail-title"
    >
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px]"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 이미지 */}
        <div className="w-full aspect-[4/3] bg-gray-100">
          {menu.imageUrl ? (
            <img
              src={menu.imageUrl}
              alt={menu.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
              🍽️
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="p-5">
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
            {menu.category.name}
          </span>
          <h2
            id="menu-detail-title"
            className="text-xl font-bold text-gray-900 mt-2"
          >
            {menu.name}
          </h2>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {menu.price.toLocaleString()}원
          </p>
          {menu.description && (
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              {menu.description}
            </p>
          )}

          {/* 장바구니 추가 버튼 */}
          <button
            onClick={() => {
              onAddToCart();
              onClose();
            }}
            className="w-full mt-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[44px]"
          >
            장바구니에 담기
          </button>
        </div>
      </div>
    </div>
  );
}
