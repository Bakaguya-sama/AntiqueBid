import type { AccessTokenPayload } from "./jwt.types";

declare global {
  namespace Express {
    interface User extends AccessTokenPayload {}

    interface Request {
      user?: User;
    }
  }
}

export {};
