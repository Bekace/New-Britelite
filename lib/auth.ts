import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sql } from "@/lib/database"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Types
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "user" | "admin" | "super_admin"
  business_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  business_name?: string
}

// Password utilities
export const passwordUtils = {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  },

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  },

  validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },
}

// Token utilities
export const tokenUtils = {
  generate(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
  },

  verify(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return null
    }
  },

  decode(token: string): any {
    try {
      return jwt.decode(token)
    } catch (error) {
      return null
    }
  },
}

// Auth service
export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string } | null> {
    try {
      const result = await sql`
        SELECT id, email, password_hash, first_name, last_name, role, business_name, avatar_url, created_at, updated_at
        FROM users 
        WHERE email = ${credentials.email} AND email_verified = true
      `

      if (result.length === 0) {
        return null
      }

      const user = result[0]
      const isValidPassword = await passwordUtils.verify(credentials.password, user.password_hash)

      if (!isValidPassword) {
        return null
      }

      const token = tokenUtils.generate({ userId: user.id, email: user.email })

      const { password_hash, ...userWithoutPassword } = user

      return {
        user: userWithoutPassword as User,
        token,
      }
    } catch (error) {
      console.error("Login error:", error)
      return null
    }
  },

  async register(data: RegisterData): Promise<{ user: User; token: string } | null> {
    try {
      const passwordValidation = passwordUtils.validate(data.password)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(", "))
      }

      const hashedPassword = await passwordUtils.hash(data.password)

      const result = await sql`
        INSERT INTO users (email, password_hash, first_name, last_name, business_name, role)
        VALUES (${data.email}, ${hashedPassword}, ${data.first_name}, ${data.last_name}, ${data.business_name || null}, 'user')
        RETURNING id, email, first_name, last_name, role, business_name, avatar_url, created_at, updated_at
      `

      if (result.length === 0) {
        return null
      }

      const user = result[0] as User
      const token = tokenUtils.generate({ userId: user.id, email: user.email })

      return { user, token }
    } catch (error) {
      console.error("Registration error:", error)
      return null
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT id, email, first_name, last_name, role, business_name, avatar_url, created_at, updated_at
        FROM users 
        WHERE id = ${id}
      `

      return result.length > 0 ? (result[0] as User) : null
    } catch (error) {
      console.error("Get user by ID error:", error)
      return null
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const setClause = Object.keys(updates)
        .map((key) => `${key} = $${Object.keys(updates).indexOf(key) + 2}`)
        .join(", ")

      const values = [id, ...Object.values(updates)]

      const result = await sql`
        UPDATE users 
        SET ${sql.unsafe(setClause)}, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, first_name, last_name, role, business_name, avatar_url, created_at, updated_at
      `.apply(null, values)

      return result.length > 0 ? (result[0] as User) : null
    } catch (error) {
      console.error("Update user error:", error)
      return null
    }
  },
}

// Get current user from request
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const payload = tokenUtils.verify(token)
    if (!payload || !payload.userId) {
      return null
    }

    return await authService.getUserById(payload.userId)
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

// Get current user from NextRequest (for API routes)
export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return null
    }

    const payload = tokenUtils.verify(token)
    if (!payload || !payload.userId) {
      return null
    }

    return await authService.getUserById(payload.userId)
  } catch (error) {
    console.error("Get current user from request error:", error)
    return null
  }
}

// Middleware helper
export function requireAuth(roles?: string[]) {
  return async (request: NextRequest) => {
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      return false
    }

    if (roles && !roles.includes(user.role)) {
      return false
    }

    return user
  }
}
