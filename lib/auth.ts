import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { userQueries, sessionQueries, auditQueries } from "./database"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

const JWT_SECRET = process.env.JWT_SECRET
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "user" | "admin"
  is_email_verified: boolean
  plan_id?: string
  plan_name?: string
  max_screens?: number
  max_storage_gb?: number
  max_playlists?: number
  business_name?: string
  business_address?: string
  phone?: string
  avatar_url?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  message?: string
  error?: string
}

export const passwordUtils = {
  hash: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 12)
  },

  verify: async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash)
  },

  validate: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    return { valid: errors.length === 0, errors }
  },
}

export const tokenUtils = {
  generateSessionToken: (): string => {
    return crypto.randomBytes(32).toString("hex")
  },

  generateEmailToken: (): string => {
    return crypto.randomBytes(32).toString("hex")
  },

  generateJWT: (payload: any): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
  },

  verifyJWT: (token: string): any => {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return null
    }
  },
}

export const authService = {
  register: async (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    business_name?: string
  }): Promise<AuthResult> => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return { success: false, error: "Invalid email format" }
      }

      const passwordValidation = passwordUtils.validate(data.password)
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.errors.join(", ") }
      }

      const existingUser = await userQueries.findByEmail(data.email)
      if (existingUser) {
        return { success: false, error: "User with this email already exists" }
      }

      const passwordHash = await passwordUtils.hash(data.password)
      const emailVerificationToken = tokenUtils.generateEmailToken()

      const user = await userQueries.create({
        email: data.email,
        password_hash: passwordHash,
        first_name: data.first_name,
        last_name: data.last_name,
        business_name: data.business_name,
        email_verification_token: emailVerificationToken,
      })

      await auditQueries.log({
        user_id: user.id,
        action: "user_registered",
        details: { email: data.email },
      })

      return {
        success: true,
        user: user as User,
        message: "Registration successful. Please check your email to verify your account.",
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "Registration failed. Please try again." }
    }
  },

  login: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const user = await userQueries.findByEmail(email)
      if (!user) {
        return { success: false, error: "Invalid email or password" }
      }

      const isValidPassword = await passwordUtils.verify(password, user.password_hash)
      if (!isValidPassword) {
        return { success: false, error: "Invalid email or password" }
      }

      const sessionToken = tokenUtils.generateSessionToken()
      const expiresAt = new Date(Date.now() + SESSION_DURATION)

      await sessionQueries.create(user.id, sessionToken, expiresAt)

      const {
        password_hash,
        email_verification_token,
        password_reset_token,
        password_reset_expires,
        ...userWithoutSensitiveData
      } = user

      return {
        success: true,
        user: userWithoutSensitiveData as User,
        token: sessionToken,
        message: "Login successful",
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Login failed. Please try again." }
    }
  },

  verifySession: async (sessionToken: string): Promise<User | null> => {
    try {
      const session = await sessionQueries.findByToken(sessionToken)
      if (!session) {
        return null
      }

      const { password_hash, email_verification_token, password_reset_token, password_reset_expires, ...user } = session
      return user as User
    } catch (error) {
      console.error("Session verification error:", error)
      return null
    }
  },
}

export const requireAuth = async (sessionToken?: string): Promise<User | null> => {
  if (!sessionToken) {
    return null
  }
  return await authService.verifySession(sessionToken)
}

export const requireAdmin = (user: User | null): boolean => {
  return user?.role === "admin"
}
