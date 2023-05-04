export class MissingPolicyFilesError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, MissingPolicyFilesError.prototype);
  }
}

export class ConnectionNotInitializedError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConnectionNotInitializedError.prototype);
  }
}

export class KeyNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, KeyNotFoundError.prototype);
  }
}

export class WorkdirNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, WorkdirNotFoundError.prototype);
  }
}

export class OpaNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, OpaNotFoundError.prototype);
  }
}

export class OpaTestsFailedError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, OpaTestsFailedError.prototype);
  }
}

export class OpaCoverageTooLowError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, OpaCoverageTooLowError.prototype);
  }
}

export class OpaBundleCreationError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, OpaBundleCreationError.prototype);
  }
}
