export class DomainAlreadyExistsError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DomainAlreadyExistsError.prototype);
  }
}

export class DomainNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DomainNotFoundError.prototype);
  }
}
