import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import type { DomainRepository } from '@src/domain/DAL/domainRepository.js';
import { DomainManager } from '@src/domain/models/domainManager.js';
import { DomainAlreadyExistsError } from '@src/domain/models/errors.js';

const logger = await jsLogger({ enabled: false });

describe('DomainManager', () => {
  let domainManager: DomainManager;
  const mockedRepository = {
    findAndCount: vi.fn(),
    insert: vi.fn(),
  };

  beforeEach(function () {
    domainManager = new DomainManager(logger, mockedRepository as unknown as DomainRepository);
    vi.resetAllMocks();
  });

  describe('#getDomains', () => {
    it('should return the array of domains', async function () {
      mockedRepository.findAndCount.mockResolvedValue([{ name: 'avi' }]);

      const domainPromise = domainManager.getDomains();

      await expect(domainPromise).resolves.toStrictEqual([{ name: 'avi' }]);
    });

    it('should throw an error if thrown by the ORM', async function () {
      mockedRepository.findAndCount.mockRejectedValue(new Error());

      const domainPromise = domainManager.getDomains();

      await expect(domainPromise).rejects.toThrow();
    });
  });

  describe('#createDomain', () => {
    it('should insert into the db and return the domain', async function () {
      mockedRepository.insert.mockResolvedValue(undefined);

      const domainPromise = domainManager.createDomain({ name: 'avi' });

      await expect(domainPromise).resolves.toStrictEqual({ name: 'avi' });
      expect(mockedRepository.insert).toHaveBeenCalled();
    });

    it('should throw AlreadyExistsError if the domain is already in', async function () {
      mockedRepository.insert.mockRejectedValue(new Error('duplicate key value violates unique constraint'));

      const domainPromise = domainManager.createDomain({ name: 'avi' });

      await expect(domainPromise).rejects.toThrow(DomainAlreadyExistsError);
      expect(mockedRepository.insert).toHaveBeenCalled();
    });

    it('should throw an error if the db throws one', async function () {
      mockedRepository.insert.mockRejectedValue(new Error());

      const domainPromise = domainManager.createDomain({ name: 'avi' });

      await expect(domainPromise).rejects.toThrow();
      expect(mockedRepository.insert).toHaveBeenCalled();
    });
  });
});
