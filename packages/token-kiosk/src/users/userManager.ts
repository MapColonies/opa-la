import { inject, injectable } from 'tsyringe';
import { eq } from 'drizzle-orm';
import { SERVICES } from '@src/common/constants';
import { type Drizzle } from '@src/db/createConnection';
import { User, UserInsert, users } from './user';

type CreateUser = Omit<UserInsert, 'createdAt' | 'isBanned' | 'tokenCreationDate' | 'tokenCreationCount'>;
type UpdateUser = Partial<Omit<UserInsert, 'createdAt' | 'isBanned' | 'id'>>;

@injectable()
export class UserManager {
  public constructor(@inject(SERVICES.DRIZZLE) private readonly drizzle: Drizzle) {}

  public async getUserById(userId: string): Promise<User | undefined> {
    const result = await this.drizzle.query.users.findFirst({ where: eq(users.id, userId) });
    return result;
  }

  public async createUser(user: CreateUser): Promise<User> {
    const result = await this.drizzle
      .insert(users)
      .values({ ...user, tokenCreationCount: 1 })
      .returning();
    if (result.length === 0 || !result[0]) {
      throw new Error('Failed to create user');
    }
    return result[0];
  }

  public async updateUser(userId: string, userData: UpdateUser): Promise<User> {
    const result = await this.drizzle.update(users).set(userData).where(eq(users.id, userId)).returning();
    if (result.length === 0 || !result[0]) {
      throw new Error('Failed to update user');
    }
    return result[0];
  }
}
