import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "@/config/db.connection";

export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0].value;
      const name = profile.displayName;

      if (!email) {
        return done(new Error("No email from Google"), undefined);
      }

      const existedIdentity = await prisma.userIdentity.findUnique({
        where: {
          provider_providerId: {
            provider: "google",
            providerId: googleId,
          },
        },
        include: { user: true },
      });

      //  Linked account existed
      if (existedIdentity) {
        return done(null, existedIdentity.user);
      }

      // Email-integrated account, but not linked
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        prisma.userIdentity.create({
          data: {
            userId: existingUser.id,
            provider: "google",
            providerId: googleId,
          },
        });

        return done(null, existingUser);
      }

      // Nor email-integrated nor linked
      const newUser = await prisma.user.create({
        data: {
          email,
          fullName: name,
          userName: name.toLowerCase().split(" ").join(""),
          password: null,
          isActive: true,
          identity: {
            create: {
              provider: "google",
              providerId: googleId,
            },
          },
        },
      });

      return done(null, newUser);
    } catch (error) {
      return done(error as Error, undefined);
    }
  },
);
