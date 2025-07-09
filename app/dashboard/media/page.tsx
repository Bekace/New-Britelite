"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
  Eye,
  Download,
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
  user_id: string
  metadata: any
  created_at: string
  updated_at: string
}

interface MediaFolder {
  id: string
  name: string
  parent_id?: string
  user_id: string
  created_at: string
  updated_at: string
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)

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
        ? `/api/media/assets?search=${encodeURIComponent(searchQuery)}`
        : `/api/media/assets?folderId=${currentFolderId || ""}`

      const assetsResponse = await fetch(assetsUrl)
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json()
        setAssets(assetsData.assets)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to load media library",
        variant: "destructive",
      })
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
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      })
      fetchData()
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      })
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
        toast({
          title: "Success",
          description: "Folder created successfully",
        })
        setNewFolderName("")
        setShowCreateFolder(false)
        fetchData()
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

  const deleteSelectedAssets = async () => {
    if (selectedAssets.length === 0) return

    try {
      const response = await fetch("/api/media/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: selectedAssets }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `${selectedAssets.length} asset(s) deleted successfully`,
        })
        setSelectedAssets([])
        setShowDeleteDialog(false)
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete assets",
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentFolderId && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentFolderId(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold">Media Library</h1>
        </div>

        <div className="flex items-center space-x-2">
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
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createFolder()}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <label className="cursor-pointer">
            <Button disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {selectedAssets.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{selectedAssets.length} selected</span>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        className="min-h-96 border-2 border-dashed border-gray-300 rounded-lg p-6"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Folders</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {folders.map((folder) => (
                    <Card
                      key={folder.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setCurrentFolderId(folder.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <Folder className="h-12 w-12 mx-auto mb-2 text-blue-500" />
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
                                <DropdownMenuItem onClick={() => window.open(asset.blob_url, "_blank")}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
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
                        <CardContent className="p-4 flex items-center space-x-4">
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
                              <span>{formatDate(asset.created_at)}</span>
                              {asset.metadata?.width && asset.metadata?.height && (
                                <span>
                                  {asset.metadata.width} × {asset.metadata.height}
                                </span>
                              )}
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
                              <DropdownMenuItem onClick={() => window.open(asset.blob_url, "_blank")}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
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
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? "No assets match your search."
                    : "Drag and drop files here or click upload to get started."}
                </p>
                {!searchQuery && (
                  <label className="cursor-pointer">
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                  </label>
                )}
              </div>
            )}
          </>
        )}
      </div>

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
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>File Size:</strong> {formatFileSize(previewAsset.file_size)}
                </div>
                <div>
                  <strong>Type:</strong> {previewAsset.mime_type}
                </div>
                {previewAsset.metadata?.width && previewAsset.metadata?.height && (
                  <>
                    <div>
                      <strong>Dimensions:</strong> {previewAsset.metadata.width} × {previewAsset.metadata.height}
                    </div>
                  </>
                )}
                <div>
                  <strong>Uploaded:</strong> {formatDate(previewAsset.created_at)}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
            <AlertDialogAction onClick={deleteSelectedAssets} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
