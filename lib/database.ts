import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(process.env.DATABASE_URL)

// User queries
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

  updateProfile: async (
    userId: string,
    profileData: {
      first_name?: string
      last_name?: string
      business_name?: string
      business_address?: string
      phone?: string
      avatar_url?: string
    },
  ) => {
    try {
      const updates = Object.entries(profileData)
        .filter(([_, value]) => value !== undefined)
        .map(([key, _]) => `${key} = $${key}`)
        .join(", ")

      if (!updates) {
        throw new Error("No valid fields to update")
      }

      const result = await sql`
        UPDATE users 
        SET ${sql.unsafe(updates)}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  },

  getAll: async (limit = 50, offset = 0) => {
    try {
      const result = await sql`
        SELECT u.*, p.name as plan_name, p.max_screens, p.max_storage_gb, p.max_playlists
        FROM users u
        LEFT JOIN plans p ON u.plan_id = p.id
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return result
    } catch (error) {
      console.error("Error getting all users:", error)
      throw error
    }
  },

  updateRole: async (userId: string, role: string) => {
    try {
      const result = await sql`
        UPDATE users 
        SET role = ${role}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error updating user role:", error)
      throw error
    }
  },

  updatePlan: async (userId: string, planId: string) => {
    try {
      const result = await sql`
        UPDATE users 
        SET plan_id = ${planId}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error updating user plan:", error)
      throw error
    }
  },

  delete: async (userId: string) => {
    try {
      const result = await sql`
        DELETE FROM users 
        WHERE id = ${userId}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error deleting user:", error)
      throw error
    }
  },
}

// Session queries
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

  cleanup: async () => {
    try {
      const result = await sql`
        DELETE FROM user_sessions 
        WHERE expires_at <= CURRENT_TIMESTAMP
      `
      return result
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error)
      throw error
    }
  },
}

// Plan queries
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

  create: async (planData: {
    name: string
    description: string
    price: number
    max_screens: number
    max_storage_gb: number
    max_playlists: number
    features: string[]
  }) => {
    try {
      const result = await sql`
        INSERT INTO plans (name, description, price, max_screens, max_storage_gb, max_playlists, features)
        VALUES (${planData.name}, ${planData.description}, ${planData.price}, ${planData.max_screens}, ${planData.max_storage_gb}, ${planData.max_playlists}, ${JSON.stringify(planData.features)})
        RETURNING *
      `
      return result[0]
    } catch (error) {
      console.error("Error creating plan:", error)
      throw error
    }
  },

  update: async (
    id: string,
    planData: {
      name?: string
      description?: string
      price?: number
      max_screens?: number
      max_storage_gb?: number
      max_playlists?: number
      features?: string[]
    },
  ) => {
    try {
      const updates = []
      const values = []

      if (planData.name !== undefined) {
        updates.push("name = $" + (values.length + 1))
        values.push(planData.name)
      }
      if (planData.description !== undefined) {
        updates.push("description = $" + (values.length + 1))
        values.push(planData.description)
      }
      if (planData.price !== undefined) {
        updates.push("price = $" + (values.length + 1))
        values.push(planData.price)
      }
      if (planData.max_screens !== undefined) {
        updates.push("max_screens = $" + (values.length + 1))
        values.push(planData.max_screens)
      }
      if (planData.max_storage_gb !== undefined) {
        updates.push("max_storage_gb = $" + (values.length + 1))
        values.push(planData.max_storage_gb)
      }
      if (planData.max_playlists !== undefined) {
        updates.push("max_playlists = $" + (values.length + 1))
        values.push(planData.max_playlists)
      }
      if (planData.features !== undefined) {
        updates.push("features = $" + (values.length + 1))
        values.push(JSON.stringify(planData.features))
      }

      if (updates.length === 0) {
        throw new Error("No valid fields to update")
      }

      updates.push("updated_at = NOW()")

      const result = await sql`
        UPDATE plans 
        SET ${sql.unsafe(updates.join(", "))}
        WHERE id = ${id}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error updating plan:", error)
      throw error
    }
  },

  delete: async (id: string) => {
    try {
      const result = await sql`
        DELETE FROM plans 
        WHERE id = ${id}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error deleting plan:", error)
      throw error
    }
  },
}

// Feature queries
export const featureQueries = {
  getAll: async () => {
    try {
      const result = await sql`
        SELECT * FROM features 
        ORDER BY name ASC
      `
      return result
    } catch (error) {
      console.error("Error getting all features:", error)
      throw error
    }
  },

  findById: async (id: string) => {
    try {
      const result = await sql`
        SELECT * FROM features 
        WHERE id = ${id}
      `
      return result[0] || null
    } catch (error) {
      console.error("Error finding feature by ID:", error)
      throw error
    }
  },

  findByKey: async (key: string) => {
    try {
      const result = await sql`
        SELECT * FROM features 
        WHERE key = ${key}
      `
      return result[0] || null
    } catch (error) {
      console.error("Error finding feature by key:", error)
      throw error
    }
  },

  create: async (featureData: {
    name: string
    key: string
    description: string
    category: string
  }) => {
    try {
      const result = await sql`
        INSERT INTO features (name, key, description, category)
        VALUES (${featureData.name}, ${featureData.key}, ${featureData.description}, ${featureData.category})
        RETURNING *
      `
      return result[0]
    } catch (error) {
      console.error("Error creating feature:", error)
      throw error
    }
  },

  update: async (
    id: string,
    featureData: {
      name?: string
      key?: string
      description?: string
      category?: string
    },
  ) => {
    try {
      const updates = []
      const values = []

      if (featureData.name !== undefined) {
        updates.push("name = $" + (values.length + 1))
        values.push(featureData.name)
      }
      if (featureData.key !== undefined) {
        updates.push("key = $" + (values.length + 1))
        values.push(featureData.key)
      }
      if (featureData.description !== undefined) {
        updates.push("description = $" + (values.length + 1))
        values.push(featureData.description)
      }
      if (featureData.category !== undefined) {
        updates.push("category = $" + (values.length + 1))
        values.push(featureData.category)
      }

      if (updates.length === 0) {
        throw new Error("No valid fields to update")
      }

      updates.push("updated_at = NOW()")

      const result = await sql`
        UPDATE features 
        SET ${sql.unsafe(updates.join(", "))}
        WHERE id = ${id}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error updating feature:", error)
      throw error
    }
  },

  delete: async (id: string) => {
    try {
      const result = await sql`
        DELETE FROM features 
        WHERE id = ${id}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error deleting feature:", error)
      throw error
    }
  },
}

// Plan-Feature relationship queries
export const planFeatureQueries = {
  getFeaturesByPlan: async (planId: string) => {
    try {
      const result = await sql`
        SELECT f.* FROM features f
        JOIN plan_features pf ON f.id = pf.feature_id
        WHERE pf.plan_id = ${planId}
        ORDER BY f.name ASC
      `
      return result
    } catch (error) {
      console.error("Error getting features by plan:", error)
      throw error
    }
  },

  getPlansByFeature: async (featureId: string) => {
    try {
      const result = await sql`
        SELECT p.* FROM plans p
        JOIN plan_features pf ON p.id = pf.plan_id
        WHERE pf.feature_id = ${featureId}
        ORDER BY p.price ASC
      `
      return result
    } catch (error) {
      console.error("Error getting plans by feature:", error)
      throw error
    }
  },

  addFeatureToPlan: async (planId: string, featureId: string) => {
    try {
      const result = await sql`
        INSERT INTO plan_features (plan_id, feature_id)
        VALUES (${planId}, ${featureId})
        ON CONFLICT (plan_id, feature_id) DO NOTHING
        RETURNING *
      `
      return result[0]
    } catch (error) {
      console.error("Error adding feature to plan:", error)
      throw error
    }
  },

  removeFeatureFromPlan: async (planId: string, featureId: string) => {
    try {
      const result = await sql`
        DELETE FROM plan_features 
        WHERE plan_id = ${planId} AND feature_id = ${featureId}
        RETURNING *
      `
      return result[0] || null
    } catch (error) {
      console.error("Error removing feature from plan:", error)
      throw error
    }
  },

  updatePlanFeatures: async (planId: string, featureIds: string[]) => {
    try {
      // First, remove all existing features for this plan
      await sql`
        DELETE FROM plan_features 
        WHERE plan_id = ${planId}
      `

      // Then, add the new features
      if (featureIds.length > 0) {
        const values = featureIds.map((featureId) => `(${planId}, ${featureId})`).join(", ")
        await sql`
          INSERT INTO plan_features (plan_id, feature_id)
          VALUES ${sql.unsafe(values)}
        `
      }

      return true
    } catch (error) {
      console.error("Error updating plan features:", error)
      throw error
    }
  },
}

// Audit queries
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

  getByUser: async (userId: string, limit = 50, offset = 0) => {
    try {
      const result = await sql`
        SELECT * FROM audit_logs 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return result
    } catch (error) {
      console.error("Error getting audit logs by user:", error)
      throw error
    }
  },

  getAll: async (limit = 100, offset = 0) => {
    try {
      const result = await sql`
        SELECT al.*, u.email, u.first_name, u.last_name
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return result
    } catch (error) {
      console.error("Error getting all audit logs:", error)
      throw error
    }
  },
}
