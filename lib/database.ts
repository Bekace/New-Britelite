export interface MediaFolder {
  id: string
  name: string
  parent_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  mime_type: string
  blob_url: string
  thumbnail_url?: string
  folder_id?: string
  user_id: string
  metadata: any
  created_at: string
  updated_at: string
}

import { sql } from "./db"

export const mediaQueries = {
  // Folder operations
  createFolder: async (data: {
    name: string
    parent_id?: string
    user_id: string
  }): Promise<MediaFolder> => {
    const result = await sql`
      INSERT INTO media_folders (name, parent_id, user_id)
      VALUES (${data.name}, ${data.parent_id || null}, ${data.user_id})
      RETURNING *
    `
    return result[0] as MediaFolder
  },

  getFoldersByUser: async (userId: string, parentId?: string): Promise<MediaFolder[]> => {
    const result = await sql`
      SELECT * FROM media_folders 
      WHERE user_id = ${userId} 
      AND ${parentId ? sql`parent_id = ${parentId}` : sql`parent_id IS NULL`}
      ORDER BY name ASC
    `
    return result as MediaFolder[]
  },

  deleteFolder: async (folderId: string, userId: string): Promise<void> => {
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
  }): Promise<MediaAsset> => {
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
    return result[0] as MediaAsset
  },

  getAssetsByUser: async (userId: string, folderId?: string): Promise<MediaAsset[]> => {
    const result = await sql`
      SELECT * FROM media_assets 
      WHERE user_id = ${userId} 
      AND ${folderId ? sql`folder_id = ${folderId}` : sql`folder_id IS NULL`}
      ORDER BY created_at DESC
    `
    return result as MediaAsset[]
  },

  getAssetById: async (assetId: string, userId: string): Promise<MediaAsset | null> => {
    const result = await sql`
      SELECT * FROM media_assets 
      WHERE id = ${assetId} AND user_id = ${userId}
    `
    return (result[0] as MediaAsset) || null
  },

  deleteAsset: async (assetId: string, userId: string): Promise<void> => {
    await sql`
      DELETE FROM media_assets 
      WHERE id = ${assetId} AND user_id = ${userId}
    `
  },

  deleteMultipleAssets: async (assetIds: string[], userId: string): Promise<void> => {
    await sql`
      DELETE FROM media_assets 
      WHERE id = ANY(${assetIds}) AND user_id = ${userId}
    `
  },

  moveAssets: async (assetIds: string[], folderId: string | null, userId: string): Promise<void> => {
    await sql`
      UPDATE media_assets 
      SET folder_id = ${folderId}, updated_at = NOW()
      WHERE id = ANY(${assetIds}) AND user_id = ${userId}
    `
  },

  searchAssets: async (userId: string, query: string): Promise<MediaAsset[]> => {
    const result = await sql`
      SELECT * FROM media_assets 
      WHERE user_id = ${userId} 
      AND (original_filename ILIKE ${`%${query}%`} OR filename ILIKE ${`%${query}%`})
      ORDER BY created_at DESC
    `
    return result as MediaAsset[]
  },
}
