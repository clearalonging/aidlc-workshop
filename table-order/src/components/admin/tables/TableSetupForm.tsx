'use client';

import { useState, FormEvent } from 'react';

interface TableSetupFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 테이블 설정 폼 컴포넌트
 * AS-07: 테이블 초기 설정
 */
export default function TableSetupForm({ onClose, onSuccess }: TableSetupFormProps) {
  const [tableNumber, setTableNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const tableNum = parseInt(tableNumber, 10);
    if (isNaN(tableNum) || tableNum <= 0) {
      setError('올바른 테이블 번호를 입력해 주세요.');
      return;
    }

    if (password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tableNumber: tableNum, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message ?? '테이블 설정에 실패했습니다.');
        return;
      }

      onSuccess();
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-testid="table-setup-modal"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">테이블 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            data-testid="table-setup-close-button"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4" data-testid="table-setup-form">
          {/* 테이블 번호 */}
          <div className="mb-4">
            <label
              htmlFor="tableNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              테이블 번호
            </label>
            <input
              id="tableNumber"
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="예: 1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="table-setup-number-input"
            />
          </div>

          {/* 비밀번호 */}
          <div className="mb-4">
            <label
              htmlFor="tablePassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호
            </label>
            <input
              id="tablePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="4자 이상"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="table-setup-password-input"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div className="mb-6">
            <label
              htmlFor="tablePasswordConfirm"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호 확인
            </label>
            <input
              id="tablePasswordConfirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 재입력"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="table-setup-password-confirm-input"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
              data-testid="table-setup-error-message"
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              data-testid="table-setup-cancel-button"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              data-testid="table-setup-submit-button"
            >
              {isLoading ? '설정 중...' : '설정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
