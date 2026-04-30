/**
 * 장바구니 유틸리티 단위 테스트
 * CS-05 ~ CS-08: 장바구니 관리
 */

// localStorage 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import {
  loadCart,
  saveCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartTotal,
  getCartItemCount,
} from '../index';

describe('Cart Utility', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('loadCart', () => {
    it('저장된 장바구니가 없으면 빈 장바구니를 반환해야 한다', () => {
      const cart = loadCart();
      expect(cart.items).toHaveLength(0);
    });

    it('저장된 장바구니를 로드해야 한다', () => {
      const savedCart = {
        items: [
          { menuItemId: 1, name: '불고기', price: 12000, quantity: 2, imageUrl: null },
        ],
        updatedAt: '2026-04-30T10:00:00Z',
      };
      localStorageMock.setItem('table-order-cart', JSON.stringify(savedCart));

      const cart = loadCart();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].name).toBe('불고기');
      expect(cart.items[0].quantity).toBe(2);
    });

    it('잘못된 JSON이 저장되어 있으면 빈 장바구니를 반환해야 한다', () => {
      localStorageMock.setItem('table-order-cart', 'invalid-json');

      const cart = loadCart();
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('addToCart', () => {
    it('새 메뉴를 수량 1로 추가해야 한다', () => {
      const cart = addToCart({
        menuItemId: 1,
        name: '불고기 덮밥',
        price: 12000,
        imageUrl: null,
      });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(1);
      expect(cart.items[0].name).toBe('불고기 덮밥');
    });

    it('이미 존재하는 메뉴는 수량을 1 증가시켜야 한다', () => {
      // 먼저 추가
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });

      // 같은 메뉴 다시 추가
      const cart = addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('다른 메뉴를 추가하면 별도 항목으로 추가되어야 한다', () => {
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });
      const cart = addToCart({ menuItemId: 2, name: '콜라', price: 2000, imageUrl: null });

      expect(cart.items).toHaveLength(2);
    });
  });

  describe('updateQuantity', () => {
    it('수량을 변경해야 한다', () => {
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });

      const cart = updateQuantity(1, 5);

      expect(cart.items[0].quantity).toBe(5);
    });

    it('수량이 0 이하이면 항목을 제거해야 한다', () => {
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });

      const cart = updateQuantity(1, 0);

      expect(cart.items).toHaveLength(0);
    });
  });

  describe('removeFromCart', () => {
    it('특정 항목을 제거해야 한다', () => {
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });
      addToCart({ menuItemId: 2, name: '콜라', price: 2000, imageUrl: null });

      const cart = removeFromCart(1);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].menuItemId).toBe(2);
    });
  });

  describe('clearCart', () => {
    it('장바구니를 비워야 한다', () => {
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });
      addToCart({ menuItemId: 2, name: '콜라', price: 2000, imageUrl: null });

      const cart = clearCart();

      expect(cart.items).toHaveLength(0);
    });
  });

  describe('getCartTotal', () => {
    it('총 금액을 정확히 계산해야 한다', () => {
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null }); // 수량 2
      addToCart({ menuItemId: 2, name: '콜라', price: 2000, imageUrl: null });

      const cart = loadCart();
      const total = getCartTotal(cart);

      // 12000 * 2 + 2000 * 1 = 26000
      expect(total).toBe(26000);
    });

    it('빈 장바구니의 총 금액은 0이어야 한다', () => {
      const cart = loadCart();
      expect(getCartTotal(cart)).toBe(0);
    });
  });

  describe('getCartItemCount', () => {
    it('총 수량을 정확히 계산해야 한다', () => {
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null });
      addToCart({ menuItemId: 1, name: '불고기', price: 12000, imageUrl: null }); // 수량 2
      addToCart({ menuItemId: 2, name: '콜라', price: 2000, imageUrl: null });

      const cart = loadCart();
      const count = getCartItemCount(cart);

      expect(count).toBe(3); // 2 + 1
    });
  });
});
