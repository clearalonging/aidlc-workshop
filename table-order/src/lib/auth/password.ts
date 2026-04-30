import bcrypt from 'bcryptjs';
import { env } from '@/lib/env';

/**
 * 비밀번호 해싱 및 검증 유틸리티
 * SECURITY-12: 적응형 알고리즘(bcrypt)으로 비밀번호 저장
 */

/**
 * 비밀번호를 bcrypt로 해싱합니다.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * 평문 비밀번호와 해시를 비교합니다.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
