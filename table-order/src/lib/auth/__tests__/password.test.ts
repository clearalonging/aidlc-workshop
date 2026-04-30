import { hashPassword, comparePassword } from '../password';

/**
 * 비밀번호 해싱 유틸리티 단위 테스트
 */
describe('password utilities', () => {
  describe('hashPassword', () => {
    it('비밀번호를 bcrypt 해시로 변환해야 한다', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt 해시 형식
    });

    it('같은 비밀번호도 매번 다른 해시를 생성해야 한다 (salt)', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('올바른 비밀번호는 true를 반환해야 한다', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it('잘못된 비밀번호는 false를 반환해야 한다', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);

      const result = await comparePassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('빈 문자열 비밀번호는 false를 반환해야 한다', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });
  });
});
