'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * 고객용 레이아웃
 * 하단 네비게이션 바 포함 (메뉴, 장바구니, 주문내역)
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('table-token');
    if (!token && pathname !== '/table-login') {
      router.replace('/table-login');
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // 로그인 페이지에서는 네비게이션 숨김
  if (pathname === '/table-login') {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className="flex-1 pb-20 overflow-y-auto">{children}</main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          <NavItem
            href="/"
            label="메뉴"
            icon="🍽️"
            active={pathname === '/' || pathname === ''}
          />
          <NavItem
            href="/cart"
            label="장바구니"
            icon="🛒"
            active={pathname === '/cart'}
          />
          <NavItem
            href="/orders"
            label="주문내역"
            icon="📋"
            active={pathname === '/orders'}
          />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] transition-colors ${
        active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </Link>
  );
}
