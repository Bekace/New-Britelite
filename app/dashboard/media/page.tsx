"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  DialogFooter,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Upload, Search, Grid, List, Download, Trash2, Eye, FileImage, FileVideo, FileText } from "lucide-react"

interface MediaFile {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  mime_type: string
  blob_url: string
  thumbnail_url?: string
  duration?: number
  width?: number
  height?: number
  tags: string[]
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/media")
      if (!response.ok) {
        throw new Error("Failed to fetch media files")
      }
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error",
        description: "Failed to load media files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleFileUpload = async (selectedFiles: FileList) => {
    if (!selectedFiles.length) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }

      toast({
        title: "Success",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      })

      await fetchFiles()
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      })

      await fetchFiles()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === "all" || file.file_type === filterType

    return matchesSearch && matchesType
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <FileImage className="h-4 w-4" />
      case "video":
        return <FileVideo className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading media files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Upload and manage your media files</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Media Files</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse. Supported formats: Images, Videos, Documents (Max 3MB per file)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop files here to upload</p>
              <p className="text-sm text-muted-foreground">or</p>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" disabled={uploading}>
                  {uploading ? "Uploading..." : "Browse Files"}
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  disabled={uploading}
                />
              </Label>
            </div>
            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Uploading... {Math.round(uploadProgress)}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No files found</h3>
            <p className="text-muted-foreground text-center">
              {files.length === 0
                ? "Upload your first media file to get started"
                : "Try adjusting your search or filter criteria"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-4"
          }
        >
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group hover:shadow-md transition-shadow">
              <CardContent className={viewMode === "grid" ? "p-4" : "p-4 flex items-center gap-4"}>
                {viewMode === "grid" ? (
                  <div className="space-y-3">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {file.file_type === "image" && file.thumbnail_url ? (
                        <img
                          src={file.thumbnail_url || "/placeholder.svg"}
                          alt={file.original_filename}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setSelectedFile(file)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getFileIcon(file.file_type)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm truncate" title={file.original_filename}>
                        {file.original_filename}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {file.file_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                      </div>
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{file.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.file_type === "image" && (
                        <Button size="sm" variant="outline" onClick={() => setSelectedFile(file)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => window.open(file.blob_url, "_blank")}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.original_filename}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <DialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteFile(file.id)}>Delete</AlertDialogAction>
                          </DialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      {file.file_type === "image" && file.thumbnail_url ? (
                        <img
                          src={file.thumbnail_url || "/placeholder.svg"}
                          alt={file.original_filename}
                          className="w-16 h-16 object-cover rounded cursor-pointer"
                          onClick={() => setSelectedFile(file)}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(file.file_type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{file.original_filename}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {file.file_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formatFileSize(file.file_size)}</span>
                        {file.width && file.height && (
                          <span className="text-sm text-muted-foreground">
                            {file.width}×{file.height}
                          </span>
                        )}
                      </div>
                      {file.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{file.description}</p>
                      )}
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {file.file_type === "image" && (
                        <Button size="sm" variant="outline" onClick={() => setSelectedFile(file)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => window.open(file.blob_url, "_blank")}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.original_filename}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <DialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteFile(file.id)}>Delete</AlertDialogAction>
                          </DialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Preview Dialog */}
      {selectedFile && selectedFile.file_type === "image" && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.original_filename}</DialogTitle>
              <DialogDescription>
                {selectedFile.width && selectedFile.height && (
                  <span>
                    {selectedFile.width}×{selectedFile.height} •{" "}
                  </span>
                )}
                {formatFileSize(selectedFile.file_size)} • {selectedFile.mime_type}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto">
              <img
                src={selectedFile.blob_url || "/placeholder.svg"}
                alt={selectedFile.original_filename}
                className="w-full h-auto"
              />
            </div>
            {selectedFile.description && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedFile.description}</p>
              </div>
            )}
            {selectedFile.tags.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFile.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
