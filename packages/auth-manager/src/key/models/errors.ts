export class KeyNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, KeyNotFoundError.prototype);
  }
}

export class KeyVersionMismatchError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, KeyVersionMismatchError.prototype);
  }
}
