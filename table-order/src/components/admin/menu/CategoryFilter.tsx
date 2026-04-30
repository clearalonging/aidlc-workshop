'use client';

interface Category {
  id: number;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  return (
    <div data-testid="category-filter" className="flex gap-2 flex-wrap mb-6" role="tablist">
      <button
        data-testid="category-filter-all"
        role="tab"
        aria-selected={selectedId === null}
        onClick={() => onSelect(null)}
        className={`px-5 py-2 rounded-full text-sm font-medium min-h-[44px] transition-all border ${
          selectedId === null
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
        }`}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          data-testid={`category-filter-item-${category.id}`}
          role="tab"
          aria-selected={selectedId === category.id}
          onClick={() => onSelect(category.id)}
          className={`px-5 py-2 rounded-full text-sm font-medium min-h-[44px] transition-all border ${
            selectedId === category.id
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
