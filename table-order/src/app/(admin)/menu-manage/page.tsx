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

/**
 * 메뉴 관리 목록 페이지 (AS-15, AS-13, AS-14)
 * 카테고리별 메뉴 테이블 + 필터 + 삭제 + 순서 변경
 */
export default function MenuManagePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithMenus[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const fetchMenus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url = selectedCategoryId
        ? `/api/admin/menu?categoryId=${selectedCategoryId}`
        : '/api/admin/menu';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.message || '메뉴를 불러오는데 실패했습니다.');
      }
    } catch {
      setError('서버와 통신할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId, token]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

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

  const categoryList = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div data-testid="menu-list-page" className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">메뉴 관리</h1>
        <button
          data-testid="menu-list-add-button"
          onClick={() => router.push('/menu-manage/new')}
          className="px-4 py-2.5 min-w-[44px] min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          + 메뉴 등록
        </button>
      </div>

      <CategoryFilter
        categories={categoryList}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      {isLoading && (
        <div data-testid="menu-list-loading" className="text-center py-12 text-gray-500">
          메뉴를 불러오는 중...
        </div>
      )}

      {error && (
        <div data-testid="menu-list-error" role="alert" className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}

      {!isLoading && !error && categories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          등록된 메뉴가 없습니다.
        </div>
      )}

      {!isLoading &&
        categories.map((category) => (
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

      <MenuDeleteConfirm
        item={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
