/**
 * OrderDetailModal 컴포넌트 단위 테스트
 * AS-04: 주문 상세 보기
 * AS-05: 주문 상태 변경
 * AS-08: 주문 삭제
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderDetailModal from '../OrderDetailModal';
import type { TableWithOrders } from '@/lib/services/table-service';

// fetch 모킹
global.fetch = jest.fn();

// localStorage 모킹
const localStorageMock = {
  getItem: jest.fn().mockReturnValue('mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const tableWithOrders: TableWithOrders = {
  id: 1,
  tableNumber: 2,
  storeId: 'store-001',
  currentSessionId: 'session-1',
  currentOrders: [
    {
      id: 10,
      orderNumber: 'ORD-20260430-0001',
      status: 'PENDING',
      totalAmount: 9000,
      createdAt: new Date('2026-04-30T10:00:00Z'),
      updatedAt: new Date('2026-04-30T10:00:00Z'),
      items: [
        { id: 1, menuItemName: '아메리카노', unitPrice: 4500, quantity: 2 },
      ],
    },
  ],
  totalAmount: 9000,
};

describe('OrderDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('테이블 번호와 주문 목록을 렌더링한다', () => {
    render(
      <OrderDetailModal
        table={tableWithOrders}
        onClose={jest.fn()}
        onOrderUpdated={jest.fn()}
      />,
    );

    expect(screen.getByText('2번 테이블 주문 내역')).toBeInTheDocument();
    expect(screen.getByTestId('order-item-10')).toBeInTheDocument();
    expect(screen.getByText('아메리카노 × 2')).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = jest.fn();
    render(
      <OrderDetailModal
        table={tableWithOrders}
        onClose={onClose}
        onOrderUpdated={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('order-detail-modal-close-button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('상태 변경 버튼이 PENDING 주문에 표시된다', () => {
    render(
      <OrderDetailModal
        table={tableWithOrders}
        onClose={jest.fn()}
        onOrderUpdated={jest.fn()}
      />,
    );

    expect(screen.getByTestId('order-status-change-button-10')).toBeInTheDocument();
    expect(screen.getByTestId('order-status-change-button-10')).toHaveTextContent('준비중');
  });

  it('삭제 버튼 클릭 시 삭제 확인 팝업이 표시된다', () => {
    render(
      <OrderDetailModal
        table={tableWithOrders}
        onClose={jest.fn()}
        onOrderUpdated={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('order-delete-button-10'));
    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
  });

  it('삭제 취소 버튼 클릭 시 팝업이 닫힌다', () => {
    render(
      <OrderDetailModal
        table={tableWithOrders}
        onClose={jest.fn()}
        onOrderUpdated={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('order-delete-button-10'));
    fireEvent.click(screen.getByTestId('delete-confirm-cancel-button'));
    expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
  });

  it('삭제 확인 시 DELETE API를 호출하고 onOrderUpdated를 실행한다', async () => {
    const onOrderUpdated = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <OrderDetailModal
        table={tableWithOrders}
        onClose={jest.fn()}
        onOrderUpdated={onOrderUpdated}
      />,
    );

    fireEvent.click(screen.getByTestId('order-delete-button-10'));
    fireEvent.click(screen.getByTestId('delete-confirm-ok-button'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders/10',
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(onOrderUpdated).toHaveBeenCalled();
    });
  });

  it('주문이 없을 때 "주문이 없습니다" 메시지를 표시한다', () => {
    const emptyTable: TableWithOrders = {
      ...tableWithOrders,
      currentOrders: [],
      totalAmount: 0,
    };

    render(
      <OrderDetailModal
        table={emptyTable}
        onClose={jest.fn()}
        onOrderUpdated={jest.fn()}
      />,
    );

    expect(screen.getByText('주문이 없습니다.')).toBeInTheDocument();
  });
});
