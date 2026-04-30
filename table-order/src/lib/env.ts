import { z } from 'zod';

/**
 * 환경 변수 검증 스키마
 * 애플리케이션 시작 시 필수 환경 변수를 검증합니다.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL은 필수입니다.'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET은 최소 32자 이상이어야 합니다.'),
  JWT_ADMIN_EXPIRES_IN: z.string().default('16h'),
  JWT_TABLE_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  RATE_LIMIT_LOGIN: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_API: z.coerce.number().int().positive().default(100),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ 환경 변수 검증 실패:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('환경 변수 설정이 올바르지 않습니다.');
  }
  return result.data;
}

// 모듈 로드 시 한 번만 검증
export const env = validateEnv();
