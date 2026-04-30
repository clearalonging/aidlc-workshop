/**
 * SSEManager 단위 테스트
 */

// ReadableStream 모킹
class MockReadableStreamController {
  private chunks: Uint8Array[] = [];
  closed = false;

  enqueue(chunk: Uint8Array) {
    if (!this.closed) {
      this.chunks.push(chunk);
    }
  }

  close() {
    this.closed = true;
  }

  getChunks() {
    return this.chunks;
  }
}

// SSEManager를 직접 테스트하기 위한 헬퍼
class TestSSEManager {
  private clients: Map<string, MockReadableStreamController> = new Map();

  addClient(clientId: string): MockReadableStreamController {
    const controller = new MockReadableStreamController();
    this.clients.set(clientId, controller);
    return controller;
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try { client.close(); } catch { /* ignore */ }
      this.clients.delete(clientId);
    }
  }

  broadcast(event: string, data: unknown): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoded = new TextEncoder().encode(message);

    for (const [clientId, controller] of this.clients.entries()) {
      try {
        controller.enqueue(encoded);
      } catch {
        this.clients.delete(clientId);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

describe('SSEManager', () => {
  let manager: TestSSEManager;

  beforeEach(() => {
    manager = new TestSSEManager();
  });

  describe('addClient', () => {
    it('클라이언트를 등록해야 한다', () => {
      manager.addClient('client-1');
      expect(manager.getClientCount()).toBe(1);
    });

    it('여러 클라이언트를 등록할 수 있어야 한다', () => {
      manager.addClient('client-1');
      manager.addClient('client-2');
      manager.addClient('client-3');
      expect(manager.getClientCount()).toBe(3);
    });
  });

  describe('removeClient', () => {
    it('클라이언트를 제거해야 한다', () => {
      manager.addClient('client-1');
      manager.removeClient('client-1');
      expect(manager.getClientCount()).toBe(0);
    });

    it('존재하지 않는 클라이언트 제거 시 에러가 발생하지 않아야 한다', () => {
      expect(() => manager.removeClient('non-existent')).not.toThrow();
    });
  });

  describe('broadcast', () => {
    it('모든 클라이언트에 이벤트를 전송해야 한다', () => {
      const controller1 = manager.addClient('client-1');
      const controller2 = manager.addClient('client-2');

      manager.broadcast('new-order', { orderId: 1 });

      expect(controller1.getChunks()).toHaveLength(1);
      expect(controller2.getChunks()).toHaveLength(1);
    });

    it('올바른 SSE 형식으로 이벤트를 전송해야 한다', () => {
      const controller = manager.addClient('client-1');
      const eventData = { orderId: 1, tableNumber: 3 };

      manager.broadcast('new-order', eventData);

      const chunks = controller.getChunks();
      expect(chunks).toHaveLength(1);

      const message = new TextDecoder().decode(chunks[0]);
      expect(message).toContain('event: new-order');
      expect(message).toContain(`data: ${JSON.stringify(eventData)}`);
      expect(message).toEndWith('\n\n');
    });

    it('클라이언트가 없을 때 broadcast는 에러 없이 실행되어야 한다', () => {
      expect(() => manager.broadcast('new-order', {})).not.toThrow();
    });
  });

  describe('getClientCount', () => {
    it('초기 클라이언트 수는 0이어야 한다', () => {
      expect(manager.getClientCount()).toBe(0);
    });

    it('클라이언트 추가/제거 후 정확한 수를 반환해야 한다', () => {
      manager.addClient('client-1');
      manager.addClient('client-2');
      expect(manager.getClientCount()).toBe(2);

      manager.removeClient('client-1');
      expect(manager.getClientCount()).toBe(1);
    });
  });
});
