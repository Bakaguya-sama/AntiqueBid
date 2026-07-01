import { BaseCacheService } from "./base-cache.service";

export class AntiqueCacheService extends BaseCacheService {
  protected readonly ttl = 3600;
  protected readonly keyPrefix = "antique_details";
}

export const antiqueCacheService = new AntiqueCacheService();
