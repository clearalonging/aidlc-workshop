'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CategoryFilter from '@/components/admin/menu/CategoryFilter';
import MenuTable from '@/components/admin/menu/MenuTable';
import MenuDeleteConfirm from '@/components/admin/menu/MenuDeleteConfirm';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
  sortOrder: number;
}

interface CategoryWithMenus {
  id: number;
  name: string;
  sortOrder: number;
  menuItems: MenuItem[];
  _count: { menuItems: number };
}

export default function MenuManagePage() {
  const router = useRouter();
  const [allCategories, setAllCategories] = useState<CategoryWithMenus[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const fetchMenus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/admin/menu', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAllCategories(data.data);
      } else {
        setError(data.message || '메뉴를 불러오는데 실패했습니다.');
      }
    } catch {
      setError('서버와 통신할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const displayCategories = selectedCategoryId
    ? allCategories.filter((c) => c.id === selectedCategoryId)
    : allCategories;

  const categoryList = allCategories.map((c) => ({ id: c.id, name: c.name }));

  const totalMenuCount = allCategories.reduce((sum, c) => sum + c.menuItems.length, 0);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/menu/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        fetchMenus();
      } else {
        setError(data.message || '삭제에 실패했습니다.');
      }
    } catch {
      setError('서버와 통신할 수 없습니다.');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMoveOrder(menuId: number, direction: 'up' | 'down') {
    try {
      const res = await fetch(`/api/admin/menu/${menuId}/order`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMenus();
      }
    } catch {
      setError('순서 변경에 실패했습니다.');
    }
  }

  return (
    <div data-testid="menu-list-page" className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🍽️ 메뉴 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              총 {totalMenuCount}개 메뉴 · {allCategories.length}개 카테고리
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← 대시보드
            </button>
            <button
              data-testid="menu-list-add-button"
              onClick={() => router.push('/menu-manage/new')}
              className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
            >
              + 메뉴 등록
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <CategoryFilter
          categories={categoryList}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />

        {isLoading && (
          <div data-testid="menu-list-loading" className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p>메뉴를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div data-testid="menu-list-error" role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 mb-6">
            {error}
          </div>
        )}

        {!isLoading && !error && displayCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-lg font-medium text-gray-500">등록된 메뉴가 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">메뉴 등록 버튼을 눌러 첫 메뉴를 추가하세요</p>
          </div>
        )}

        <div className="space-y-6">
          {!isLoading &&
            displayCategories.map((category) => (
              <MenuTable
                key={category.id}
                menuItems={category.menuItems}
                categoryName={category.name}
                categoryId={category.id}
                onEdit={(id) => router.push(`/menu-manage/${id}/edit`)}
                onDelete={(item) => setDeleteTarget(item)}
                onMoveUp={(id) => handleMoveOrder(id, 'up')}
                onMoveDown={(id) => handleMoveOrder(id, 'down')}
              />
            ))}
        </div>
      </main>

      <MenuDeleteConfirm
        item={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
