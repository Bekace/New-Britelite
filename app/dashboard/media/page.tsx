"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Upload,
  Search,
  Grid3X3,
  List,
  FolderPlus,
  Folder,
  ImageIcon,
  MoreVertical,
  Trash2,
  Eye,
  Download,
  X,
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
  folder_id?: string
  metadata: {
    width?: number
    height?: number
    format?: string
  }
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
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Fetch folders
      const foldersResponse = await fetch(`/api/media/folders?parentId=${currentFolderId || ""}`)
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json()
        setFolders(foldersData.folders)
      }

      // Fetch assets
      const assetsUrl = searchQuery
        ? `/api/media/assets?query=${encodeURIComponent(searchQuery)}`
        : `/api/media/assets?folderId=${currentFolderId || ""}`

      const assetsResponse = await fetch(assetsUrl)
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json()
        setAssets(assetsData.assets)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load media library")
    } finally {
      setIsLoading(false)
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
        setShowCreateFolder(false)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create folder")
      }
    } catch (error) {
      console.error("Error creating folder:", error)
      toast.error("Failed to create folder")
    }
  }

  const deleteSelectedAssets = async () => {
    try {
      const deletePromises = Array.from(selectedAssets).map((assetId) =>
        fetch(`/api/media/assets?id=${assetId}`, { method: "DELETE" }),
      )

      await Promise.all(deletePromises)
      toast.success(`Deleted ${selectedAssets.size} asset(s)`)
      setSelectedAssets(new Set())
      setShowDeleteConfirm(false)
      fetchData()
    } catch (error) {
      console.error("Error deleting assets:", error)
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-gray-600 mt-1">Upload and manage your digital assets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>Enter a name for your new folder.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                  Cancel
                </Button>
                <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                  Create Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedAssets.size > 0 && (
            <>
              <Badge variant="secondary">{selectedAssets.size} selected</Badge>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </>
          )}
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-600 mb-2">Drag and drop files here, or click to select</p>
        <p className="text-sm text-gray-500">Supports: JPEG, PNG, GIF, WebP (max 3MB each)</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Folders</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {folders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <Folder className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium truncate">{folder.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Assets */}
          {assets.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium mb-3">Assets</h3>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {assets.map((asset) => (
                    <Card key={asset.id} className="group relative">
                      <CardContent className="p-2">
                        <div className="relative">
                          <Checkbox
                            checked={selectedAssets.has(asset.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedAssets)
                              if (checked) {
                                newSelected.add(asset.id)
                              } else {
                                newSelected.delete(asset.id)
                              }
                              setSelectedAssets(newSelected)
                            }}
                            className="absolute top-2 left-2 z-10 bg-white"
                          />
                          <img
                            src={asset.thumbnail_url || asset.blob_url}
                            alt={asset.original_filename}
                            className="w-full h-32 object-cover rounded cursor-pointer"
                            onClick={() => setPreviewAsset(asset)}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setPreviewAsset(asset)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={asset.blob_url} download={asset.original_filename}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-medium truncate">{asset.original_filename}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(asset.file_size)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <Card key={asset.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <Checkbox
                          checked={selectedAssets.has(asset.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedAssets)
                            if (checked) {
                              newSelected.add(asset.id)
                            } else {
                              newSelected.delete(asset.id)
                            }
                            setSelectedAssets(newSelected)
                          }}
                        />
                        <img
                          src={asset.thumbnail_url || asset.blob_url}
                          alt={asset.original_filename}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{asset.original_filename}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(asset.file_size)} • {formatDate(asset.created_at)}
                          </p>
                          {asset.metadata.width && asset.metadata.height && (
                            <p className="text-xs text-gray-400">
                              {asset.metadata.width} × {asset.metadata.height}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setPreviewAsset(asset)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={asset.blob_url} download={asset.original_filename}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">No assets found</p>
              <p className="text-sm text-gray-500">
                {searchQuery ? "Try adjusting your search terms" : "Upload some files to get started"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview Dialog */}
      {previewAsset && (
        <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewAsset.original_filename}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => setPreviewAsset(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={previewAsset.blob_url || "/placeholder.svg"}
                alt={previewAsset.original_filename}
                className="w-full max-h-96 object-contain rounded"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">File Size</p>
                  <p className="text-gray-600">{formatFileSize(previewAsset.file_size)}</p>
                </div>
                <div>
                  <p className="font-medium">Type</p>
                  <p className="text-gray-600">{previewAsset.mime_type}</p>
                </div>
                {previewAsset.metadata.width && previewAsset.metadata.height && (
                  <>
                    <div>
                      <p className="font-medium">Dimensions</p>
                      <p className="text-gray-600">
                        {previewAsset.metadata.width} × {previewAsset.metadata.height}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Format</p>
                      <p className="text-gray-600">{previewAsset.metadata.format?.toUpperCase()}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-gray-600">{formatDate(previewAsset.created_at)}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" asChild>
                <a href={previewAsset.blob_url} download={previewAsset.original_filename}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assets</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAssets.size} asset(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelectedAssets} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
