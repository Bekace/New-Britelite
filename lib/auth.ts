import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sql } from "./database"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
  updated_at: string
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  },

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  },

  generateToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
  },

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return null
    }
  },

  async createSession(userId: string): Promise<Session> {
    const token = this.generateToken({ userId })
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const result = await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
      RETURNING *
    `

    return result[0] as Session
  },

  async verifySession(token: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT u.*, s.expires_at
        FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.token = ${token} AND s.expires_at > NOW() AND u.is_active = true
      `

      if (result.length === 0) {
        return null
      }

      const { expires_at, ...user } = result[0]
      return user as User
    } catch (error) {
      console.error("Session verification error:", error)
      return null
    }
  },

  async deleteSession(token: string): Promise<void> {
    await sql`
      DELETE FROM sessions WHERE token = ${token}
    `
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT * FROM users WHERE id = ${id} AND is_active = true
      `

      if (result.length === 0) {
        return null
      }

      return result[0] as User
    } catch (error) {
      console.error("Get user error:", error)
      return null
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT * FROM users WHERE email = ${email} AND is_active = true
      `

      if (result.length === 0) {
        return null
      }

      return result[0] as User
    } catch (error) {
      console.error("Get user by email error:", error)
      return null
    }
  },
}

export async function getUserFromSession(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("session")?.value
    if (!token) {
      return null
    }

    return await authService.verifySession(token)
  } catch (error) {
    console.error("Get user from session error:", error)
    return null
  }
}
