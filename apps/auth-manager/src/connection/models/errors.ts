export class ConnectionNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConnectionNotFoundError.prototype);
  }
}

export class ConnectionVersionMismatchError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConnectionVersionMismatchError.prototype);
  }
}
