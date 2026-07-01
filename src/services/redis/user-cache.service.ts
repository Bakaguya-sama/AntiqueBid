import { BaseCacheService } from "./base-cache.service";

export class UserCacheService extends BaseCacheService {
  protected readonly ttl = 1800;
  protected readonly keyPrefix = "user_details";
}

export const userCacheService = new UserCacheService();
