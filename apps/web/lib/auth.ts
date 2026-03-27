import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";

import { db, type User } from "@rankforge/db";

import { env, isGoogleAuthConfigured } from "./env";

const providers = isGoogleAuthConfigured
  ? [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            scope:
              env.GOOGLE_SEARCH_CONSOLE_SCOPES ??
              "openid email profile https://www.googleapis.com/auth/webmasters.readonly",
            access_type: "offline",
            prompt: "consent"
          }
        }
      })
    ]
  : [];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database"
  },
  secret: env.NEXTAUTH_SECRET,
  providers,
  pages: {
    signIn: "/sign-in"
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    }
  }
};

export async function getAppSession() {
  if (!isGoogleAuthConfigured || !env.NEXTAUTH_SECRET) {
    const demoUser = await db.user.findUnique({
      where: {
        email: "demo@rankforge.local"
      }
    });

    if (!demoUser) {
      return null;
    }

    return {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        image: demoUser.image
      }
    } satisfies Session;
  }

  return getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getAppSession();

  if (!session?.user?.id) {
    return null;
  }

  return db.user.findUnique({
    where: {
      id: session.user.id
    }
  });
}

export async function requireAppUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
