import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(process.env.DATABASE_URL)

export interface User {
  id: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  role: "user" | "admin" | "super_admin"
  is_email_verified: boolean
  email_verification_token?: string
  password_reset_token?: string
  password_reset_expires?: Date
  plan_id?: string
  plan_name?: string
  max_screens?: number
  max_storage_gb?: number
  max_playlists?: number
  business_name?: string
  business_address?: string
  phone?: string
  avatar_url?: string
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
}

export interface Plan {
  id: string
  name: string
  description?: string
  price_monthly: number
  price_yearly: number
  max_screens: number
  max_storage_gb: number
  max_playlists: number
  features: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Feature {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface PlanFeature {
  plan_id: string
  feature_id: string
  created_at: Date
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: Date
}

export const userQueries = {
  findByEmail: async (email: string): Promise<User | null> => {
    const result = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.email = ${email}
      LIMIT 1
    `
    return result[0] || null
  },

  findById: async (id: string): Promise<User | null> => {
    const result = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ${id}
      LIMIT 1
    `
    return result[0] || null
  },

  create: async (userData: {
    email: string
    password_hash: string
    first_name: string
    last_name: string
    business_name?: string
    email_verification_token: string
  }): Promise<User> => {
    const result = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, business_name, email_verification_token)
      VALUES (${userData.email}, ${userData.password_hash}, ${userData.first_name}, ${userData.last_name}, ${userData.business_name || null}, ${userData.email_verification_token})
      RETURNING *
    `
    return result[0]
  },

  updateEmailVerification: async (token: string): Promise<User | null> => {
    const result = await sql`
      UPDATE users 
      SET is_email_verified = true, email_verification_token = NULL, updated_at = NOW()
      WHERE email_verification_token = ${token}
      RETURNING *
    `
    return result[0] || null
  },

  setPasswordResetToken: async (email: string, token: string, expiresAt: Date): Promise<void> => {
    await sql`
      UPDATE users 
      SET password_reset_token = ${token}, password_reset_expires = ${expiresAt}, updated_at = NOW()
      WHERE email = ${email}
    `
  },

  resetPassword: async (token: string, passwordHash: string): Promise<User | null> => {
    const result = await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW()
      WHERE password_reset_token = ${token} AND password_reset_expires > NOW()
      RETURNING *
    `
    return result[0] || null
  },

  updateProfile: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    const setClause = Object.keys(updates)
      .map((key) => `${key} = $${Object.keys(updates).indexOf(key) + 2}`)
      .join(", ")

    const values = [userId, ...Object.values(updates)]

    const result = await sql`
      UPDATE users 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `
    return result[0] || null
  },

  findAll: async (limit = 50, offset = 0): Promise<User[]> => {
    const result = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result
  },

  updateRole: async (userId: string, role: "user" | "admin" | "super_admin"): Promise<User | null> => {
    const result = await sql`
      UPDATE users 
      SET role = ${role}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `
    return result[0] || null
  },
}

export const sessionQueries = {
  create: async (userId: string, token: string, expiresAt: Date): Promise<Session> => {
    const result = await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
      RETURNING *
    `
    return result[0]
  },

  findByToken: async (token: string): Promise<(User & Session) | null> => {
    const result = await sql`
      SELECT s.*, u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    return result[0] || null
  },

  delete: async (token: string): Promise<void> => {
    await sql`DELETE FROM sessions WHERE token = ${token}`
  },

  deleteExpired: async (): Promise<void> => {
    await sql`DELETE FROM sessions WHERE expires_at <= NOW()`
  },
}

export const planQueries = {
  findAll: async (): Promise<Plan[]> => {
    const result = await sql`
      SELECT * FROM plans
      ORDER BY price_monthly ASC
    `
    return result
  },

  findById: async (id: string): Promise<Plan | null> => {
    const result = await sql`
      SELECT * FROM plans
      WHERE id = ${id}
      LIMIT 1
    `
    return result[0] || null
  },

  create: async (planData: {
    name: string
    description?: string
    price_monthly: number
    price_yearly: number
    max_screens: number
    max_storage_gb: number
    max_playlists: number
    features: string[]
    is_active: boolean
  }): Promise<Plan> => {
    const result = await sql`
      INSERT INTO plans (name, description, price_monthly, price_yearly, max_screens, max_storage_gb, max_playlists, features, is_active)
      VALUES (${planData.name}, ${planData.description || null}, ${planData.price_monthly}, ${planData.price_yearly}, ${planData.max_screens}, ${planData.max_storage_gb}, ${planData.max_playlists}, ${JSON.stringify(planData.features)}, ${planData.is_active})
      RETURNING *
    `
    return result[0]
  },

  update: async (
    id: string,
    planData: Partial<{
      name: string
      description: string
      price_monthly: number
      price_yearly: number
      max_screens: number
      max_storage_gb: number
      max_playlists: number
      features: string[]
      is_active: boolean
    }>,
  ): Promise<Plan | null> => {
    const updates = { ...planData }
    if (updates.features) {
      updates.features = JSON.stringify(updates.features) as any
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")

    const values = [id, ...Object.values(updates)]

    const result = await sql`
      UPDATE plans 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] || null
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await sql`
      DELETE FROM plans 
      WHERE id = ${id}
    `
    return result.count > 0
  },
}

export const featureQueries = {
  findAll: async (): Promise<Feature[]> => {
    const result = await sql`
      SELECT * FROM features
      ORDER BY name ASC
    `
    return result
  },

  findById: async (id: string): Promise<Feature | null> => {
    const result = await sql`
      SELECT * FROM features
      WHERE id = ${id}
      LIMIT 1
    `
    return result[0] || null
  },

  create: async (featureData: {
    name: string
    description?: string
    is_active: boolean
  }): Promise<Feature> => {
    const result = await sql`
      INSERT INTO features (name, description, is_active)
      VALUES (${featureData.name}, ${featureData.description || null}, ${featureData.is_active})
      RETURNING *
    `
    return result[0]
  },

  update: async (
    id: string,
    featureData: Partial<{
      name: string
      description: string
      is_active: boolean
    }>,
  ): Promise<Feature | null> => {
    const setClause = Object.keys(featureData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")

    const values = [id, ...Object.values(featureData)]

    const result = await sql`
      UPDATE features 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] || null
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await sql`
      DELETE FROM features 
      WHERE id = ${id}
    `
    return result.count > 0
  },
}

export const auditQueries = {
  log: async (logData: {
    user_id?: string
    action: string
    details: Record<string, any>
    ip_address?: string
    user_agent?: string
  }): Promise<AuditLog> => {
    const result = await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
      VALUES (${logData.user_id || null}, ${logData.action}, ${JSON.stringify(logData.details)}, ${logData.ip_address || null}, ${logData.user_agent || null})
      RETURNING *
    `
    return result[0]
  },

  findByUser: async (userId: string, limit = 50, offset = 0): Promise<AuditLog[]> => {
    const result = await sql`
      SELECT * FROM audit_logs
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result
  },

  findAll: async (limit = 100, offset = 0): Promise<AuditLog[]> => {
    const result = await sql`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result
  },
}

export const executeQuery = async (query: string, params: any[] = []): Promise<any[]> => {
  try {
    console.log("Executing query:", query)
    console.log("With params:", params)

    const result = await sql.unsafe(query, params)
    console.log("Query result:", result)

    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export default sql
