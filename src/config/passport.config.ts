import passport from "passport";
import { googleStrategy } from "@/modules/auth/strategies/google.strategy";

passport.use("google", googleStrategy);

export default passport;
