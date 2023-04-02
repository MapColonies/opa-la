export class AssetNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AssetNotFoundError.prototype);
  }
}

export class AssetVersionMismatchError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AssetVersionMismatchError.prototype);
  }
}
