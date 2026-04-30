'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

/**
 * 테이블 자동 로그인 / 초기 설정 화면
 * CS-01: 테이블 자동 로그인
 */

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    expiresIn: string;
    tableId: number;
    tableNumber: number;
  };
}

export default function TableLoginPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 저장된 인증 정보로 자동 로그인 시도
  useEffect(() => {
    const savedStoreId = localStorage.getItem('table-storeId');
    const savedTableNumber = localStorage.getItem('table-tableNumber');
    const savedPassword = localStorage.getItem('table-password');
    const existingToken = localStorage.getItem('table-token');

    // 이미 토큰이 있으면 메뉴로 이동
    if (existingToken) {
      router.replace('/');
      return;
    }

    // 저장된 정보가 있으면 자동 로그인 시도
    if (savedStoreId && savedTableNumber && savedPassword) {
      setStoreId(savedStoreId);
      setTableNumber(savedTableNumber);
      setPassword(savedPassword);
      attemptLogin(savedStoreId, parseInt(savedTableNumber, 10), savedPassword);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function attemptLogin(
    loginStoreId: string,
    loginTableNumber: number,
    loginPassword: string,
  ) {
    setIsLoading(true);
    setError('');

    try {
      const result = await apiFetch<LoginResponse>('/api/auth/table/login', {
        method: 'POST',
        body: JSON.stringify({
          storeId: loginStoreId,
          tableNumber: loginTableNumber,
          password: loginPassword,
        }),
      });

      // 인증 정보 저장
      localStorage.setItem('table-token', result.data.token);
      localStorage.setItem('table-storeId', loginStoreId);
      localStorage.setItem('table-tableNumber', loginTableNumber.toString());
      localStorage.setItem('table-password', loginPassword);
      localStorage.setItem('table-id', result.data.tableId.toString());

      router.replace('/');
    } catch (err) {
      // 자동 로그인 실패 시 설정 화면 표시
      localStorage.removeItem('table-token');
      setError('인증에 실패했습니다. 정보를 다시 입력해 주세요.');
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const num = parseInt(tableNumber, 10);
    if (!storeId || isNaN(num) || !password) {
      setError('모든 필드를 입력해 주세요.');
      return;
    }
    await attemptLogin(storeId, num, password);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">자동 로그인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">🍽️ 테이블오더</h1>
          <p className="text-gray-500 mt-2">테이블 초기 설정</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="storeId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              매장 식별자
            </label>
            <input
              id="storeId"
              type="text"
              value={storeId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreId(e.target.value)}
              placeholder="store-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label
              htmlFor="tableNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              테이블 번호
            </label>
            <input
              id="tableNumber"
              type="number"
              value={tableNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTableNumber(e.target.value)}
              placeholder="1"
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          {error && (
            <div
              className="bg-red-50 text-red-600 text-sm p-3 rounded-lg"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {isLoading ? '로그인 중...' : '설정 완료'}
          </button>
        </form>
      </div>
    </div>
  );
}
