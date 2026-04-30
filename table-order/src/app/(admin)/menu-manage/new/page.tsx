'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MenuForm from '@/components/admin/menu/MenuForm';

interface Category {
  id: number;
  name: string;
}

/**
 * 메뉴 등록 페이지 (AS-11)
 */
export default function NewMenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/menu', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
        }
      } catch {
        // 에러 시 빈 카테고리 목록
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, [token]);

  async function handleSubmit(formData: Record<string, unknown>) {
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || '등록에 실패했습니다.');
    }
    router.push('/menu-manage');
  }

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">메뉴 등록</h1>
      <MenuForm
        mode="create"
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/menu-manage')}
      />
    </div>
  );
}
