/**
 * TableCard 컴포넌트 단위 테스트
 * AS-03: 실시간 주문 목록 확인
 * AS-06: 신규 주문 시각적 알림
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TableCard from '../TableCard';
import type { TableWithOrders } from '@/lib/services/table-service';

// 공통 픽스처
const baseTable: TableWithOrders = {
  id: 1,
  tableNumber: 3,
  storeId: 'store-001',
  currentSessionId: 'session-1',
  currentOrders: [],
  totalAmount: 0,
};

const tableWithOrders: TableWithOrders = {
  ...baseTable,
  currentOrders: [
    {
      id: 1,
      orderNumber: 'ORD-20260430-0001',
      status: 'PENDING',
      totalAmount: 9000,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        { id: 1, menuItemName: '아메리카노', unitPrice: 4500, quantity: 2 },
      ],
    },
  ],
  totalAmount: 9000,
};

describe('TableCard', () => {
  it('테이블 번호를 렌더링한다', () => {
    render(<TableCard table={baseTable} isNew={false} onClick={jest.fn()} />);
    expect(screen.getByText('3번')).toBeInTheDocument();
  });

  it('주문이 없을 때 "주문 없음"을 표시한다', () => {
    render(<TableCard table={baseTable} isNew={false} onClick={jest.fn()} />);
    expect(screen.getByText('주문 없음')).toBeInTheDocument();
  });

  it('주문이 있을 때 주문 수와 총 금액을 표시한다', () => {
    render(<TableCard table={tableWithOrders} isNew={false} onClick={jest.fn()} />);
    expect(screen.getByText('주문 1건')).toBeInTheDocument();
    expect(screen.getByText('9,000원')).toBeInTheDocument();
  });

  it('isNew=true일 때 NEW 배지를 표시한다', () => {
    render(<TableCard table={tableWithOrders} isNew={true} onClick={jest.fn()} />);
    expect(
      screen.getByTestId('table-card-new-badge-3'),
    ).toBeInTheDocument();
  });

  it('isNew=false일 때 NEW 배지를 표시하지 않는다', () => {
    render(<TableCard table={tableWithOrders} isNew={false} onClick={jest.fn()} />);
    expect(
      screen.queryByTestId('table-card-new-badge-3'),
    ).not.toBeInTheDocument();
  });

  it('클릭 시 onClick 핸들러를 호출한다', () => {
    const onClick = jest.fn();
    render(<TableCard table={baseTable} isNew={false} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('table-card-3'));
    expect(onClick).toHaveBeenCalledWith(1);
  });

  it('최신 주문의 첫 번째 메뉴명을 미리보기로 표시한다', () => {
    render(<TableCard table={tableWithOrders} isNew={false} onClick={jest.fn()} />);
    expect(screen.getByTestId('table-card-latest-order-3')).toHaveTextContent(
      '아메리카노',
    );
  });
});
