export class DomainAlreadyExistsError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DomainAlreadyExistsError.prototype);
  }
}
