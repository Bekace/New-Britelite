"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Upload,
  Search,
  Grid3X3,
  List,
  FolderPlus,
  Folder,
  ImageIcon,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Eye,
  Download,
} from "lucide-react"

interface MediaAsset {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  mime_type: string
  blob_url: string
  thumbnail_url?: string
  metadata: any
  created_at: string
}

interface MediaFolder {
  id: string
  name: string
  parent_id?: string
  created_at: string
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch folders
      const foldersResponse = await fetch(`/api/media/folders${currentFolderId ? `?parentId=${currentFolderId}` : ""}`)
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json()
        setFolders(foldersData.folders)
      }

      // Fetch assets
      const assetsResponse = await fetch(
        `/api/media/assets${currentFolderId ? `?folderId=${currentFolderId}` : ""}${
          searchQuery ? `${currentFolderId ? "&" : "?"}search=${encodeURIComponent(searchQuery)}` : ""
        }`,
      )
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json()
        setAssets(assetsData.assets)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load media library")
    } finally {
      setLoading(false)
    }
  }, [currentFolderId, searchQuery])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return

    setIsUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      if (currentFolderId) {
        formData.append("folderId", currentFolderId)
      }

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      return response.json()
    })

    try {
      await Promise.all(uploadPromises)
      toast.success(`Successfully uploaded ${files.length} file(s)`)
      fetchData()
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    handleFileUpload(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch("/api/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      })

      if (response.ok) {
        toast.success("Folder created successfully")
        setNewFolderName("")
        setShowNewFolderDialog(false)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create folder")
      }
    } catch (error) {
      console.error("Create folder error:", error)
      toast.error("Failed to create folder")
    }
  }

  const deleteAssets = async (assetIds: string[]) => {
    try {
      const response = await fetch(`/api/media/assets?ids=${assetIds.join(",")}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success(`Deleted ${assetIds.length} asset(s)`)
        setSelectedAssets([])
        fetchData()
      } else {
        toast.error("Failed to delete assets")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete assets")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentFolderId && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentFolderId(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-3xl font-bold">Media Library</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">{isUploading ? "Uploading..." : "Drag and drop files here"}</p>
            <p className="text-gray-500 mb-4">or</p>
            <Button
              disabled={isUploading}
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.multiple = true
                input.accept = "image/*"
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files) handleFileUpload(files)
                }
                input.click()
              }}
            >
              Choose Files
            </Button>
            <p className="text-sm text-gray-500 mt-2">Supported formats: JPEG, PNG, GIF, WebP (Max 3MB each)</p>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createFolder()}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {selectedAssets.length > 0 && (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{selectedAssets.length} selected</Badge>
            <Button variant="destructive" size="sm" onClick={() => deleteAssets(selectedAssets)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <CardContent className="p-4 text-center">
                    <Folder className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm font-medium truncate">{folder.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Assets */}
          {assets.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" : "space-y-2"}>
              {assets.map((asset) => (
                <Card key={asset.id} className="group relative">
                  <CardContent className={viewMode === "grid" ? "p-2" : "p-4"}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedAssets.includes(asset.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAssets([...selectedAssets, asset.id])
                          } else {
                            setSelectedAssets(selectedAssets.filter((id) => id !== asset.id))
                          }
                        }}
                      />
                      {viewMode === "grid" ? (
                        <div className="flex-1">
                          <div className="aspect-square relative mb-2">
                            <img
                              src={asset.thumbnail_url || asset.blob_url}
                              alt={asset.original_filename}
                              className="w-full h-full object-cover rounded"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setPreviewAsset(asset)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs font-medium truncate">{asset.original_filename}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(asset.file_size)}</p>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={asset.thumbnail_url || asset.blob_url}
                              alt={asset.original_filename}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium">{asset.original_filename}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(asset.file_size)} • {formatDate(asset.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => setPreviewAsset(asset)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => window.open(asset.blob_url, "_blank")}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteAssets([asset.id])} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-500">No assets found</p>
              <p className="text-gray-400">Upload some files to get started</p>
            </div>
          )}
        </>
      )}

      {/* Preview Dialog */}
      {previewAsset && (
        <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewAsset.original_filename}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={previewAsset.blob_url || "/placeholder.svg"}
                  alt={previewAsset.original_filename}
                  className="max-w-full max-h-96 object-contain rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">File Size:</p>
                  <p className="text-gray-600">{formatFileSize(previewAsset.file_size)}</p>
                </div>
                <div>
                  <p className="font-medium">Type:</p>
                  <p className="text-gray-600">{previewAsset.mime_type}</p>
                </div>
                {previewAsset.metadata?.width && (
                  <div>
                    <p className="font-medium">Dimensions:</p>
                    <p className="text-gray-600">
                      {previewAsset.metadata.width} × {previewAsset.metadata.height}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-medium">Uploaded:</p>
                  <p className="text-gray-600">{formatDate(previewAsset.created_at)}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => window.open(previewAsset.blob_url, "_blank")}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteAssets([previewAsset.id])
                    setPreviewAsset(null)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
