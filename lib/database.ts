import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// User queries
export const userQueries = {
  async findByEmail(email: string) {
    const result = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.email = ${email}
    `
    return result[0] || null
  },

  async findById(id: string) {
    const result = await sql`
      SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb
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
      VALUES (${userData.email}, ${userData.password_hash}, ${userData.first_name}, ${userData.last_name}, ${userData.business_name || null}, ${userData.plan_id || null})
      RETURNING *
    `
    return result[0]
  },

  async updateProfile(
    id: string,
    data: {
      first_name?: string
      last_name?: string
      business_name?: string
      avatar_url?: string
    },
  ) {
    const result = await sql`
      UPDATE users 
      SET 
        first_name = COALESCE(${data.first_name}, first_name),
        last_name = COALESCE(${data.last_name}, last_name),
        business_name = COALESCE(${data.business_name}, business_name),
        avatar_url = COALESCE(${data.avatar_url}, avatar_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0]
  },

  async updatePassword(id: string, password_hash: string) {
    await sql`
      UPDATE users 
      SET password_hash = ${password_hash}, updated_at = NOW()
      WHERE id = ${id}
    `
  },

  async setEmailVerified(id: string) {
    await sql`
      UPDATE users 
      SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
    `
  },

  async getAllUsers(limit = 50, offset = 0) {
    return await sql`
      SELECT u.*, p.name as plan_name
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  },

  async updateUserRole(id: string, role: string) {
    const result = await sql`
      UPDATE users 
      SET role = ${role}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0]
  },
}

// Media queries
export const mediaQueries = {
  async createFolder(data: {
    name: string
    parent_id?: string
    user_id: string
  }) {
    const result = await sql`
      INSERT INTO media_folders (name, parent_id, user_id)
      VALUES (${data.name}, ${data.parent_id || null}, ${data.user_id})
      RETURNING *
    `
    return result[0]
  },

  async getFolders(user_id: string, parent_id?: string) {
    return await sql`
      SELECT * FROM media_folders
      WHERE user_id = ${user_id} AND parent_id ${parent_id ? `= ${parent_id}` : "IS NULL"}
      ORDER BY name ASC
    `
  },

  async createAsset(data: {
    filename: string
    original_filename: string
    file_type: string
    file_size: number
    mime_type: string
    blob_url: string
    thumbnail_url?: string
    folder_id?: string
    user_id: string
    metadata?: object
  }) {
    const result = await sql`
      INSERT INTO media_assets (
        filename, original_filename, file_type, file_size, mime_type, 
        blob_url, thumbnail_url, folder_id, user_id, metadata
      )
      VALUES (
        ${data.filename}, ${data.original_filename}, ${data.file_type}, 
        ${data.file_size}, ${data.mime_type}, ${data.blob_url}, 
        ${data.thumbnail_url || null}, ${data.folder_id || null}, 
        ${data.user_id}, ${JSON.stringify(data.metadata || {})}
      )
      RETURNING *
    `
    return result[0]
  },

  async getAssets(user_id: string, folder_id?: string, search?: string) {
    let query = `
      SELECT * FROM media_assets
      WHERE user_id = ${user_id}
    `

    if (folder_id) {
      query += ` AND folder_id = ${folder_id}`
    } else {
      query += ` AND folder_id IS NULL`
    }

    if (search) {
      query += ` AND (original_filename ILIKE '%${search}%' OR filename ILIKE '%${search}%')`
    }

    query += ` ORDER BY created_at DESC`

    return await sql.unsafe(query)
  },

  async deleteAsset(id: string, user_id: string) {
    const result = await sql`
      DELETE FROM media_assets
      WHERE id = ${id} AND user_id = ${user_id}
      RETURNING blob_url, thumbnail_url
    `
    return result[0]
  },

  async deleteFolder(id: string, user_id: string) {
    await sql`
      DELETE FROM media_folders
      WHERE id = ${id} AND user_id = ${user_id}
    `
  },
}

// Audit queries
export const auditQueries = {
  async log(data: {
    user_id: string
    action: string
    resource_type: string
    resource_id?: string
    details?: object
  }) {
    await sql`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
      VALUES (${data.user_id}, ${data.action}, ${data.resource_type}, ${data.resource_id || null}, ${JSON.stringify(data.details || {})})
    `
  },

  async getRecentActivity(user_id: string, limit = 10) {
    return await sql`
      SELECT * FROM audit_logs
      WHERE user_id = ${user_id}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  },
}
