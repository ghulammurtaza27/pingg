import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"
import { compare } from "bcrypt"

export const nextAuthConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly',
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required")
          }
      
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true,
              preferences: true
            }
          })
      
          if (!user) {
            throw new Error("User not found")
          }
      
          const isPasswordValid = await compare(credentials.password, user.password)
      
          if (!isPasswordValid) {
            throw new Error("Invalid password")
          }
      
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            preferences: user.preferences
          }
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        try {
          if (!profile?.email) {
            console.error("No email found in Google profile");
            return false;
          }
  
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              password: true,
              preferences: true,
              gmailIntegrated: true
            }
          });
  
          if (existingUser) {
            profile.id = existingUser.id;
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                gmailIntegrated: true,
                gmailAccessToken: account.access_token || '',
                gmailRefreshToken: account.refresh_token || '',
                name: existingUser.name || profile.name,
                image: existingUser.image || profile.picture,
              }
            });
          } else {
            const newUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name || '',
                image: profile.picture || null,
                password: '',
                emailVerified: new Date(),
                gmailIntegrated: true,
                gmailAccessToken: account.access_token || '',
                gmailRefreshToken: account.refresh_token || '',
              }
            });
            profile.id = newUser.id;
          }
  
          return true;
        } catch (error) {
          console.error("Detailed Google sign-in error:", error);
          return false;
        }
      }
      return true; // Allow sign-in for other providers
    },

    async jwt({ token, user, account, profile }) {
      if (account && profile) {
        if (account.provider === "google") {
          token.id = profile.id;
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
        } else if (account.provider === "credentials") {
          token.id = user.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
          session.refreshToken = token.refreshToken as string;
        }
      }
      return session;
    }
  },
  events: {
    async signIn(message) {
      console.log('Sign in event', message);
    },
    async error(message) {
      console.error('NextAuth error', message);
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}