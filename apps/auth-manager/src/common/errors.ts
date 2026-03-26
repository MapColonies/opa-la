export class SortQueryRepeatError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, SortQueryRepeatError.prototype);
  }
}

export class SortQueryInvalidFieldError extends Error {
  public constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, SortQueryInvalidFieldError.prototype);
  }
}
