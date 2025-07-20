export class UserIsBannedError extends Error {
  public constructor(userId: string) {
    super(`User with ID ${userId} is banned`);
    this.name = 'UserIsBannedError';
  }
}
