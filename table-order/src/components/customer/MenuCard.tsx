'use client';

/**
 * 메뉴 카드 컴포넌트
 * CS-02: 카테고리별 메뉴 목록 조회
 * CS-05: 장바구니에 메뉴 추가
 */

interface MenuCardProps {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  onAddToCart: () => void;
  onViewDetail: () => void;
}

export default function MenuCard({
  id,
  name,
  price,
  description,
  imageUrl,
  onAddToCart,
  onViewDetail,
}: MenuCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* 이미지 영역 */}
      <button
        onClick={onViewDetail}
        className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden"
        aria-label={`${name} 상세 보기`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            🍽️
          </div>
        )}
      </button>

      {/* 정보 영역 */}
      <div className="p-3 flex-1 flex flex-col">
        <button
          onClick={onViewDetail}
          className="text-left"
          aria-label={`${name} 상세 보기`}
        >
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </button>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-bold text-blue-600 text-sm">
            {price.toLocaleString()}원
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={`${name} 장바구니에 추가`}
          >
            담기
          </button>
        </div>
      </div>
    </div>
  );
}
