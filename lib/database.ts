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
    // Get the free plan ID first
    const freePlan = await sql`SELECT id FROM plans WHERE name = 'Free' LIMIT 1`
    const defaultPlanId = freePlan[0]?.id || null

    const result = await sql`
      INSERT INTO users (
        email, password_hash, first_name, last_name, plan_id, 
        business_name, email_verification_token
      )
      VALUES (
        ${userData.email}, ${userData.password_hash}, ${userData.first_name}, 
        ${userData.last_name}, ${userData.plan_id || defaultPlanId}, 
        ${userData.business_name || null}, ${userData.email_verification_token || null}
      )
      RETURNING id, email, first_name, last_name, role, is_email_verified, business_name
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
      SELECT 
        s.*, 
        u.id, u.email, u.first_name, u.last_name, u.role, u.is_email_verified,
        u.business_name, u.business_address, u.phone, u.avatar_url, u.created_at,
        p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN plans p ON u.plan_id = p.id
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

export const mediaQueries = {
  // Folder operations
  createFolder: async (data: {
    name: string
    parent_id?: string
    user_id: string
  }) => {
    const result = await sql`
      INSERT INTO media_folders (name, parent_id, user_id)
      VALUES (${data.name}, ${data.parent_id || null}, ${data.user_id})
      RETURNING *
    `
    return result[0]
  },

  getFolders: async (userId: string, parentId?: string) => {
    return await sql`
      SELECT * FROM media_folders 
      WHERE user_id = ${userId} 
        AND (parent_id = ${parentId || null} OR (parent_id IS NULL AND ${parentId} IS NULL))
      ORDER BY name ASC
    `
  },

  deleteFolder: async (folderId: string, userId: string) => {
    await sql`
      DELETE FROM media_folders 
      WHERE id = ${folderId} AND user_id = ${userId}
    `
  },

  // Asset operations
  createAsset: async (data: {
    filename: string
    original_filename: string
    file_type: string
    file_size: number
    mime_type: string
    blob_url: string
    thumbnail_url?: string
    folder_id?: string
    user_id: string
    metadata?: any
  }) => {
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

  getAssets: async (userId: string, folderId?: string, fileType?: string) => {
    let query = sql`
      SELECT * FROM media_assets 
      WHERE user_id = ${userId}
    `

    if (folderId !== undefined) {
      query = sql`
        SELECT * FROM media_assets 
        WHERE user_id = ${userId} 
          AND (folder_id = ${folderId || null} OR (folder_id IS NULL AND ${folderId} IS NULL))
      `
    }

    if (fileType) {
      query = sql`
        SELECT * FROM media_assets 
        WHERE user_id = ${userId} 
          AND file_type = ${fileType}
          AND (folder_id = ${folderId || null} OR (folder_id IS NULL AND ${folderId} IS NULL))
      `
    }

    const assets = await query
    return assets.map((asset) => ({
      ...asset,
      metadata: typeof asset.metadata === "string" ? JSON.parse(asset.metadata) : asset.metadata,
    }))
  },

  deleteAsset: async (assetId: string, userId: string) => {
    const result = await sql`
      DELETE FROM media_assets 
      WHERE id = ${assetId} AND user_id = ${userId}
      RETURNING blob_url, thumbnail_url
    `
    return result[0] || null
  },

  deleteMultipleAssets: async (assetIds: string[], userId: string) => {
    const result = await sql`
      DELETE FROM media_assets 
      WHERE id = ANY(${assetIds}) AND user_id = ${userId}
      RETURNING blob_url, thumbnail_url
    `
    return result
  },

  moveAssets: async (assetIds: string[], folderId: string | null, userId: string) => {
    await sql`
      UPDATE media_assets 
      SET folder_id = ${folderId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY(${assetIds}) AND user_id = ${userId}
    `
  },

  getAssetById: async (assetId: string, userId: string) => {
    const result = await sql`
      SELECT * FROM media_assets 
      WHERE id = ${assetId} AND user_id = ${userId}
    `
    if (result[0]) {
      return {
        ...result[0],
        metadata: typeof result[0].metadata === "string" ? JSON.parse(result[0].metadata) : result[0].metadata,
      }
    }
    return null
  },

  searchAssets: async (userId: string, query: string) => {
    const result = await sql`
      SELECT * FROM media_assets 
      WHERE user_id = ${userId} 
        AND (original_filename ILIKE ${`%${query}%`} OR filename ILIKE ${`%${query}%`})
      ORDER BY created_at DESC
    `
    return result.map((asset) => ({
      ...asset,
      metadata: typeof asset.metadata === "string" ? JSON.parse(asset.metadata) : asset.metadata,
    }))
  },
}

export const systemQueries = {
  getSetting: async (key: string) => {
    const result = await sql`
      SELECT value FROM system_settings WHERE key = ${key}
    `
    return result[0]?.value || null
  },

  updateSetting: async (key: string, value: string) => {
    await sql`
      UPDATE system_settings 
      SET value = ${value}, updated_at = CURRENT_TIMESTAMP
      WHERE key = ${key}
    `
  },
}
