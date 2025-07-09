import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(process.env.DATABASE_URL)

// User queries
export async function createUser(userData: {
  email: string
  password_hash: string
  first_name: string
  last_name: string
  business_name?: string
  verification_token: string
}) {
  const result = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, business_name, verification_token)
    VALUES (${userData.email}, ${userData.password_hash}, ${userData.first_name}, ${userData.last_name}, ${userData.business_name || null}, ${userData.verification_token})
    RETURNING id, email, first_name, last_name, business_name, role, email_verified, created_at
  `
  return result[0]
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT u.*, p.name as plan_name 
    FROM users u
    LEFT JOIN plans p ON u.plan_id = p.id
    WHERE u.email = ${email}
  `
  return result[0]
}

export async function getUserById(id: string) {
  const result = await sql`
    SELECT u.*, p.name as plan_name 
    FROM users u
    LEFT JOIN plans p ON u.plan_id = p.id
    WHERE u.id = ${id}
  `
  return result[0]
}

export async function verifyUserEmail(token: string) {
  const result = await sql`
    UPDATE users 
    SET email_verified = true, verification_token = null, updated_at = NOW()
    WHERE verification_token = ${token}
    RETURNING id, email, first_name, last_name
  `
  return result[0]
}

export async function updateUserProfile(
  userId: string,
  updates: {
    first_name?: string
    last_name?: string
    business_name?: string
    avatar_url?: string
  },
) {
  const result = await sql`
    UPDATE users 
    SET 
      first_name = COALESCE(${updates.first_name}, first_name),
      last_name = COALESCE(${updates.last_name}, last_name),
      business_name = COALESCE(${updates.business_name}, business_name),
      avatar_url = COALESCE(${updates.avatar_url}, avatar_url),
      updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, first_name, last_name, business_name, avatar_url
  `
  return result[0]
}

export async function setPasswordResetToken(email: string, token: string, expiresAt: Date) {
  const result = await sql`
    UPDATE users 
    SET reset_token = ${token}, reset_token_expires = ${expiresAt.toISOString()}, updated_at = NOW()
    WHERE email = ${email}
    RETURNING id, email, first_name, last_name
  `
  return result[0]
}

export async function getUserByResetToken(token: string) {
  const result = await sql`
    SELECT * FROM users 
    WHERE reset_token = ${token} AND reset_token_expires > NOW()
  `
  return result[0]
}

export async function updatePassword(userId: string, passwordHash: string) {
  const result = await sql`
    UPDATE users 
    SET password_hash = ${passwordHash}, reset_token = null, reset_token_expires = null, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email
  `
  return result[0]
}

// Admin queries
export async function getAllUsers(limit = 50, offset = 0) {
  const result = await sql`
    SELECT u.*, p.name as plan_name
    FROM users u
    LEFT JOIN plans p ON u.plan_id = p.id
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return result
}

export async function updateUserRole(userId: string, role: "user" | "admin") {
  const result = await sql`
    UPDATE users 
    SET role = ${role}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, role
  `
  return result[0]
}

export async function deleteUser(userId: string) {
  const result = await sql`
    DELETE FROM users WHERE id = ${userId}
    RETURNING id, email
  `
  return result[0]
}

// Plan queries
export async function getAllPlans() {
  const result = await sql`
    SELECT * FROM plans ORDER BY price ASC
  `
  return result
}

export async function getPlanById(id: string) {
  const result = await sql`
    SELECT * FROM plans WHERE id = ${id}
  `
  return result[0]
}

export async function createPlan(planData: {
  name: string
  description?: string
  price: number
  billing_cycle: "monthly" | "yearly"
  max_screens?: number
  max_storage_gb?: number
  features?: string[]
}) {
  const result = await sql`
    INSERT INTO plans (name, description, price, billing_cycle, max_screens, max_storage_gb, features)
    VALUES (${planData.name}, ${planData.description || null}, ${planData.price}, ${planData.billing_cycle}, ${planData.max_screens || null}, ${planData.max_storage_gb || null}, ${JSON.stringify(planData.features || [])})
    RETURNING *
  `
  return result[0]
}

export async function updatePlan(
  id: string,
  updates: {
    name?: string
    description?: string
    price?: number
    billing_cycle?: "monthly" | "yearly"
    max_screens?: number
    max_storage_gb?: number
    features?: string[]
    is_active?: boolean
  },
) {
  const result = await sql`
    UPDATE plans 
    SET 
      name = COALESCE(${updates.name}, name),
      description = COALESCE(${updates.description}, description),
      price = COALESCE(${updates.price}, price),
      billing_cycle = COALESCE(${updates.billing_cycle}, billing_cycle),
      max_screens = COALESCE(${updates.max_screens}, max_screens),
      max_storage_gb = COALESCE(${updates.max_storage_gb}, max_storage_gb),
      features = COALESCE(${updates.features ? JSON.stringify(updates.features) : null}, features),
      is_active = COALESCE(${updates.is_active}, is_active),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result[0]
}

export async function deletePlan(id: string) {
  const result = await sql`
    DELETE FROM plans WHERE id = ${id}
    RETURNING id, name
  `
  return result[0]
}

// Feature queries
export async function getAllFeatures() {
  const result = await sql`
    SELECT * FROM features ORDER BY name ASC
  `
  return result
}

export async function createFeature(featureData: {
  name: string
  description?: string
  feature_key: string
}) {
  const result = await sql`
    INSERT INTO features (name, description, feature_key)
    VALUES (${featureData.name}, ${featureData.description || null}, ${featureData.feature_key})
    RETURNING *
  `
  return result[0]
}

export async function updateFeature(
  id: string,
  updates: {
    name?: string
    description?: string
    feature_key?: string
  },
) {
  const result = await sql`
    UPDATE features 
    SET 
      name = COALESCE(${updates.name}, name),
      description = COALESCE(${updates.description}, description),
      feature_key = COALESCE(${updates.feature_key}, feature_key),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return result[0]
}

export async function deleteFeature(id: string) {
  const result = await sql`
    DELETE FROM features WHERE id = ${id}
    RETURNING id, name
  `
  return result[0]
}

export async function getPlanFeatures(planId: string) {
  const result = await sql`
    SELECT f.* FROM features f
    JOIN plan_features pf ON f.id = pf.feature_id
    WHERE pf.plan_id = ${planId}
    ORDER BY f.name ASC
  `
  return result
}

export async function addFeatureToPlan(planId: string, featureId: string) {
  const result = await sql`
    INSERT INTO plan_features (plan_id, feature_id)
    VALUES (${planId}, ${featureId})
    ON CONFLICT (plan_id, feature_id) DO NOTHING
    RETURNING *
  `
  return result[0]
}

export async function removeFeatureFromPlan(planId: string, featureId: string) {
  const result = await sql`
    DELETE FROM plan_features 
    WHERE plan_id = ${planId} AND feature_id = ${featureId}
    RETURNING *
  `
  return result[0]
}

// Media Library queries
export async function createMediaFolder(folderData: {
  name: string
  parent_id?: string
  user_id: string
}) {
  const result = await sql`
    INSERT INTO media_folders (name, parent_id, user_id)
    VALUES (${folderData.name}, ${folderData.parent_id || null}, ${folderData.user_id})
    RETURNING *
  `
  return result[0]
}

export async function getMediaFolders(userId: string, parentId?: string) {
  const result = await sql`
    SELECT * FROM media_folders 
    WHERE user_id = ${userId} AND parent_id ${parentId ? `= ${parentId}` : "IS NULL"}
    ORDER BY name ASC
  `
  return result
}

export async function deleteMediaFolder(folderId: string, userId: string) {
  const result = await sql`
    DELETE FROM media_folders 
    WHERE id = ${folderId} AND user_id = ${userId}
    RETURNING *
  `
  return result[0]
}

export async function createMediaAsset(assetData: {
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
      ${assetData.filename}, ${assetData.original_filename}, ${assetData.file_type}, 
      ${assetData.file_size}, ${assetData.mime_type}, ${assetData.blob_url}, 
      ${assetData.thumbnail_url || null}, ${assetData.folder_id || null}, 
      ${assetData.user_id}, ${JSON.stringify(assetData.metadata || {})}
    )
    RETURNING *
  `
  return result[0]
}

export async function getMediaAssets(userId: string, folderId?: string, limit = 50, offset = 0) {
  const result = await sql`
    SELECT * FROM media_assets 
    WHERE user_id = ${userId} AND folder_id ${folderId ? `= ${folderId}` : "IS NULL"}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return result
}

export async function searchMediaAssets(userId: string, query: string, limit = 50) {
  const result = await sql`
    SELECT * FROM media_assets 
    WHERE user_id = ${userId} AND (
      original_filename ILIKE ${"%" + query + "%"} OR
      filename ILIKE ${"%" + query + "%"}
    )
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return result
}

export async function deleteMediaAsset(assetId: string, userId: string) {
  const result = await sql`
    DELETE FROM media_assets 
    WHERE id = ${assetId} AND user_id = ${userId}
    RETURNING *
  `
  return result[0]
}

export async function moveMediaAsset(assetId: string, folderId: string | null, userId: string) {
  const result = await sql`
    UPDATE media_assets 
    SET folder_id = ${folderId}, updated_at = NOW()
    WHERE id = ${assetId} AND user_id = ${userId}
    RETURNING *
  `
  return result[0]
}
