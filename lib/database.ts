import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

// User queries
export const userQueries = {
  findByEmail: async (email: string) => {
    const users = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.email = ${email}
      LIMIT 1
    `
    return users[0] || null
  },

  findById: async (id: string) => {
    const users = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ${id}
      LIMIT 1
    `
    return users[0] || null
  },

  create: async (userData: {
    email: string
    password_hash: string
    first_name: string
    last_name: string
    business_name?: string
    email_verification_token: string
  }) => {
    const users = await sql`
      INSERT INTO users (
        email, password_hash, first_name, last_name, business_name, 
        email_verification_token, role, is_active, is_email_verified
      )
      VALUES (
        ${userData.email}, ${userData.password_hash}, ${userData.first_name}, 
        ${userData.last_name}, ${userData.business_name || null}, 
        ${userData.email_verification_token}, 'user', true, false
      )
      RETURNING *
    `
    return users[0]
  },

  updateEmailVerification: async (token: string) => {
    const users = await sql`
      UPDATE users 
      SET is_email_verified = true, email_verification_token = null, updated_at = NOW()
      WHERE email_verification_token = ${token}
      RETURNING *
    `
    return users[0] || null
  },

  setPasswordResetToken: async (email: string, token: string, expiresAt: Date) => {
    const users = await sql`
      UPDATE users 
      SET password_reset_token = ${token}, password_reset_expires = ${expiresAt.toISOString()}, updated_at = NOW()
      WHERE email = ${email}
      RETURNING *
    `
    return users[0] || null
  },

  resetPassword: async (token: string, newPasswordHash: string) => {
    const users = await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, password_reset_token = null, 
          password_reset_expires = null, updated_at = NOW()
      WHERE password_reset_token = ${token} 
        AND password_reset_expires > NOW()
      RETURNING *
    `
    return users[0] || null
  },

  updateProfile: async (
    userId: string,
    updates: {
      first_name?: string
      last_name?: string
      business_name?: string
      business_address?: string
      phone?: string
      avatar_url?: string
    },
  ) => {
    const setClause = Object.entries(updates)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _]) => `${key} = $${key}`)
      .join(", ")

    if (!setClause) return null

    const users = await sql`
      UPDATE users 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `
    return users[0] || null
  },
}

// Session queries
export const sessionQueries = {
  create: async (userId: string, token: string, expiresAt: Date) => {
    const sessions = await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
      RETURNING *
    `
    return sessions[0]
  },

  findByToken: async (token: string) => {
    const sessions = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE s.session_token = ${token} 
        AND s.expires_at > NOW()
        AND u.is_active = true
      LIMIT 1
    `
    return sessions[0] || null
  },

  delete: async (token: string) => {
    await sql`
      DELETE FROM user_sessions 
      WHERE session_token = ${token}
    `
  },

  cleanup: async () => {
    await sql`
      DELETE FROM user_sessions 
      WHERE expires_at <= NOW()
    `
  },
}

// Audit queries
export const auditQueries = {
  log: async (data: { user_id: string; action: string; details?: any; ip_address?: string }) => {
    const logs = await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (${data.user_id}, ${data.action}, ${JSON.stringify(data.details || {})}, ${data.ip_address || null})
      RETURNING *
    `
    return logs[0]
  },

  findByUser: async (userId: string, limit = 50) => {
    const logs = await sql`
      SELECT * FROM audit_logs 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return logs
  },
}

// Plan queries
export const planQueries = {
  findAll: async () => {
    const plans = await sql`
      SELECT * FROM plans 
      ORDER BY price ASC
    `
    return plans
  },

  findById: async (id: string) => {
    const plans = await sql`
      SELECT * FROM plans 
      WHERE id = ${id}
      LIMIT 1
    `
    return plans[0] || null
  },

  findActive: async () => {
    const plans = await sql`
      SELECT * FROM plans 
      WHERE is_active = true
      ORDER BY price ASC
    `
    return plans
  },
}

// Media queries
export const mediaQueries = {
  create: async (data: {
    user_id: string
    filename: string
    original_name: string
    mime_type: string
    size: number
    url: string
    folder_id?: string
  }) => {
    const media = await sql`
      INSERT INTO media_assets (
        user_id, filename, original_name, mime_type, size, url, folder_id
      )
      VALUES (
        ${data.user_id}, ${data.filename}, ${data.original_name}, 
        ${data.mime_type}, ${data.size}, ${data.url}, ${data.folder_id || null}
      )
      RETURNING *
    `
    return media[0]
  },

  findByUser: async (userId: string, folderId?: string) => {
    if (folderId) {
      const media = await sql`
        SELECT * FROM media_assets 
        WHERE user_id = ${userId} AND folder_id = ${folderId}
        ORDER BY created_at DESC
      `
      return media
    } else {
      const media = await sql`
        SELECT * FROM media_assets 
        WHERE user_id = ${userId} AND folder_id IS NULL
        ORDER BY created_at DESC
      `
      return media
    }
  },

  delete: async (id: string, userId: string) => {
    const media = await sql`
      DELETE FROM media_assets 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `
    return media[0] || null
  },
}

// Folder queries
export const folderQueries = {
  create: async (data: { user_id: string; name: string; parent_id?: string }) => {
    const folders = await sql`
      INSERT INTO media_folders (user_id, name, parent_id)
      VALUES (${data.user_id}, ${data.name}, ${data.parent_id || null})
      RETURNING *
    `
    return folders[0]
  },

  findByUser: async (userId: string, parentId?: string) => {
    if (parentId) {
      const folders = await sql`
        SELECT * FROM media_folders 
        WHERE user_id = ${userId} AND parent_id = ${parentId}
        ORDER BY name ASC
      `
      return folders
    } else {
      const folders = await sql`
        SELECT * FROM media_folders 
        WHERE user_id = ${userId} AND parent_id IS NULL
        ORDER BY name ASC
      `
      return folders
    }
  },

  delete: async (id: string, userId: string) => {
    const folders = await sql`
      DELETE FROM media_folders 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `
    return folders[0] || null
  },
}
