'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TableSetupForm from '@/components/admin/tables/TableSetupForm';
import TableHistoryModal from '@/components/admin/tables/TableHistoryModal';
import type { TableWithOrders } from '@/lib/services/table-service';

/**
 * 관리자 테이블 관리 페이지
 * AS-07: 테이블 초기 설정
 * AS-09: 테이블 이용 완료 처리
 * AS-10: 과거 주문 내역 조회
 */
export default function AdminTablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [historyTableId, setHistoryTableId] = useState<number | null>(null);
  const [completeConfirmTableId, setCompleteConfirmTableId] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const getToken = useCallback((): string | null => {
    return localStorage.getItem('adminToken');
  }, []);

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

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // 이용 완료 처리 (AS-09)
  const handleCompleteSession = async (tableId: number) => {
    const token = getToken();
    if (!token) return;

    setIsCompleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tables/${tableId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message ?? '이용 완료 처리에 실패했습니다.');
        return;
      }

      setSuccessMessage('이용 완료 처리되었습니다.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadTables();
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsCompleting(false);
      setCompleteConfirmTableId(null);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="tables-loading"
      >
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" data-testid="admin-tables-page">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">테이블 관리</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-blue-600 hover:underline"
              data-testid="tables-dashboard-link"
            >
              대시보드
            </button>
            <button
              onClick={() => setShowSetupForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              data-testid="tables-setup-button"
            >
              테이블 설정
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 알림 메시지 */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
            data-testid="tables-error-message"
          >
            {error}
          </div>
        )}
        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm"
            data-testid="tables-success-message"
          >
            {successMessage}
          </div>
        )}

        {/* 테이블 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm" data-testid="tables-list">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">테이블</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">현재 주문 수</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">총 금액</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">세션 상태</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    등록된 테이블이 없습니다.
                  </td>
                </tr>
              ) : (
                tables.map((table) => (
                  <tr
                    key={table.id}
                    className="hover:bg-gray-50"
                    data-testid={`table-row-${table.tableNumber}`}
                  >
                    <td className="px-4 py-3 font-medium">{table.tableNumber}번</td>
                    <td className="px-4 py-3">{table.currentOrders.length}건</td>
                    <td className="px-4 py-3">
                      {table.totalAmount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3">
                      {table.currentSessionId ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          이용 중
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                          비어 있음
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setHistoryTableId(table.id)}
                        className="text-blue-600 hover:underline text-xs"
                        data-testid={`table-history-button-${table.tableNumber}`}
                      >
                        과거 내역
                      </button>
                      {table.currentSessionId && (
                        <button
                          onClick={() => setCompleteConfirmTableId(table.id)}
                          className="text-orange-600 hover:underline text-xs"
                          data-testid={`table-complete-button-${table.tableNumber}`}
                        >
                          이용 완료
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* 테이블 설정 폼 모달 */}
      {showSetupForm && (
        <TableSetupForm
          onClose={() => setShowSetupForm(false)}
          onSuccess={() => {
            setShowSetupForm(false);
            loadTables();
          }}
        />
      )}

      {/* 과거 주문 내역 모달 */}
      {historyTableId !== null && (
        <TableHistoryModal
          tableId={historyTableId}
          onClose={() => setHistoryTableId(null)}
        />
      )}

      {/* 이용 완료 확인 팝업 */}
      {completeConfirmTableId !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="complete-confirm-modal"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              이용 완료 처리
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              현재 세션의 모든 주문이 과거 이력으로 이동됩니다.
              <br />
              계속하시겠습니까?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCompleteConfirmTableId(null)}
                disabled={isCompleting}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                data-testid="complete-confirm-cancel-button"
              >
                취소
              </button>
              <button
                onClick={() => handleCompleteSession(completeConfirmTableId)}
                disabled={isCompleting}
                className="px-4 py-2 text-sm text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:opacity-50"
                data-testid="complete-confirm-ok-button"
              >
                {isCompleting ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
