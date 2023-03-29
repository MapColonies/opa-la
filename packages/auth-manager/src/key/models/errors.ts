export class ClientAlreadyExistsError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ClientAlreadyExistsError.prototype);
  }
}

export class ClientNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ClientNotFoundError.prototype);
  }
}
