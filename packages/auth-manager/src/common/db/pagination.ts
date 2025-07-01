export const DEFAULT_PAGE_SIZE = 10;
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function paginationParamsToFindOptions(paginationParams?: PaginationParams): { take?: number; skip?: number } {
  if (paginationParams === undefined) {
    return {};
  }

  const { page, pageSize } = paginationParams;

  return {
    take: pageSize,
    skip: (page - 1) * pageSize,
  };
}
