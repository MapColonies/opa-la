export class BundleNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, BundleNotFoundError.prototype);
  }
}
