"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Upload,
  FolderPlus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Trash2,
  Eye,
  Download,
  ArrowLeft,
  ImageIcon,
  Folder,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaAsset {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  folder_id?: string
  created_at: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
  }
}

interface MediaFolder {
  id: string
  name: string
  parent_id?: string
  created_at: string
  asset_count: number
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [assetsResponse, foldersResponse] = await Promise.all([
        fetch(`/api/media/assets${currentFolder ? `?folder_id=${currentFolder}` : ""}`),
        fetch("/api/media/folders"),
      ])

      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json()
        setAssets(assetsData.assets || [])
      }

      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json()
        setFolders(foldersData.folders || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load media library")
    } finally {
      setIsLoading(false)
    }
  }, [currentFolder])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData()
      formData.append("file", file)
      if (currentFolder) {
        formData.append("folder_id", currentFolder)
      }

      try {
        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return await response.json()
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        toast.error(`Failed to upload ${file.name}`)
        return null
      }
    })

    try {
      const results = await Promise.all(uploadPromises)
      const successful = results.filter(Boolean)

      if (successful.length > 0) {
        toast.success(`Successfully uploaded ${successful.length} file(s)`)
        loadData()
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    setIsCreatingFolder(true)
    try {
      const response = await fetch("/api/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: currentFolder,
        }),
      })

      if (response.ok) {
        toast.success("Folder created successfully")
        setNewFolderName("")
        loadData()
      } else {
        throw new Error("Failed to create folder")
      }
    } catch (error) {
      console.error("Error creating folder:", error)
      toast.error("Failed to create folder")
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const deleteSelectedAssets = async () => {
    if (selectedAssets.length === 0) return

    try {
      const deletePromises = selectedAssets.map((assetId) =>
        fetch(`/api/media/assets/${assetId}`, { method: "DELETE" }),
      )

      await Promise.all(deletePromises)
      toast.success(`Deleted ${selectedAssets.length} asset(s)`)
      setSelectedAssets([])
      loadData()
    } catch (error) {
      console.error("Error deleting assets:", error)
      toast.error("Failed to delete assets")
    }
  }

  const filteredAssets = assets.filter((asset) =>
    asset.original_filename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const currentFolderData = folders.find((f) => f.id === currentFolder)
  const currentFolderFolders = folders.filter((f) => f.parent_id === currentFolder)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentFolder && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolder(null)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600">
              {currentFolderData ? `Folder: ${currentFolderData.name}` : "Manage your media assets"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        createFolder()
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createFolder} disabled={isCreatingFolder || !newFolderName.trim()}>
                  {isCreatingFolder ? "Creating..." : "Create Folder"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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

      {/* Search and View Controls */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          {selectedAssets.length > 0 && (
            <Button variant="destructive" size="sm" onClick={deleteSelectedAssets}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedAssets.length})
            </Button>
          )}

          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
          isUploading && "opacity-50 pointer-events-none",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? "Drop files here" : "Drag and drop files here"}
        </p>
        <p className="text-gray-600">or click the Upload Files button above</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {currentFolderFolders.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Folders</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {currentFolderFolders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setCurrentFolder(folder.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <Folder className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium truncate">{folder.name}</p>
                      <p className="text-xs text-gray-500">{folder.asset_count} items</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Assets */}
          {filteredAssets.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assets ({filteredAssets.length})</h3>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredAssets.map((asset) => (
                    <Card key={asset.id} className="group relative">
                      <CardContent className="p-2">
                        <div className="relative">
                          <Checkbox
                            checked={selectedAssets.includes(asset.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAssets([...selectedAssets, asset.id])
                              } else {
                                setSelectedAssets(selectedAssets.filter((id) => id !== asset.id))
                              }
                            }}
                            className="absolute top-2 left-2 z-10 bg-white"
                          />
                          <img
                            src={asset.thumbnail_url || asset.url}
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
                                <a href={asset.url} download={asset.original_filename}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium truncate">{asset.original_filename}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {asset.file_type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatFileSize(asset.file_size)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAssets.map((asset) => (
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
                          <img
                            src={asset.thumbnail_url || asset.url}
                            alt={asset.original_filename}
                            className="w-16 h-16 object-cover rounded cursor-pointer"
                            onClick={() => setPreviewAsset(asset)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{asset.original_filename}</p>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                              <span>{asset.file_type.toUpperCase()}</span>
                              <span>{formatFileSize(asset.file_size)}</span>
                              {asset.metadata?.width && asset.metadata?.height && (
                                <span>
                                  {asset.metadata.width} × {asset.metadata.height}
                                </span>
                              )}
                              <span>{new Date(asset.created_at).toLocaleDateString()}</span>
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
                                <a href={asset.url} download={asset.original_filename}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
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
              <p className="text-lg font-medium text-gray-900 mb-2">No media files found</p>
              <p className="text-gray-600">Upload some files to get started</p>
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
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={previewAsset.url || "/placeholder.svg"}
                alt={previewAsset.original_filename}
                className="w-full max-h-96 object-contain rounded"
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>File Type:</strong> {previewAsset.file_type.toUpperCase()}
                </div>
                <div>
                  <strong>File Size:</strong> {formatFileSize(previewAsset.file_size)}
                </div>
                {previewAsset.metadata?.width && previewAsset.metadata?.height && (
                  <>
                    <div>
                      <strong>Dimensions:</strong> {previewAsset.metadata.width} × {previewAsset.metadata.height}
                    </div>
                  </>
                )}
                <div>
                  <strong>Created:</strong> {new Date(previewAsset.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button asChild>
                <a href={previewAsset.url} download={previewAsset.original_filename}>
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
