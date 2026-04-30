import { logger } from '@/lib/logger';
import type { SSEEventType } from '@/types';

/**
 * Server-Sent Events 관리자
 * 실시간 주문 알림을 관리자 클라이언트에 브로드캐스트합니다.
 * SECURITY-15: 리소스 정리 패턴
 */

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  connectedAt: Date;
};

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  /**
   * SSE 클라이언트를 등록하고 스트림을 반환합니다.
   */
  createStream(clientId: string): ReadableStream {
    const stream = new ReadableStream({
      start: (controller) => {
        const client: SSEClient = {
          id: clientId,
          controller,
          connectedAt: new Date(),
        };

        this.clients.set(clientId, client);
        logger.info({ clientId, totalClients: this.clients.size }, 'SSE client connected');

        // 연결 확인 이벤트 전송
        this.sendToClient(client, 'connected', { clientId, timestamp: new Date().toISOString() });
      },
      cancel: () => {
        this.removeClient(clientId);
      },
    });

    return stream;
  }

  /**
   * 특정 클라이언트에 이벤트를 전송합니다.
   */
  private sendToClient(
    client: SSEClient,
    event: SSEEventType,
    data: unknown,
  ): void {
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      logger.warn({ clientId: client.id, error }, 'Failed to send SSE event, removing client');
      this.removeClient(client.id);
    }
  }

  /**
   * 모든 연결된 클라이언트에 이벤트를 브로드캐스트합니다.
   */
  broadcast(event: SSEEventType, data: unknown): void {
    if (this.clients.size === 0) return;

    logger.debug({ event, clientCount: this.clients.size }, 'Broadcasting SSE event');

    const deadClients: string[] = [];

    for (const [clientId, client] of this.clients.entries()) {
      try {
        this.sendToClient(client, event, data);
      } catch {
        deadClients.push(clientId);
      }
    }

    // 죽은 클라이언트 정리
    deadClients.forEach((id) => this.removeClient(id));
  }

  /**
   * 클라이언트 연결을 해제합니다.
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      client.controller.close();
    } catch {
      // 이미 닫힌 경우 무시
    }

    this.clients.delete(clientId);
    logger.info({ clientId, totalClients: this.clients.size }, 'SSE client disconnected');
  }

  /**
   * 현재 연결된 클라이언트 수를 반환합니다.
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Heartbeat 전송 (연결 유지)
   */
  sendHeartbeat(): void {
    if (this.clients.size === 0) return;

    for (const [clientId, client] of this.clients.entries()) {
      try {
        const message = ': ping\n\n';
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch {
        this.removeClient(clientId);
      }
    }
  }
}

// 싱글톤 인스턴스
const globalForSSE = globalThis as unknown as { sseManager: SSEManager | undefined };
export const sseManager = globalForSSE.sseManager ?? new SSEManager();
if (process.env.NODE_ENV !== 'production') {
  globalForSSE.sseManager = sseManager;
}

// 30초마다 Heartbeat 전송
if (typeof setInterval !== 'undefined') {
  setInterval(() => sseManager.sendHeartbeat(), 30 * 1000);
}
