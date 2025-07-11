"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  ImageIcon,
  Video,
  FileText,
  Trash2,
  Download,
  Eye,
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

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

interface UploadProgress {
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  error?: string
}

const ALLOWED_FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/webm", "video/mov"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
}

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB default

export default function MediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Load media files
  const loadMediaFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/media")
      if (response.ok) {
        const data = await response.json()
        setMediaFiles(data.media || [])
      }
    } catch (error) {
      console.error("Error loading media files:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMediaFiles()
  }, [loadMediaFiles])

  // Filter media files
  const filteredFiles = mediaFiles.filter((file) => {
    const matchesSearch =
      file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === "all" || file.file_type === filterType

    return matchesSearch && matchesType
  })

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    // Validate files
    fileArray.forEach((file) => {
      const isValidType = Object.values(ALLOWED_FILE_TYPES).flat().includes(file.type)
      const isValidSize = file.size <= MAX_FILE_SIZE

      if (!isValidType) {
        errors.push(`${file.name}: Unsupported file type`)
      } else if (!isValidSize) {
        errors.push(`${file.name}: File size exceeds 3MB limit`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      alert("Upload errors:\n" + errors.join("\n"))
    }

    if (validFiles.length === 0) return

    // Initialize upload progress
    const initialProgress: UploadProgress[] = validFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading",
    }))
    setUploadProgress(initialProgress)

    // Upload files
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          setUploadProgress((prev) =>
            prev.map((item, index) => (index === i ? { ...item, progress: 100, status: "success" } : item)),
          )
        } else {
          const error = await response.text()
          setUploadProgress((prev) =>
            prev.map((item, index) => (index === i ? { ...item, status: "error", error } : item)),
          )
        }
      } catch (error) {
        setUploadProgress((prev) =>
          prev.map((item, index) => (index === i ? { ...item, status: "error", error: "Upload failed" } : item)),
        )
      }
    }

    // Reload media files after upload
    setTimeout(() => {
      loadMediaFiles()
      setUploadProgress([])
      setShowUploadDialog(false)
    }, 2000)
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  // Delete media file
  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMediaFiles((prev) => prev.filter((file) => file.id !== fileId))
        setSelectedFile(null)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Get file type icon
  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (mimeType.startsWith("video/")) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
            <p className="text-muted-foreground">Manage your images, videos, and documents</p>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Media Files</DialogTitle>
                <DialogDescription>Drag and drop files or click to browse. Max file size: 3MB</DialogDescription>
              </DialogHeader>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Drop files here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse your computer</p>
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Browse Files</span>
                  </Button>
                </Label>
              </div>

              {/* Upload Progress */}
              {uploadProgress.length > 0 && (
                <div className="space-y-2 mt-4">
                  {uploadProgress.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.file.name}</span>
                        {item.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {item.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>
                      <Progress value={item.progress} className="h-2" />
                      {item.error && <p className="text-xs text-red-500">{item.error}</p>}
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No media files found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first media file to get started"}
              </p>
              {!searchTerm && filterType === "all" && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Media
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="group cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
                    {file.mime_type.startsWith("image/") ? (
                      <img
                        src={file.thumbnail_url || file.blob_url}
                        alt={file.original_filename}
                        className="w-full h-full object-cover"
                        onClick={() => setSelectedFile(file)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getFileTypeIcon(file.mime_type)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedFile(file)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" asChild>
                          <a href={file.blob_url} download={file.original_filename}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(file.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate" title={file.original_filename}>
                      {file.original_filename}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {file.file_type}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatFileSize(file.file_size)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        {file.mime_type.startsWith("image/") ? (
                          <img
                            src={file.thumbnail_url || file.blob_url}
                            alt={file.original_filename}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          getFileTypeIcon(file.mime_type)
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{file.original_filename}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {file.file_type}
                          </Badge>
                          <span className="text-sm text-gray-500">{formatFileSize(file.file_size)}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(file.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedFile(file)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={file.blob_url} download={file.original_filename}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Preview Dialog */}
        {selectedFile && (
          <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedFile.original_filename}</DialogTitle>
                <DialogDescription>{selectedFile.description || "No description available"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedFile.mime_type.startsWith("image/") && (
                  <div className="max-h-96 overflow-hidden rounded-lg">
                    <img
                      src={selectedFile.blob_url || "/placeholder.svg"}
                      alt={selectedFile.original_filename}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>File Type</Label>
                    <p className="mt-1">{selectedFile.mime_type}</p>
                  </div>
                  <div>
                    <Label>File Size</Label>
                    <p className="mt-1">{formatFileSize(selectedFile.file_size)}</p>
                  </div>
                  {selectedFile.width && selectedFile.height && (
                    <div>
                      <Label>Dimensions</Label>
                      <p className="mt-1">
                        {selectedFile.width} × {selectedFile.height}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label>Created</Label>
                    <p className="mt-1">{new Date(selectedFile.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {selectedFile.tags && selectedFile.tags.length > 0 && (
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFile.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" asChild>
                    <a href={selectedFile.blob_url} download={selectedFile.original_filename}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(selectedFile.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
