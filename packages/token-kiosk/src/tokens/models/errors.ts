export class UserIsBannedError extends Error {
  public constructor(message = 'User is banned') {
    super(message);
    this.name = 'UserIsBannedError';
  }
}
