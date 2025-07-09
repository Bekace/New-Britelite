import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// User queries
export async function createUser(
  email: string,
  hashedPassword: string,
  firstName: string,
  lastName: string,
  businessName?: string,
) {
  const result = await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, business_name, email_verified)
    VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName}, ${businessName}, false)
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

export async function updateUserEmailVerification(userId: string) {
  const result = await sql`
    UPDATE users 
    SET email_verified = true, email_verified_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, email_verified
  `
  return result[0]
}

export async function updateUserProfile(userId: string, data: any) {
  const { firstName, lastName, businessName, phone, address, city, state, zipCode, country } = data

  const result = await sql`
    UPDATE users 
    SET 
      first_name = ${firstName},
      last_name = ${lastName},
      business_name = ${businessName},
      phone = ${phone},
      address = ${address},
      city = ${city},
      state = ${state},
      zip_code = ${zipCode},
      country = ${country},
      updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, first_name, last_name, business_name, phone, address, city, state, zip_code, country
  `
  return result[0]
}

// Password reset queries
export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `
}

export async function getPasswordResetToken(token: string) {
  const result = await sql`
    SELECT prt.*, u.email
    FROM password_reset_tokens prt
    JOIN users u ON prt.user_id = u.id
    WHERE prt.token = ${token} AND prt.expires_at > NOW() AND prt.used = false
  `
  return result[0]
}

export async function markPasswordResetTokenAsUsed(token: string) {
  await sql`
    UPDATE password_reset_tokens 
    SET used = true 
    WHERE token = ${token}
  `
}

export async function updateUserPassword(userId: string, hashedPassword: string) {
  await sql`
    UPDATE users 
    SET password_hash = ${hashedPassword}
    WHERE id = ${userId}
  `
}

// Email verification queries
export async function createEmailVerificationToken(userId: string, token: string, expiresAt: Date) {
  await sql`
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `
}

export async function getEmailVerificationToken(token: string) {
  const result = await sql`
    SELECT evt.*, u.email
    FROM email_verification_tokens evt
    JOIN users u ON evt.user_id = u.id
    WHERE evt.token = ${token} AND evt.expires_at > NOW() AND evt.used = false
  `
  return result[0]
}

export async function markEmailVerificationTokenAsUsed(token: string) {
  await sql`
    UPDATE email_verification_tokens 
    SET used = true 
    WHERE token = ${token}
  `
}

// Admin queries
export async function getAllUsers(page = 1, limit = 10, search?: string) {
  const offset = (page - 1) * limit

  let query = `
    SELECT u.*, p.name as plan_name,
           COUNT(*) OVER() as total_count
    FROM users u
    LEFT JOIN plans p ON u.plan_id = p.id
  `

  const params: any[] = []

  if (search) {
    query += ` WHERE u.email ILIKE $${params.length + 1} OR u.first_name ILIKE $${params.length + 1} OR u.last_name ILIKE $${params.length + 1}`
    params.push(`%${search}%`)
  }

  query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, offset)

  const result = await sql(query, params)
  return result
}

export async function updateUserRole(userId: string, role: string) {
  const result = await sql`
    UPDATE users 
    SET role = ${role}
    WHERE id = ${userId}
    RETURNING id, email, role
  `
  return result[0]
}

export async function deleteUser(userId: string) {
  await sql`DELETE FROM users WHERE id = ${userId}`
}

// Plan queries
export async function getAllPlans() {
  const result = await sql`
    SELECT p.*, 
           COALESCE(
             json_agg(
               json_build_object(
                 'id', f.id,
                 'name', f.name,
                 'description', f.description,
                 'feature_key', f.feature_key
               )
             ) FILTER (WHERE f.id IS NOT NULL), 
             '[]'
           ) as features
    FROM plans p
    LEFT JOIN plan_features pf ON p.id = pf.plan_id
    LEFT JOIN features f ON pf.feature_id = f.id
    GROUP BY p.id
    ORDER BY p.price ASC
  `
  return result
}

export async function getPlanById(planId: string) {
  const result = await sql`
    SELECT p.*, 
           COALESCE(
             json_agg(
               json_build_object(
                 'id', f.id,
                 'name', f.name,
                 'description', f.description,
                 'feature_key', f.feature_key
               )
             ) FILTER (WHERE f.id IS NOT NULL), 
             '[]'
           ) as features
    FROM plans p
    LEFT JOIN plan_features pf ON p.id = pf.plan_id
    LEFT JOIN features f ON pf.feature_id = f.id
    WHERE p.id = ${planId}
    GROUP BY p.id
  `
  return result[0]
}

export async function createPlan(
  name: string,
  description: string,
  price: number,
  billingInterval: string,
  maxScreens: number,
  maxStorage: number,
) {
  const result = await sql`
    INSERT INTO plans (name, description, price, billing_interval, max_screens, max_storage)
    VALUES (${name}, ${description}, ${price}, ${billingInterval}, ${maxScreens}, ${maxStorage})
    RETURNING *
  `
  return result[0]
}

export async function updatePlan(
  planId: string,
  name: string,
  description: string,
  price: number,
  billingInterval: string,
  maxScreens: number,
  maxStorage: number,
) {
  const result = await sql`
    UPDATE plans 
    SET name = ${name}, description = ${description}, price = ${price}, 
        billing_interval = ${billingInterval}, max_screens = ${maxScreens}, 
        max_storage = ${maxStorage}, updated_at = NOW()
    WHERE id = ${planId}
    RETURNING *
  `
  return result[0]
}

export async function deletePlan(planId: string) {
  await sql`DELETE FROM plans WHERE id = ${planId}`
}

// Feature queries
export async function getAllFeatures() {
  const result = await sql`
    SELECT * FROM features ORDER BY name ASC
  `
  return result
}

export async function createFeature(name: string, description: string, featureKey: string) {
  const result = await sql`
    INSERT INTO features (name, description, feature_key)
    VALUES (${name}, ${description}, ${featureKey})
    RETURNING *
  `
  return result[0]
}

export async function updateFeature(featureId: string, name: string, description: string, featureKey: string) {
  const result = await sql`
    UPDATE features 
    SET name = ${name}, description = ${description}, feature_key = ${featureKey}, updated_at = NOW()
    WHERE id = ${featureId}
    RETURNING *
  `
  return result[0]
}

export async function deleteFeature(featureId: string) {
  await sql`DELETE FROM features WHERE id = ${featureId}`
}

export async function getPlanFeatures(planId: string) {
  const result = await sql`
    SELECT f.* 
    FROM features f
    JOIN plan_features pf ON f.id = pf.feature_id
    WHERE pf.plan_id = ${planId}
    ORDER BY f.name ASC
  `
  return result
}

export async function addFeatureToPlan(planId: string, featureId: string) {
  await sql`
    INSERT INTO plan_features (plan_id, feature_id)
    VALUES (${planId}, ${featureId})
    ON CONFLICT (plan_id, feature_id) DO NOTHING
  `
}

export async function removeFeatureFromPlan(planId: string, featureId: string) {
  await sql`
    DELETE FROM plan_features 
    WHERE plan_id = ${planId} AND feature_id = ${featureId}
  `
}

// Media Library queries
export async function createMediaFolder(name: string, userId: string, parentId?: string) {
  const result = await sql`
    INSERT INTO media_folders (name, user_id, parent_id)
    VALUES (${name}, ${userId}, ${parentId || null})
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
  await sql`
    DELETE FROM media_folders 
    WHERE id = ${folderId} AND user_id = ${userId}
  `
}

export async function createMediaAsset(data: {
  filename: string
  originalFilename: string
  fileType: string
  fileSize: number
  mimeType: string
  blobUrl: string
  thumbnailUrl?: string
  folderId?: string
  userId: string
  metadata?: any
}) {
  const result = await sql`
    INSERT INTO media_assets (
      filename, original_filename, file_type, file_size, mime_type, 
      blob_url, thumbnail_url, folder_id, user_id, metadata
    )
    VALUES (
      ${data.filename}, ${data.originalFilename}, ${data.fileType}, 
      ${data.fileSize}, ${data.mimeType}, ${data.blobUrl}, 
      ${data.thumbnailUrl || null}, ${data.folderId || null}, 
      ${data.userId}, ${JSON.stringify(data.metadata || {})}
    )
    RETURNING *
  `
  return result[0]
}

export async function getMediaAssets(userId: string, folderId?: string, search?: string) {
  let query = `
    SELECT ma.*, mf.name as folder_name
    FROM media_assets ma
    LEFT JOIN media_folders mf ON ma.folder_id = mf.id
    WHERE ma.user_id = $1
  `

  const params: any[] = [userId]

  if (folderId) {
    query += ` AND ma.folder_id = $${params.length + 1}`
    params.push(folderId)
  } else {
    query += ` AND ma.folder_id IS NULL`
  }

  if (search) {
    query += ` AND ma.original_filename ILIKE $${params.length + 1}`
    params.push(`%${search}%`)
  }

  query += ` ORDER BY ma.created_at DESC`

  const result = await sql(query, params)
  return result
}

export async function deleteMediaAsset(assetId: string, userId: string) {
  const result = await sql`
    DELETE FROM media_assets 
    WHERE id = ${assetId} AND user_id = ${userId}
    RETURNING blob_url, thumbnail_url
  `
  return result[0]
}

export async function moveMediaAssets(assetIds: string[], folderId: string | null, userId: string) {
  await sql`
    UPDATE media_assets 
    SET folder_id = ${folderId}, updated_at = NOW()
    WHERE id = ANY(${assetIds}) AND user_id = ${userId}
  `
}
