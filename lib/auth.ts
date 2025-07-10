import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { sessionQueries, userQueries, type User } from "@/lib/database"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export interface AuthUser extends User {
  plan_name?: string
  max_screens?: number
  max_storage_gb?: number
  max_playlists?: number
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  },

  generateToken(): string {
    return crypto.randomBytes(32).toString("hex")
  },

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex")
  },

  async createSession(userId: string): Promise<string> {
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await sessionQueries.create(userId, token, expiresAt)
    return token
  },

  async verifySession(token: string): Promise<AuthUser | null> {
    try {
      const session = await sessionQueries.findByToken(token)
      return session || null
    } catch (error) {
      console.error("Session verification error:", error)
      return null
    }
  },

  async deleteSession(token: string): Promise<void> {
    await sessionQueries.delete(token)
  },

  async login(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    try {
      const user = await userQueries.findByEmail(email)
      if (!user || !user.is_email_verified) {
        return null
      }

      const isValidPassword = await this.verifyPassword(password, user.password_hash)
      if (!isValidPassword) {
        return null
      }

      const token = await this.createSession(user.id)
      return { user, token }
    } catch (error) {
      console.error("Login error:", error)
      return null
    }
  },

  async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    businessName?: string
  }): Promise<User | null> {
    try {
      const existingUser = await userQueries.findByEmail(userData.email)
      if (existingUser) {
        throw new Error("User already exists")
      }

      const passwordHash = await this.hashPassword(userData.password)
      const verificationToken = this.generateVerificationToken()

      const user = await userQueries.create({
        email: userData.email,
        password_hash: passwordHash,
        first_name: userData.firstName,
        last_name: userData.lastName,
        business_name: userData.businessName,
        email_verification_token: verificationToken,
      })

      return user
    } catch (error) {
      console.error("Registration error:", error)
      return null
    }
  },

  async verifyEmail(token: string): Promise<User | null> {
    try {
      return await userQueries.updateEmailVerification(token)
    } catch (error) {
      console.error("Email verification error:", error)
      return null
    }
  },

  async requestPasswordReset(email: string): Promise<string | null> {
    try {
      const user = await userQueries.findByEmail(email)
      if (!user) {
        return null
      }

      const resetToken = this.generateToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await userQueries.setPasswordResetToken(email, resetToken, expiresAt)
      return resetToken
    } catch (error) {
      console.error("Password reset request error:", error)
      return null
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<User | null> {
    try {
      const passwordHash = await this.hashPassword(newPassword)
      return await userQueries.resetPassword(token, passwordHash)
    } catch (error) {
      console.error("Password reset error:", error)
      return null
    }
  },
}

export async function getCurrentUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const cookieStore = request.cookies
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return null
    }

    return await authService.verifySession(sessionToken)
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      return null
    }

    return await authService.verifySession(sessionToken)
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Admin access required")
  }
  return user
}
