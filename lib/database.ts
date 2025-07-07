import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

export const userQueries = {
  findByEmail: async (email: string) => {
    const result = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.email = ${email} AND u.is_active = true
    `
    return result[0] || null
  },

  findById: async (id: string) => {
    const result = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ${id} AND u.is_active = true
    `
    return result[0] || null
  },

  create: async (userData: {
    email: string
    password_hash: string
    first_name: string
    last_name: string
    plan_id?: string
    business_name?: string
    email_verification_token?: string
  }) => {
    const result = await sql`
      INSERT INTO users (
        email, password_hash, first_name, last_name, plan_id, 
        business_name, email_verification_token
      )
      VALUES (
        ${userData.email}, ${userData.password_hash}, ${userData.first_name}, 
        ${userData.last_name}, ${userData.plan_id || null}, 
        ${userData.business_name || null}, ${userData.email_verification_token || null}
      )
      RETURNING id, email, first_name, last_name, role, is_email_verified
    `
    return result[0]
  },

  updateEmailVerification: async (token: string) => {
    const result = await sql`
      UPDATE users 
      SET is_email_verified = true, email_verification_token = null, updated_at = CURRENT_TIMESTAMP
      WHERE email_verification_token = ${token}
      RETURNING id, email, is_email_verified
    `
    return result[0] || null
  },

  updateVerificationToken: async (email: string, token: string) => {
    const result = await sql`
      UPDATE users 
      SET email_verification_token = ${token}, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
      RETURNING id, email
    `
    return result[0] || null
  },

  setPasswordResetToken: async (email: string, token: string, expires: Date) => {
    const result = await sql`
      UPDATE users 
      SET password_reset_token = ${token}, password_reset_expires = ${expires.toISOString()}, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
      RETURNING id, email
    `
    return result[0] || null
  },

  resetPassword: async (token: string, newPasswordHash: string) => {
    const result = await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, password_reset_token = null, 
          password_reset_expires = null, updated_at = CURRENT_TIMESTAMP
      WHERE password_reset_token = ${token} 
        AND password_reset_expires > CURRENT_TIMESTAMP
      RETURNING id, email
    `
    return result[0] || null
  },
}

export const sessionQueries = {
  create: async (userId: string, sessionToken: string, expiresAt: Date) => {
    const result = await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${userId}, ${sessionToken}, ${expiresAt.toISOString()})
      RETURNING id, session_token, expires_at
    `
    return result[0]
  },

  findByToken: async (sessionToken: string) => {
    const result = await sql`
      SELECT s.*, u.id as user_id, u.email, u.role, u.is_email_verified
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken} 
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `
    return result[0] || null
  },

  delete: async (sessionToken: string) => {
    await sql`DELETE FROM user_sessions WHERE session_token = ${sessionToken}`
  },
}

export const planQueries = {
  getAll: async () => {
    return await sql`
      SELECT * FROM plans WHERE is_active = true ORDER BY price ASC
    `
  },

  getById: async (id: string) => {
    const result = await sql`
      SELECT * FROM plans WHERE id = ${id} AND is_active = true
    `
    return result[0] || null
  },
}

export const auditQueries = {
  log: async (data: {
    user_id?: string
    action: string
    resource_type?: string
    resource_id?: string
    details?: any
    ip_address?: string
    user_agent?: string
  }) => {
    await sql`
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent
      )
      VALUES (
        ${data.user_id || null}, ${data.action}, ${data.resource_type || null}, 
        ${data.resource_id || null}, ${JSON.stringify(data.details) || null}, 
        ${data.ip_address || null}, ${data.user_agent || null}
      )
    `
  },
}
