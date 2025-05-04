import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import * as execa from '@src/wrappers/execa';
import { checkFilesCommand, createBundleCommand, testCommand, testCoverageCommand, validateBinaryExistCommand } from '@src/opa';

jest.mock('../src/wrappers/execa', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    ...jest.requireActual('../src/wrappers/execa'),
  };
});

const baseFolder = path.join(tmpdir(), 'authbundlertests', 'opa');
type ExecaChildProcess = Awaited<ReturnType<(typeof execa)['execa']>>;

describe('opa.ts', function () {
  beforeAll(async function () {
    await mkdir(baseFolder, { recursive: true });
    await writeFile(
      path.join(baseFolder, 'example.rego'),
      `package authz
    import future.keywords
    
    allow if {
        input.path == ["users"]
        input.method == "POST"
    }
    
    allow if {
        input.path == ["users", input.user_id]
        input.method == "GET"
    }`
    );
    await writeFile(
      path.join(baseFolder, 'example_test.rego'),
      `package authz
      import future.keywords
      
      test_post_allowed if {
          allow with input as {"path": ["users"], "method": "POST"}
      }
      
      test_get_anonymous_denied if {
          not allow with input as {"path": ["users"], "method": "GET"}
      }
      
      test_get_user_allowed if {
          allow with input as {"path": ["users", "bob"], "method": "GET", "user_id": "bob"}
      }
      
      test_get_another_user_denied if {
          not allow with input as {"path": ["users", "bob"], "method": "GET", "user_id": "alice"}
      }`
    );
  });

  afterEach(function () {
    jest.resetAllMocks();
  });

  describe('#validateBinaryExistCommand', function () {
    it('should return true if the binary exists', async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ failed: false } as ExecaChildProcess);
      const res = await validateBinaryExistCommand();

      expect(res).toBe(true);
    });

    it("should return false if the binary doesn't exists", async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ failed: true } as ExecaChildProcess);
      const res = await validateBinaryExistCommand();

      expect(res).toBe(false);
    });
  });

  describe('#checkFilesCommand', function () {
    it('should return true if the files are ok', async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ failed: false } as ExecaChildProcess);
      const [res] = await checkFilesCommand(baseFolder);

      expect(res).toBe(true);
    });

    it('should return false if something is wrong with the files', async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ failed: true, stderr: '{"oh":"no"}' } as ExecaChildProcess);
      const [res, err] = await checkFilesCommand(baseFolder);

      expect(res).toBe(false);

      expect(err).toEqual({ oh: 'no' });
    });
  });

  describe('#testCommand', function () {
    it('should return true if all the tests pass', async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ failed: false } as ExecaChildProcess);
      const [res] = await testCommand(baseFolder);

      expect(res).toBe(true);
    });

    it('should return false if the tests failed', async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ failed: true, stdout: '{"oh":"no"}' } as ExecaChildProcess);
      const [res, err] = await testCommand(baseFolder);

      expect(res).toBe(false);

      expect(err).toEqual({ oh: 'no' });
    });
  });

  describe('#testCoverageCommand', function () {
    it('should return a number for the test coverage', async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ stdout: '{"coverage": 58}' } as ExecaChildProcess);
      const res = await testCoverageCommand(baseFolder);

      expect(typeof res).toBe('number');
    });
  });

  describe('#createBundleCommand', function () {
    it('should return true if the bundle was created', async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ failed: false } as ExecaChildProcess);
      const [res] = await createBundleCommand(baseFolder, 'bundle.tar.gz');

      expect(res).toBe(true);
    });

    it('should return false if the create bundle command failed', async function () {
      jest.spyOn(execa, 'execa').mockResolvedValue({ failed: true, stdout: 'oh no' } as ExecaChildProcess);
      const [res, err] = await createBundleCommand(baseFolder, 'bundle.tar.gz');

      expect(res).toBe(false);

      expect(err).toBe('oh no');
    });
  });
});
