import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// User queries
export const userQueries = {
  async findByEmail(email: string) {
    const result = await sql`
      SELECT id, email, password_hash, first_name, last_name, role, is_email_verified, 
             plan_id, business_name, created_at, updated_at
      FROM users 
      WHERE email = ${email}
    `
    return result[0] || null
  },

  async findById(id: string) {
    const result = await sql`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_email_verified, 
             u.business_name, u.created_at, u.updated_at, p.name as plan_name
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ${id}
    `
    return result[0] || null
  },

  async create(userData: {
    email: string
    password_hash: string
    first_name: string
    last_name: string
    business_name?: string
    plan_id?: string
  }) {
    const result = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, business_name, plan_id)
      VALUES (${userData.email}, ${userData.password_hash}, ${userData.first_name}, 
              ${userData.last_name}, ${userData.business_name || null}, ${userData.plan_id || null})
      RETURNING id, email, first_name, last_name, role, is_email_verified
    `
    return result[0]
  },

  async updateEmailVerification(id: string, isVerified: boolean) {
    await sql`
      UPDATE users 
      SET is_email_verified = ${isVerified}, updated_at = NOW()
      WHERE id = ${id}
    `
  },

  async updatePassword(id: string, password_hash: string) {
    await sql`
      UPDATE users 
      SET password_hash = ${password_hash}, updated_at = NOW()
      WHERE id = ${id}
    `
  },
}

// Session queries
export const sessionQueries = {
  async create(userId: string, sessionToken: string, expiresAt: Date) {
    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${userId}, ${sessionToken}, ${expiresAt})
    `
  },

  async findByToken(sessionToken: string) {
    const result = await sql`
      SELECT s.user_id, s.expires_at, u.email, u.first_name, u.last_name, u.role, 
             u.is_email_verified, u.business_name, p.name as plan_name
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
    `
    return result[0] || null
  },

  async delete(sessionToken: string) {
    await sql`
      DELETE FROM user_sessions 
      WHERE session_token = ${sessionToken}
    `
  },

  async deleteExpired() {
    await sql`
      DELETE FROM user_sessions 
      WHERE expires_at <= NOW()
    `
  },
}

// Audit queries
export const auditQueries = {
  async log(data: {
    user_id?: string
    action: string
    details: any
    ip_address: string
    user_agent: string
  }) {
    await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at)
      VALUES (${data.user_id || null}, ${data.action}, ${JSON.stringify(data.details)}, 
              ${data.ip_address}, ${data.user_agent}, NOW())
    `
  },
}

// Plan queries
export const planQueries = {
  async getAll() {
    return await sql`
      SELECT id, name, description, price, features, is_active, created_at
      FROM plans 
      WHERE is_active = true
      ORDER BY price ASC
    `
  },

  async getById(id: string) {
    const result = await sql`
      SELECT id, name, description, price, features, is_active
      FROM plans 
      WHERE id = ${id}
    `
    return result[0] || null
  },
}

// Media queries
export const mediaQueries = {
  async getFolders(userId: string) {
    return await sql`
      SELECT id, name, parent_id, created_at, updated_at
      FROM media_folders 
      WHERE user_id = ${userId}
      ORDER BY name ASC
    `
  },

  async getAssets(userId: string, folderId?: string) {
    if (folderId) {
      return await sql`
        SELECT id, filename, original_name, file_type, file_size, url, folder_id, created_at
        FROM media_assets 
        WHERE user_id = ${userId} AND folder_id = ${folderId}
        ORDER BY created_at DESC
      `
    } else {
      return await sql`
        SELECT id, filename, original_name, file_type, file_size, url, folder_id, created_at
        FROM media_assets 
        WHERE user_id = ${userId} AND folder_id IS NULL
        ORDER BY created_at DESC
      `
    }
  },

  async createFolder(userId: string, name: string, parentId?: string) {
    const result = await sql`
      INSERT INTO media_folders (user_id, name, parent_id)
      VALUES (${userId}, ${name}, ${parentId || null})
      RETURNING id, name, parent_id, created_at, updated_at
    `
    return result[0]
  },

  async createAsset(data: {
    user_id: string
    filename: string
    original_name: string
    file_type: string
    file_size: number
    url: string
    folder_id?: string
  }) {
    const result = await sql`
      INSERT INTO media_assets (user_id, filename, original_name, file_type, file_size, url, folder_id)
      VALUES (${data.user_id}, ${data.filename}, ${data.original_name}, ${data.file_type}, 
              ${data.file_size}, ${data.url}, ${data.folder_id || null})
      RETURNING id, filename, original_name, file_type, file_size, url, folder_id, created_at
    `
    return result[0]
  },
}
