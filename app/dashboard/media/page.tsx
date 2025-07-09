"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
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
  Download,
  Eye,
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
    size?: number
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
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)

  const fetchAssets = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (currentFolder) params.append("folderId", currentFolder)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/media/assets?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets)
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error)
      toast({
        title: "Error",
        description: "Failed to load media assets",
        variant: "destructive",
      })
    }
  }, [currentFolder, searchQuery])

  const fetchFolders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (currentFolder) params.append("parentId", currentFolder)

      const response = await fetch(`/api/media/folders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders)
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error)
    }
  }, [currentFolder])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchAssets(), fetchFolders()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchAssets, fetchFolders])

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      if (currentFolder) formData.append("folderId", currentFolder)

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
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      })
      fetchAssets()
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch("/api/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolder,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Folder created successfully",
        })
        setNewFolderName("")
        setShowNewFolderDialog(false)
        fetchFolders()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAssets = async () => {
    if (selectedAssets.length === 0) return

    try {
      const response = await fetch(`/api/media/assets?ids=${selectedAssets.join(",")}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${selectedAssets.length} asset(s) deleted successfully`,
        })
        setSelectedAssets([])
        fetchAssets()
      } else {
        throw new Error("Failed to delete assets")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assets",
        variant: "destructive",
      })
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600">Manage your digital assets</p>
        </div>
        <div className="flex items-center space-x-2">
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
                <DialogDescription>Enter a name for your new folder.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Folder Name</Label>
                  <Input
                    id="folderName"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => document.getElementById("file-upload")?.click()} disabled={isUploading}>
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Files"}
          </Button>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          {selectedAssets.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAssets}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedAssets.length})
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">Drop files here to upload</p>
        <p className="text-gray-600">or click the Upload Files button above</p>
        <p className="text-sm text-gray-500 mt-2">Supports: JPEG, PNG, GIF, WebP (max 3MB each)</p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Folders */}
        {folders.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Folders</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <CardContent className="p-4 text-center">
                    <Folder className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium truncate">{folder.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Separator className="my-6" />
          </div>
        )}

        {/* Assets */}
        {assets.length > 0 ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Assets ({assets.length})</h3>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {assets.map((asset) => (
                  <Card key={asset.id} className="group relative">
                    <CardContent className="p-2">
                      <div className="absolute top-2 left-2 z-10">
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
                      </div>
                      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            <DropdownMenuItem onClick={() => handleDeleteAssets()} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div
                        className="aspect-square bg-gray-100 rounded-lg mb-2 cursor-pointer overflow-hidden"
                        onClick={() => setPreviewAsset(asset)}
                      >
                        {asset.thumbnail_url ? (
                          <img
                            src={asset.thumbnail_url || "/placeholder.svg"}
                            alt={asset.original_filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{asset.original_filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(asset.file_size)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <Card key={asset.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
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
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {asset.thumbnail_url ? (
                            <img
                              src={asset.thumbnail_url || "/placeholder.svg"}
                              alt={asset.original_filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{asset.original_filename}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatFileSize(asset.file_size)}</span>
                            {asset.metadata.width && asset.metadata.height && (
                              <span>
                                {asset.metadata.width} × {asset.metadata.height}
                              </span>
                            )}
                            <span>{formatDate(asset.created_at)}</span>
                          </div>
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
                            <DropdownMenuItem onClick={() => setSelectedAssets([asset.id])} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600">Upload your first image to get started</p>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      {previewAsset && (
        <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{previewAsset.original_filename}</DialogTitle>
                <Button variant="ghost" size="sm" onClick={() => setPreviewAsset(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={previewAsset.blob_url || "/placeholder.svg"}
                  alt={previewAsset.original_filename}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>File Size</Label>
                  <p>{formatFileSize(previewAsset.file_size)}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p>{previewAsset.mime_type}</p>
                </div>
                {previewAsset.metadata.width && previewAsset.metadata.height && (
                  <>
                    <div>
                      <Label>Dimensions</Label>
                      <p>
                        {previewAsset.metadata.width} × {previewAsset.metadata.height} pixels
                      </p>
                    </div>
                    <div>
                      <Label>Format</Label>
                      <p>{previewAsset.metadata.format?.toUpperCase()}</p>
                    </div>
                  </>
                )}
                <div>
                  <Label>Uploaded</Label>
                  <p>{formatDate(previewAsset.created_at)}</p>
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
    </div>
  )
}
