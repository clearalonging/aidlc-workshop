import pino from 'pino';

/**
 * 구조화된 로거 (pino)
 * SECURITY-03: 애플리케이션 레벨 로깅
 * SECURITY-15: 민감 정보 로깅 금지
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
  // 민감 정보 필드 제거 (SECURITY-03)
  redact: {
    paths: ['password', 'passwordHash', 'token', 'authorization', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * 요청별 자식 로거 생성
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}
