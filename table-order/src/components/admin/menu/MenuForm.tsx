'use client';

import { useState, FormEvent } from 'react';
import { menuItemSchema } from '@/lib/validators/common-schemas';

interface Category {
  id: number;
  name: string;
}

interface MenuItemData {
  id?: number;
  name: string;
  price: number;
  categoryId: number;
  description: string | null;
  imageUrl: string | null;
}

interface MenuFormProps {
  mode: 'create' | 'edit';
  initialData?: MenuItemData;
  categories: Category[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

interface MenuFormData {
  name: string;
  price: string;
  categoryId: string;
  description: string;
  imageUrl: string;
}

/**
 * 메뉴 등록/수정 공통 폼 (AS-11, AS-12)
 * 클라이언트 사이드 Zod 검증 후 서버 전송
 */
export default function MenuForm({
  mode,
  initialData,
  categories,
  onSubmit,
  onCancel,
}: MenuFormProps) {
  const [formData, setFormData] = useState<MenuFormData>({
    name: initialData?.name ?? '',
    price: initialData?.price?.toString() ?? '',
    categoryId: initialData?.categoryId?.toString() ?? '',
    description: initialData?.description ?? '',
    imageUrl: initialData?.imageUrl ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleChange(field: keyof MenuFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 입력 시 해당 필드 에러 제거
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // 클라이언트 사이드 Zod 검증
    const parsed = menuItemSchema.safeParse({
      name: formData.name,
      price: formData.price ? Number(formData.price) : undefined,
      categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form data-testid="menu-form" onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {submitError && (
        <div data-testid="menu-form-error" role="alert" className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {submitError}
        </div>
      )}

      {/* 메뉴명 */}
      <div>
        <label htmlFor="menu-name" className="block text-sm font-medium text-gray-700 mb-1">
          메뉴명 <span className="text-red-500">*</span>
        </label>
        <input
          id="menu-name"
          data-testid="menu-form-name-input"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          maxLength={100}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="메뉴명을 입력하세요"
        />
        {errors.name && <p role="alert" className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* 가격 */}
      <div>
        <label htmlFor="menu-price" className="block text-sm font-medium text-gray-700 mb-1">
          가격 (원) <span className="text-red-500">*</span>
        </label>
        <input
          id="menu-price"
          data-testid="menu-form-price-input"
          type="number"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          min={100}
          max={1000000}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="100 ~ 1,000,000"
        />
        {errors.price && <p role="alert" className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      {/* 카테고리 */}
      <div>
        <label htmlFor="menu-category" className="block text-sm font-medium text-gray-700 mb-1">
          카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          id="menu-category"
          data-testid="menu-form-category-select"
          value={formData.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">카테고리를 선택하세요</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p role="alert" className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
      </div>

      {/* 설명 */}
      <div>
        <label htmlFor="menu-description" className="block text-sm font-medium text-gray-700 mb-1">
          설명
        </label>
        <textarea
          id="menu-description"
          data-testid="menu-form-description-input"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="메뉴 설명 (선택사항)"
        />
        {errors.description && <p role="alert" className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* 이미지 URL */}
      <div>
        <label htmlFor="menu-image-url" className="block text-sm font-medium text-gray-700 mb-1">
          이미지 URL
        </label>
        <input
          id="menu-image-url"
          data-testid="menu-form-image-url-input"
          type="url"
          value={formData.imageUrl}
          onChange={(e) => handleChange('imageUrl', e.target.value)}
          maxLength={2000}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/image.jpg (선택사항)"
        />
        {errors.imageUrl && <p role="alert" className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>}
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-4">
        <button
          data-testid="menu-form-submit-button"
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 min-w-[44px] min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {isSubmitting ? '저장 중...' : mode === 'create' ? '등록' : '저장'}
        </button>
        <button
          data-testid="menu-form-cancel-button"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 min-w-[44px] min-h-[44px] bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 font-medium"
        >
          취소
        </button>
      </div>
    </form>
  );
}
