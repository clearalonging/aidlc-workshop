'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardGrid from '@/components/admin/dashboard/DashboardGrid';
import OrderDetailModal from '@/components/admin/dashboard/OrderDetailModal';
import type { TableWithOrders } from '@/lib/services/table-service';

/**
 * 관리자 실시간 대시보드 페이지
 * AS-03: 실시간 주문 목록 확인
 * AS-06: 신규 주문 시각적 알림
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [newOrderTableIds, setNewOrderTableIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const getToken = useCallback((): string | null => {
    return localStorage.getItem('adminToken');
  }, []);

  // 초기 테이블 데이터 로드
  const loadTables = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/tables', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setTables(data.data);
      }
    } catch {
      setError('테이블 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, router]);

  // SSE 연결 설정
  const connectSSE = useCallback(() => {
    const token = getToken();
    if (!token) return;

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/orders/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      console.info('SSE connected');
    });

    // 신규 주문 이벤트 (AS-03, AS-06)
    es.addEventListener('new-order', (event) => {
      const data = JSON.parse(event.data) as {
        tableId: number;
        orderId: number;
        totalAmount: number;
        createdAt: string;
      };

      // 테이블 데이터 갱신
      loadTables();

      // 신규 주문 시각적 강조 (AS-06)
      setNewOrderTableIds((prev) => {
        const next = new Set(prev);
        next.add(data.tableId);
        return next;
      });

      // 5초 후 강조 해제
      setTimeout(() => {
        setNewOrderTableIds((prev) => {
          const next = new Set(prev);
          next.delete(data.tableId);
          return next;
        });
      }, 5000);
    });

    // 주문 상태 변경 이벤트
    es.addEventListener('order-status-changed', () => {
      loadTables();
    });

    // 주문 삭제 이벤트
    es.addEventListener('order-deleted', () => {
      loadTables();
    });

    // 이용 완료 이벤트
    es.addEventListener('table-completed', () => {
      loadTables();
    });

    es.onerror = () => {
      // EventSource 자동 재연결 (BR-SSE-02)
      console.warn('SSE connection error, will auto-reconnect');
    };
  }, [getToken, loadTables]);

  useEffect(() => {
    loadTables();
    connectSSE();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [loadTables, connectSSE]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminTokenExpiry');
    eventSourceRef.current?.close();
    router.push('/login');
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="dashboard-loading"
      >
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" data-testid="admin-dashboard-page">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">주문 대시보드</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/menu-manage')}
              className="text-sm text-blue-600 hover:underline"
              data-testid="dashboard-menu-manage-link"
            >
              메뉴 관리
            </button>
            <button
              onClick={() => router.push('/tables')}
              className="text-sm text-blue-600 hover:underline"
              data-testid="dashboard-tables-link"
            >
              테이블 관리
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800"
              data-testid="dashboard-logout-button"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
            data-testid="dashboard-error-message"
          >
            {error}
          </div>
        )}

        <DashboardGrid
          tables={tables}
          newOrderTableIds={newOrderTableIds}
          onTableClick={(tableId) => setSelectedTableId(tableId)}
        />
      </main>

      {/* 주문 상세 모달 */}
      {selectedTable && (
        <OrderDetailModal
          table={selectedTable}
          onClose={() => setSelectedTableId(null)}
          onOrderUpdated={loadTables}
        />
      )}
    </div>
  );
}
