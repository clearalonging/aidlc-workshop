'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { addToCart } from '@/lib/cart';
import MenuCard from '@/components/customer/MenuCard';
import MenuDetailModal from '@/components/customer/MenuDetailModal';

/**
 * 고객 메뉴 목록 페이지 (기본 화면)
 * CS-02: 카테고리별 메뉴 목록 조회
 * CS-04: 카테고리 간 빠른 이동
 * CS-05: 장바구니에 메뉴 추가
 */

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

interface Category {
  id: number;
  name: string;
  sortOrder: number;
  menuItems: MenuItem[];
}

interface MenuDetailData {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: { id: number; name: string };
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [detailMenu, setDetailMenu] = useState<MenuDetailData | null>(null);

  // 메뉴 데이터 로드
  useEffect(() => {
    fetchMenus();
  }, []);

  async function fetchMenus() {
    try {
      setIsLoading(true);
      const result = await apiFetch<{ success: boolean; data: Category[] }>(
        '/api/menu',
      );
      setCategories(result.data);
      if (result.data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(result.data[0].id);
      }
    } catch (err) {
      setError('메뉴를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  // 메뉴 상세 조회
  async function handleViewDetail(menuId: number) {
    try {
      const result = await apiFetch<{ success: boolean; data: MenuDetailData }>(
        `/api/menu/${menuId}`,
      );
      setDetailMenu(result.data);
    } catch {
      setToast('메뉴 정보를 불러올 수 없습니다.');
      setTimeout(() => setToast(''), 2000);
    }
  }

  // 장바구니에 추가
  const handleAddToCart = useCallback(
    (menu: { id: number; name: string; price: number; imageUrl: string | null }) => {
      addToCart({
        menuItemId: menu.id,
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
      });
      setToast(`${menu.name} 추가됨`);
      setTimeout(() => setToast(''), 1500);
    },
    [],
  );

  // 현재 선택된 카테고리의 메뉴
  const currentCategory = categories.find((c: Category) => c.id === selectedCategoryId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">메뉴 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchMenus}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px]"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">🍽️ 메뉴</h1>
        </div>

        {/* 카테고리 탭 (CS-04: 카테고리 간 빠른 이동) */}
        <div className="flex overflow-x-auto px-4 pb-3 gap-2 scrollbar-hide">
          {categories.map((category: Category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                selectedCategoryId === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
              <span className="ml-1 text-xs opacity-70">
                ({category.menuItems.length})
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* 메뉴 그리드 */}
      <div className="flex-1 p-4">
        {currentCategory && currentCategory.menuItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {currentCategory.menuItems.map((menu: MenuItem) => (
              <MenuCard
                key={menu.id}
                id={menu.id}
                name={menu.name}
                price={menu.price}
                description={menu.description}
                imageUrl={menu.imageUrl}
                onAddToCart={() =>
                  handleAddToCart({
                    id: menu.id,
                    name: menu.name,
                    price: menu.price,
                    imageUrl: menu.imageUrl,
                  })
                }
                onViewDetail={() => handleViewDetail(menu.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            이 카테고리에 메뉴가 없습니다.
          </div>
        )}
      </div>

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-lg z-50 animate-fade-in">
          ✓ {toast}
        </div>
      )}

      {/* 메뉴 상세 모달 */}
      {detailMenu && (
        <MenuDetailModal
          menu={detailMenu}
          onClose={() => setDetailMenu(null)}
          onAddToCart={() =>
            handleAddToCart({
              id: detailMenu.id,
              name: detailMenu.name,
              price: detailMenu.price,
              imageUrl: detailMenu.imageUrl,
            })
          }
        />
      )}
    </div>
  );
}
