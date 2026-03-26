import jsLogger from '@map-colonies/js-logger';
import { DomainRepository } from '../../../../src/domain/DAL/domainRepository';
import { DomainManager } from '../../../../src/domain/models/domainManager';
import { DomainAlreadyExistsError } from '../../../../src/domain/models/errors';

describe('DomainManager', () => {
  let domainManager: DomainManager;
  const mockedRepository = {
    findAndCount: jest.fn(),
    insert: jest.fn(),
  };
  beforeEach(function () {
    domainManager = new DomainManager(jsLogger({ enabled: false }), mockedRepository as unknown as DomainRepository);
    jest.resetAllMocks();
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
