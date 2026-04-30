'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MenuForm from '@/components/admin/menu/MenuForm';

interface Category {
  id: number;
  name: string;
}

interface MenuItemData {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  description: string | null;
  imageUrl: string | null;
}

/**
 * 메뉴 수정 페이지 (AS-12)
 */
export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = params.id as string;

  const [menuItem, setMenuItem] = useState<MenuItemData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  useEffect(() => {
    async function fetchData() {
      try {
        const [menuRes, catRes] = await Promise.all([
          fetch(`/api/admin/menu/${menuId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/admin/menu', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const menuData = await menuRes.json();
        const catData = await catRes.json();

        if (menuData.success) {
          setMenuItem(menuData.data);
        } else {
          setError(menuData.message || '메뉴를 불러올 수 없습니다.');
        }

        if (catData.success) {
          setCategories(catData.data.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
        }
      } catch {
        setError('서버와 통신할 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [menuId, token]);

  async function handleSubmit(formData: Record<string, unknown>) {
    const res = await fetch(`/api/admin/menu/${menuId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || '수정에 실패했습니다.');
    }
    router.push('/menu-manage');
  }

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">메뉴 수정</h1>
      {menuItem && (
        <MenuForm
          mode="edit"
          initialData={menuItem}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/menu-manage')}
        />
      )}
    </div>
  );
}
