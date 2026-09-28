import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();
    service = module.get<CryptoService>(CryptoService);
  });

  describe('hashPassword', () => {
    it('returns a string different from the original password', async () => {
      const hash = await service.hashPassword('MyPass1');
      expect(hash).not.toBe('MyPass1');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('produces different hashes for the same input', async () => {
      const hash1 = await service.hashPassword('MyPass1');
      const hash2 = await service.hashPassword('MyPass1');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('returns true when plain matches hash', async () => {
      const hash = await service.hashPassword('MyPass1');
      expect(await service.comparePassword('MyPass1', hash)).toBe(true);
    });

    it('returns false when plain does not match hash', async () => {
      const hash = await service.hashPassword('MyPass1');
      expect(await service.comparePassword('WrongPassword99', hash)).toBe(false);
    });
  });
});
