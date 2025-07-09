"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Folder,
  ImageIcon,
  ArrowLeft,
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
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)
  const [folderPath, setFolderPath] = useState<MediaFolder[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [assetsRes, foldersRes] = await Promise.all([
        fetch(`/api/media/assets?folderId=${currentFolderId || "null"}`),
        fetch(`/api/media/folders?parentId=${currentFolderId || "null"}`),
      ])

      if (assetsRes.ok && foldersRes.ok) {
        const assetsData = await assetsRes.json()
        const foldersData = await foldersRes.json()
        setAssets(assetsData.assets)
        setFolders(foldersData.folders)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load media library")
    }
  }, [currentFolderId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFileUpload = async (files: FileList) => {
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

  const handleDeleteSelected = async () => {
    if (selectedAssets.length === 0) return

    try {
      const response = await fetch("/api/media/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: selectedAssets }),
      })

      if (response.ok) {
        toast.success(`Deleted ${selectedAssets.length} asset(s)`)
        setSelectedAssets([])
        setShowDeleteDialog(false)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete assets")
      }
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

  const filteredAssets = assets.filter((asset) =>
    asset.original_filename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]))
  }

  const selectAllAssets = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([])
    } else {
      setSelectedAssets(filteredAssets.map((asset) => asset.id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage your images, videos, and other media assets</p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {folderPath.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentFolderId(null)
              setFolderPath([])
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Root
          </Button>
          {folderPath.map((folder, index) => (
            <span key={folder.id}>/ {folder.name}</span>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectedAssets.length > 0 && (
            <>
              <Badge variant="secondary">{selectedAssets.length} selected</Badge>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}

          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogTrigger asChild>
              <Button variant="outline">
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
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
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
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">Drop files here to upload</p>
        <p className="text-muted-foreground">Or click the upload button above. Supports images up to 3MB.</p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Folders */}
        {folders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setCurrentFolderId(folder.id)
                  setFolderPath([...folderPath, folder])
                }}
              >
                <CardContent className="p-4 text-center">
                  <Folder className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium truncate">{folder.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Assets */}
        {filteredAssets.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedAssets.length === filteredAssets.length} onCheckedChange={selectAllAssets} />
              <span className="text-sm text-muted-foreground">Select all ({filteredAssets.length} assets)</span>
            </div>

            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" : "space-y-2"}>
              {filteredAssets.map((asset) => (
                <Card key={asset.id} className="group relative">
                  <CardContent className={viewMode === "grid" ? "p-2" : "p-4 flex items-center gap-4"}>
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedAssets.includes(asset.id)}
                        onCheckedChange={() => toggleAssetSelection(asset.id)}
                      />
                    </div>

                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setPreviewAsset(asset)
                              setShowPreview(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(asset.blob_url, "_blank")}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAssets([asset.id])
                              setShowDeleteDialog(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {viewMode === "grid" ? (
                      <div className="text-center">
                        <div className="aspect-square mb-2 rounded-md overflow-hidden bg-muted">
                          {asset.thumbnail_url ? (
                            <img
                              src={asset.thumbnail_url || "/placeholder.svg"}
                              alt={asset.original_filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium truncate">{asset.original_filename}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(asset.file_size)}</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {asset.thumbnail_url ? (
                            <img
                              src={asset.thumbnail_url || "/placeholder.svg"}
                              alt={asset.original_filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{asset.original_filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(asset.file_size)} • {asset.mime_type}
                          </p>
                          {asset.metadata?.width && asset.metadata?.height && (
                            <p className="text-xs text-muted-foreground">
                              {asset.metadata.width} × {asset.metadata.height}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {filteredAssets.length === 0 && folders.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No media files found</p>
            <p className="text-muted-foreground">Upload your first image to get started</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assets</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAssets.length} asset(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.original_filename}</DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={previewAsset.blob_url || "/placeholder.svg"}
                  alt={previewAsset.original_filename}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">File Size</p>
                  <p className="text-muted-foreground">{formatFileSize(previewAsset.file_size)}</p>
                </div>
                <div>
                  <p className="font-medium">Type</p>
                  <p className="text-muted-foreground">{previewAsset.mime_type}</p>
                </div>
                {previewAsset.metadata?.width && previewAsset.metadata?.height && (
                  <>
                    <div>
                      <p className="font-medium">Dimensions</p>
                      <p className="text-muted-foreground">
                        {previewAsset.metadata.width} × {previewAsset.metadata.height}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Format</p>
                      <p className="text-muted-foreground">{previewAsset.metadata.format}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
