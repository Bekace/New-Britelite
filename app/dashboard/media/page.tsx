"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  Upload,
  Search,
  Grid,
  List,
  Download,
  Trash2,
  Eye,
  FileImage,
  FileVideo,
  FileText,
  Filter,
  Play,
  File,
} from "lucide-react"

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
  tags?: string[]
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [deleteFile, setDeleteFile] = useState<MediaFile | null>(null)

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]

        // Validate file size (3MB limit)
        if (file.size > 3 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 3MB limit`,
            variant: "destructive",
          })
          continue
        }

        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const result = await response.json()
        setFiles((prev) => [result.file, ...prev])

        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }

      toast({
        title: "Success",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload one or more files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset file input
      event.target.value = ""
    }
  }

  const handleBrowseClick = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0) {
      // Create a fake input event to reuse the upload logic
      const fakeEvent = {
        target: { files: droppedFiles },
      } as React.ChangeEvent<HTMLInputElement>
      handleFileUpload(fakeEvent)
    }
  }

  const handleDeleteFile = async (file: MediaFile) => {
    try {
      const response = await fetch(`/api/media/${file.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      setDeleteFile(null)

      toast({
        title: "Success",
        description: "File deleted successfully",
      })
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
      file.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterType === "all" || file.file_type === filterType

    return matchesSearch && matchesFilter
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "Unknown"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getFileIcon = (fileType: string, mimeType?: string) => {
    switch (fileType) {
      case "image":
        return <FileImage className="h-4 w-4" />
      case "video":
        return <FileVideo className="h-4 w-4" />
      case "document":
        // Return specific icons based on document type
        if (mimeType?.includes("pdf")) {
          return <File className="h-4 w-4 text-red-600" />
        } else if (mimeType?.includes("word") || mimeType?.includes("msword")) {
          return <File className="h-4 w-4 text-blue-600" />
        } else if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet")) {
          return <File className="h-4 w-4 text-green-600" />
        } else if (mimeType?.includes("powerpoint") || mimeType?.includes("presentation")) {
          return <File className="h-4 w-4 text-orange-600" />
        } else {
          return <FileText className="h-4 w-4" />
        }
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getDocumentTypeName = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "PDF"
    if (mimeType.includes("word") || mimeType.includes("msword")) return "Word"
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "Excel"
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "PowerPoint"
    if (mimeType.includes("text/plain")) return "Text"
    if (mimeType.includes("csv")) return "CSV"
    return "Document"
  }

  const renderThumbnail = (file: MediaFile, size: "small" | "large" = "small") => {
    const containerClass = size === "small" ? "w-full h-full" : "max-h-96 overflow-hidden rounded-lg"

    if (file.file_type === "image") {
      return (
        <img
          src={file.thumbnail_url || file.blob_url || "/placeholder.svg"}
          alt={file.original_filename}
          className={`${containerClass} object-cover`}
        />
      )
    } else if (file.file_type === "video") {
      return (
        <div className={`${containerClass} relative bg-black flex items-center justify-center`}>
          {file.thumbnail_url ? (
            <img
              src={file.thumbnail_url || "/placeholder.svg"}
              alt={file.original_filename}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <Play className="h-8 w-8 mx-auto mb-2 text-white" />
                <FileVideo className="h-6 w-6 mx-auto text-white" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-3">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
        </div>
      )
    } else if (file.file_type === "document") {
      return (
        <div className={`${containerClass} flex items-center justify-center`}>
          {file.thumbnail_url ? (
            <img
              src={file.thumbnail_url || "/placeholder.svg"}
              alt={file.original_filename}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
              {getFileIcon(file.file_type, file.mime_type)}
              <span className="text-xs mt-1 font-medium">{getDocumentTypeName(file.mime_type)}</span>
            </div>
          )}
        </div>
      )
    } else {
      return (
        <div className={`${containerClass} flex items-center justify-center bg-muted`}>
          {getFileIcon(file.file_type, file.mime_type)}
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Upload and manage your media files</p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Media Files</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse. Maximum file size: 3MB per file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop files here to upload</p>
              <p className="text-sm text-muted-foreground">
                Supports images, videos, and documents (PDF, Word, Excel, PowerPoint)
              </p>
              <Button variant="outline" disabled={uploading} onClick={handleBrowseClick}>
                {uploading ? "Uploading..." : "Browse Files"}
              </Button>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
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
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
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
          <CardContent className="py-12">
            <div className="text-center">
              <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Upload your first media file to get started"}
              </p>
            </div>
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
                      {renderThumbnail(file, "small")}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {file.file_type === "document" ? getDocumentTypeName(file.mime_type) : file.file_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                        {file.file_type === "video" && file.duration && (
                          <span className="text-xs text-muted-foreground">{formatDuration(file.duration)}</span>
                        )}
                      </div>

                      <h4 className="font-medium text-sm truncate" title={file.original_filename}>
                        {file.original_filename}
                      </h4>

                      {file.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{file.description}</p>
                      )}

                      {file.tags && file.tags.length > 0 && (
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

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedFile(file)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>

                      <Button variant="outline" size="sm" asChild>
                        <a href={file.blob_url} download={file.original_filename}>
                          <Download className="h-3 w-3" />
                        </a>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setDeleteFile(file)}>
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
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFile(file)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {renderThumbnail(file, "small")}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{file.original_filename}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {file.file_type === "document" ? getDocumentTypeName(file.mime_type) : file.file_type}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                        {file.file_type === "video" && file.duration && <> • {formatDuration(file.duration)}</>}
                      </p>

                      {file.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{file.description}</p>
                      )}

                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedFile(file)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>

                      <Button variant="outline" size="sm" asChild>
                        <a href={file.blob_url} download={file.original_filename}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setDeleteFile(file)}>
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
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFile(file)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
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

      {/* File Preview Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.original_filename}</DialogTitle>
              <DialogDescription>
                {selectedFile.file_type === "document"
                  ? getDocumentTypeName(selectedFile.mime_type)
                  : selectedFile.file_type}{" "}
                • {formatFileSize(selectedFile.file_size)}
                {selectedFile.width && selectedFile.height && selectedFile.file_type !== "document" && (
                  <>
                    {" "}
                    • {selectedFile.width} × {selectedFile.height}
                  </>
                )}
                {selectedFile.file_type === "video" && selectedFile.duration && (
                  <> • {formatDuration(selectedFile.duration)}</>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedFile.file_type === "image" ? (
                <div className="max-h-96 overflow-hidden rounded-lg">
                  <img
                    src={selectedFile.blob_url || "/placeholder.svg"}
                    alt={selectedFile.original_filename}
                    className="w-full h-auto"
                  />
                </div>
              ) : selectedFile.file_type === "video" ? (
                <video src={selectedFile.blob_url} controls autoPlay muted className="w-full max-h-96 rounded-lg">
                  Your browser does not support the video tag.
                </video>
              ) : selectedFile.file_type === "document" ? (
                <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                  <div className="text-center">
                    {selectedFile.thumbnail_url ? (
                      <img
                        src={selectedFile.thumbnail_url || "/placeholder.svg"}
                        alt={selectedFile.original_filename}
                        className="w-32 h-32 object-contain mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-32 h-32 flex flex-col items-center justify-center mx-auto mb-4 bg-white rounded-lg shadow-sm">
                        {getFileIcon(selectedFile.file_type, selectedFile.mime_type)}
                        <span className="text-sm font-medium mt-2">{getDocumentTypeName(selectedFile.mime_type)}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Document preview not available. Click download to view the file.
                    </p>
                    <Button variant="outline" className="mt-4 bg-transparent" asChild>
                      <a href={selectedFile.blob_url} download={selectedFile.original_filename}>
                        <Download className="h-4 w-4 mr-2" />
                        Download to View
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                  {getFileIcon(selectedFile.file_type, selectedFile.mime_type)}
                  <span className="ml-2">Preview not available</span>
                </div>
              )}

              {selectedFile.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedFile.description}</p>
                </div>
              )}

              {selectedFile.tags && selectedFile.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFile.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Created</Label>
                  <p className="text-muted-foreground">{new Date(selectedFile.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-medium">File Type</Label>
                  <p className="text-muted-foreground">{selectedFile.mime_type}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteFile && (
        <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteFile.original_filename}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteFile(deleteFile)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
