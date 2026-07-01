import { BaseCacheService } from "./base-cache.service";

export class AntiqueCategoryCacheService extends BaseCacheService {
  protected readonly ttl = 86400;
  protected readonly keyPrefix = "antique_category_details";
}

export const antiqueCategoryCacheService = new AntiqueCategoryCacheService();
