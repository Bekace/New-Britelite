import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { userQueries } from "./database"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set")
}

const JWT_SECRET = process.env.JWT_SECRET

// Token utilities
export const tokenUtils = {
  generateToken(payload: object, expiresIn = "7d") {
    return jwt.sign(payload, JWT_SECRET, { expiresIn })
  },

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as any
    } catch (error) {
      return null
    }
  },

  generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },
}

// Password utilities
export const passwordUtils = {
  async hash(password: string) {
    return await bcrypt.hash(password, 12)
  },

  async verify(password: string, hash: string) {
    return await bcrypt.compare(password, hash)
  },

  validate(password: string) {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" }
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" }
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" }
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" }
    }
    return { valid: true }
  },
}

// Auth service
export const authService = {
  async login(email: string, password: string) {
    const user = await userQueries.findByEmail(email)
    if (!user) {
      throw new Error("Invalid credentials")
    }

    const isValidPassword = await passwordUtils.verify(password, user.password_hash)
    if (!isValidPassword) {
      throw new Error("Invalid credentials")
    }

    if (!user.email_verified) {
      throw new Error("Please verify your email before logging in")
    }

    const token = tokenUtils.generateToken({ userId: user.id })

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return { user: { ...user, password_hash: undefined }, token }
  },

  async register(userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    business_name?: string
  }) {
    // Validate password
    const passwordValidation = passwordUtils.validate(userData.password)
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message)
    }

    // Check if user exists
    const existingUser = await userQueries.findByEmail(userData.email)
    if (existingUser) {
      throw new Error("User already exists with this email")
    }

    // Hash password
    const password_hash = await passwordUtils.hash(userData.password)

    // Create user
    const user = await userQueries.create({
      ...userData,
      password_hash,
    })

    return { user: { ...user, password_hash: undefined } }
  },

  async logout() {
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")
  },
}

// Get current user from request
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const decoded = tokenUtils.verifyToken(token)
    if (!decoded || !decoded.userId) {
      return null
    }

    const user = await userQueries.findById(decoded.userId)
    if (!user) {
      return null
    }

    return { ...user, password_hash: undefined }
  } catch (error) {
    return null
  }
}
