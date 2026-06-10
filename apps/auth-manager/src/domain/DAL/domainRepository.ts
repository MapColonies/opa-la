import { inArray } from 'drizzle-orm';
import { domainTable, type Drizzle } from '@map-colonies/auth-core';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { SERVICES } from '@common/constants';

@scoped(Lifecycle.ContainerScoped)
export class DomainRepository {
  public constructor(@inject(SERVICES.DRIZZLE) private readonly db: Drizzle) {}

  public async checkInputForNonExistingDomains(domainNames: string[]): Promise<string[]> {
    const existing = await this.db.select({ name: domainTable.name }).from(domainTable).where(inArray(domainTable.name, domainNames));

    const existingNames = new Set(existing.map((d) => d.name));
    return domainNames.filter((name) => !existingNames.has(name));
  }
}
