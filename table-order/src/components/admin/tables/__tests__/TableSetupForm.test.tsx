/**
 * TableSetupForm 컴포넌트 단위 테스트
 * AS-07: 테이블 초기 설정
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableSetupForm from '../TableSetupForm';

// fetch 모킹
global.fetch = jest.fn();

// localStorage 모킹
const localStorageMock = {
  getItem: jest.fn().mockReturnValue('mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('TableSetupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('폼 요소들을 렌더링한다', () => {
    render(<TableSetupForm onClose={jest.fn()} onSuccess={jest.fn()} />);

    expect(screen.getByTestId('table-setup-number-input')).toBeInTheDocument();
    expect(screen.getByTestId('table-setup-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('table-setup-password-confirm-input')).toBeInTheDocument();
    expect(screen.getByTestId('table-setup-submit-button')).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = jest.fn();
    render(<TableSetupForm onClose={onClose} onSuccess={jest.fn()} />);

    fireEvent.click(screen.getByTestId('table-setup-close-button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('비밀번호 불일치 시 에러 메시지를 표시한다', async () => {
    render(<TableSetupForm onClose={jest.fn()} onSuccess={jest.fn()} />);

    fireEvent.change(screen.getByTestId('table-setup-number-input'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('table-setup-password-input'), {
      target: { value: '1234' },
    });
    fireEvent.change(screen.getByTestId('table-setup-password-confirm-input'), {
      target: { value: '5678' },
    });
    fireEvent.submit(screen.getByTestId('table-setup-form'));

    await waitFor(() => {
      expect(screen.getByTestId('table-setup-error-message')).toHaveTextContent(
        '비밀번호가 일치하지 않습니다.',
      );
    });
  });

  it('비밀번호 4자 미만 시 에러 메시지를 표시한다', async () => {
    render(<TableSetupForm onClose={jest.fn()} onSuccess={jest.fn()} />);

    fireEvent.change(screen.getByTestId('table-setup-number-input'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('table-setup-password-input'), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByTestId('table-setup-password-confirm-input'), {
      target: { value: '12' },
    });
    fireEvent.submit(screen.getByTestId('table-setup-form'));

    await waitFor(() => {
      expect(screen.getByTestId('table-setup-error-message')).toHaveTextContent(
        '4자 이상',
      );
    });
  });

  it('성공 시 onSuccess를 호출한다', async () => {
    const onSuccess = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: 1, tableNumber: 1 } }),
    });

    render(<TableSetupForm onClose={jest.fn()} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByTestId('table-setup-number-input'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('table-setup-password-input'), {
      target: { value: '1234' },
    });
    fireEvent.change(screen.getByTestId('table-setup-password-confirm-input'), {
      target: { value: '1234' },
    });
    fireEvent.submit(screen.getByTestId('table-setup-form'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/tables',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
