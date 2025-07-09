import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { getUserById } from "./database"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "user" | "admin"
  business_name?: string
  avatar_url?: string
  plan_name?: string
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function getCurrentUser(request: Request): Promise<User | null> {
  try {
    const authHeader = request.headers.get("authorization")
    const cookieHeader = request.headers.get("cookie")

    let token: string | null = null

    // Check Authorization header first
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }

    // Check cookies if no Authorization header
    if (!token && cookieHeader) {
      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )

      token = cookies.token
    }

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      business_name: user.business_name,
      avatar_url: user.avatar_url,
      plan_name: user.plan_name,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
