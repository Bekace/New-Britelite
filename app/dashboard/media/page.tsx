"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
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
  Link,
  Presentation,
  Edit,
  Folder,
  FolderPlus,
  Move,
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
  google_slides_url?: string
  embed_url?: string
  folder_id?: string
  folder_name?: string
}

interface FolderType {
  id: string
  name: string
  description?: string
  parent_id?: string
  file_count: number
  created_at: string
  updated_at: string
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [deleteFile, setDeleteFile] = useState<MediaFile | null>(null)
  const [editFile, setEditFile] = useState<MediaFile | null>(null)
  const [googleSlidesUrl, setGoogleSlidesUrl] = useState("")
  const [addingGoogleSlides, setAddingGoogleSlides] = useState(false)
  const [editDescription, setEditDescription] = useState("")
  const [editTags, setEditTags] = useState("")
  const [editGoogleSlidesUrl, setEditGoogleSlidesUrl] = useState("")
  const [saving, setSaving] = useState(false)

  // Folder management
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderDescription, setNewFolderDescription] = useState("")
  const [creatingFolder, setCreatingFolder] = useState(false)

  // Bulk operations
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAction, setBulkAction] = useState<"delete" | "move" | null>(null)
  const [bulkTargetFolder, setBulkTargetFolder] = useState<string>("")
  const [performingBulkAction, setPerformingBulkAction] = useState(false)

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch("/api/folders")
      if (!response.ok) {
        throw new Error("Failed to fetch folders")
      }
      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error("Error fetching folders:", error)
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive",
      })
    }
  }, [])

  const fetchFiles = useCallback(async () => {
    try {
      const url = currentFolder ? `/api/media?folderId=${currentFolder}` : "/api/media"
      const response = await fetch(url)
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
  }, [currentFolder])

  useEffect(() => {
    fetchFolders()
    fetchFiles()
  }, [fetchFolders, fetchFiles])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      })
      return
    }

    setCreatingFolder(true)

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create folder")
      }

      const result = await response.json()
      setFolders((prev) => [...prev, { ...result.folder, file_count: 0 }])
      setNewFolderName("")
      setNewFolderDescription("")
      setShowCreateFolder(false)

      toast({
        title: "Success",
        description: "Folder created successfully",
      })
    } catch (error) {
      console.error("Create folder error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive",
      })
    } finally {
      setCreatingFolder(false)
    }
  }

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
        if (currentFolder) {
          formData.append("folderId", currentFolder)
        }

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

      // Refresh folders to update file counts
      fetchFolders()
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

  const handleGoogleSlidesSubmit = async () => {
    if (!googleSlidesUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Google Slides URL",
        variant: "destructive",
      })
      return
    }

    // Validate Google Slides URL
    if (!googleSlidesUrl.includes("docs.google.com/presentation")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Google Slides share link",
        variant: "destructive",
      })
      return
    }

    setAddingGoogleSlides(true)

    try {
      const response = await fetch("/api/media/google-slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: googleSlidesUrl,
          folderId: currentFolder,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add Google Slides")
      }

      const result = await response.json()
      setFiles((prev) => [result.file, ...prev])
      setGoogleSlidesUrl("")

      toast({
        title: "Success",
        description: "Google Slides added successfully",
      })

      // Refresh folders to update file counts
      fetchFolders()
    } catch (error) {
      console.error("Google Slides error:", error)
      toast({
        title: "Error",
        description: "Failed to add Google Slides",
        variant: "destructive",
      })
    } finally {
      setAddingGoogleSlides(false)
    }
  }

  const handleEditFile = (file: MediaFile) => {
    setEditFile(file)
    setEditDescription(file.description || "")
    setEditTags(file.tags ? file.tags.join(", ") : "")
    setEditGoogleSlidesUrl(file.google_slides_url || "")
  }

  const handleSaveEdit = async () => {
    if (!editFile) return

    // Validate Google Slides URL if it's a Google Slides file and URL is provided
    if (editFile.file_type === "google-slides" && editGoogleSlidesUrl.trim()) {
      if (!editGoogleSlidesUrl.includes("docs.google.com/presentation")) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid Google Slides share link",
          variant: "destructive",
        })
        return
      }
    }

    setSaving(true)

    try {
      const tagsArray = editTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const requestBody: any = {
        description: editDescription.trim() || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
      }

      // Add Google Slides URL if it's a Google Slides file
      if (editFile.file_type === "google-slides") {
        requestBody.google_slides_url = editGoogleSlidesUrl.trim() || null
      }

      const response = await fetch(`/api/media/${editFile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("Failed to update file")
      }

      const result = await response.json()

      // Update the file in the list
      setFiles((prev) => prev.map((file) => (file.id === editFile.id ? result.file : file)))

      setEditFile(null)
      setEditDescription("")
      setEditTags("")
      setEditGoogleSlidesUrl("")

      toast({
        title: "Success",
        description: "File updated successfully",
      })
    } catch (error) {
      console.error("Edit error:", error)
      toast({
        title: "Error",
        description: "Failed to update file",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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

      // Refresh folders to update file counts
      fetchFolders()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (checked) {
      newSelected.add(fileId)
    } else {
      newSelected.delete(fileId)
    }
    setSelectedFiles(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)))
      setShowBulkActions(true)
    } else {
      setSelectedFiles(new Set())
      setShowBulkActions(false)
    }
  }

  const handleBulkOperation = async () => {
    if (!bulkAction || selectedFiles.size === 0) return

    if (bulkAction === "move" && !bulkTargetFolder) {
      toast({
        title: "Error",
        description: "Please select a target folder",
        variant: "destructive",
      })
      return
    }

    setPerformingBulkAction(true)

    try {
      const response = await fetch("/api/media/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: bulkAction,
          fileIds: Array.from(selectedFiles),
          folderId: bulkAction === "move" ? bulkTargetFolder : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to perform bulk operation")
      }

      const result = await response.json()

      if (bulkAction === "delete") {
        setFiles((prev) => prev.filter((f) => !selectedFiles.has(f.id)))
      } else if (bulkAction === "move") {
        // Refresh files to show updated folder assignments
        fetchFiles()
      }

      setSelectedFiles(new Set())
      setShowBulkActions(false)
      setBulkAction(null)
      setBulkTargetFolder("")

      toast({
        title: "Success",
        description: result.message,
      })

      // Refresh folders to update file counts
      fetchFolders()
    } catch (error) {
      console.error("Bulk operation error:", error)
      toast({
        title: "Error",
        description: "Failed to perform bulk operation",
        variant: "destructive",
      })
    } finally {
      setPerformingBulkAction(false)
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
      case "google-slides":
        return <Presentation className="h-4 w-4 text-orange-600" />
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
    } else if (file.file_type === "google-slides") {
      return (
        <div className={`${containerClass} flex items-center justify-center bg-orange-50`}>
          {file.thumbnail_url ? (
            <img
              src={file.thumbnail_url || "/placeholder.svg"}
              alt={file.original_filename}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Presentation className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-xs font-medium text-orange-700">Google Slides</span>
            </div>
          )}
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

  const currentFolderName = currentFolder
    ? folders.find((f) => f.id === currentFolder)?.name || "Unknown Folder"
    : "All Files"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Upload and manage your media files</p>
        </div>
      </div>

      {/* Folder Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Folders
          </CardTitle>
          <CardDescription>Organize your media files into folders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={currentFolder === null ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentFolder(null)}
            >
              All Files ({files.length})
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={currentFolder === folder.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentFolder(folder.id)}
              >
                <Folder className="h-4 w-4 mr-1" />
                {folder.name} ({folder.file_count})
              </Button>
            ))}
          </div>

          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>Create a new folder to organize your media files</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    placeholder="Enter folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    disabled={creatingFolder}
                  />
                </div>
                <div>
                  <Label htmlFor="folder-description">Description (Optional)</Label>
                  <Textarea
                    id="folder-description"
                    placeholder="Enter folder description"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    disabled={creatingFolder}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateFolder(false)} disabled={creatingFolder}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}>
                    {creatingFolder ? "Creating..." : "Create Folder"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Current Folder Info */}
      {currentFolder && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Folder className="h-4 w-4" />
          <span>Current folder: {currentFolderName}</span>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{selectedFiles.size} file(s) selected</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkAction("delete")}
                    disabled={performingBulkAction}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkAction("move")}
                    disabled={performingBulkAction}
                  >
                    <Move className="h-4 w-4 mr-2" />
                    Move to Folder
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFiles(new Set())
                  setShowBulkActions(false)
                }}
              >
                Clear Selection
              </Button>
            </div>

            {bulkAction === "move" && (
              <div className="mt-4 flex items-center gap-2">
                <Label>Move to:</Label>
                <Select value={bulkTargetFolder} onValueChange={setBulkTargetFolder}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkOperation} disabled={performingBulkAction}>
                  {performingBulkAction ? "Moving..." : "Move Files"}
                </Button>
                <Button variant="outline" onClick={() => setBulkAction(null)}>
                  Cancel
                </Button>
              </div>
            )}

            {bulkAction === "delete" && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-destructive">
                  Are you sure you want to delete {selectedFiles.size} file(s)? This action cannot be undone.
                </span>
                <Button variant="destructive" onClick={handleBulkOperation} disabled={performingBulkAction}>
                  {performingBulkAction ? "Deleting..." : "Confirm Delete"}
                </Button>
                <Button variant="outline" onClick={() => setBulkAction(null)}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Media Files</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse. Maximum file size: 3MB per file.
            {currentFolder && ` Files will be uploaded to "${currentFolderName}" folder.`}
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

      {/* Google Slides Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Add Google Slides
          </CardTitle>
          <CardDescription>
            Paste a Google Slides share link to add it to your media library.
            {currentFolder && ` It will be added to "${currentFolderName}" folder.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="google-slides-url">Google Slides Share Link</Label>
              <Textarea
                id="google-slides-url"
                placeholder="https://docs.google.com/presentation/d/..."
                value={googleSlidesUrl}
                onChange={(e) => setGoogleSlidesUrl(e.target.value)}
                disabled={addingGoogleSlides}
                className="mt-1"
              />
            </div>
            <Button onClick={handleGoogleSlidesSubmit} disabled={addingGoogleSlides || !googleSlidesUrl.trim()}>
              {addingGoogleSlides ? "Adding..." : "Add Google Slides"}
            </Button>
          </div>
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
              <SelectItem value="google-slides">Google Slides</SelectItem>
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

      {/* Select All Checkbox */}
      {filteredFiles.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <Label className="text-sm">Select all files</Label>
        </div>
      )}

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
                    <div className="relative">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        {renderThumbnail(file, "small")}
                      </div>
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={selectedFiles.has(file.id)}
                          onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                          className="bg-white/80 border-white/80"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {file.file_type === "document"
                            ? getDocumentTypeName(file.mime_type)
                            : file.file_type === "google-slides"
                              ? "Google Slides"
                              : file.file_type}
                        </Badge>
                        {file.file_type !== "google-slides" && (
                          <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                        )}
                        {file.file_type === "video" && file.duration && (
                          <span className="text-xs text-muted-foreground">{formatDuration(file.duration)}</span>
                        )}
                      </div>

                      <h4 className="font-medium text-sm truncate" title={file.original_filename}>
                        {file.original_filename}
                      </h4>

                      {file.folder_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Folder className="h-3 w-3" />
                          <span>{file.folder_name}</span>
                        </div>
                      )}

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

                      <Button variant="outline" size="sm" onClick={() => handleEditFile(file)}>
                        <Edit className="h-3 w-3" />
                      </Button>

                      {file.file_type !== "google-slides" && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.blob_url} download={file.original_filename}>
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      )}

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
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                      />
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                          {renderThumbnail(file, "small")}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{file.original_filename}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {file.file_type === "document"
                            ? getDocumentTypeName(file.mime_type)
                            : file.file_type === "google-slides"
                              ? "Google Slides"
                              : file.file_type}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {file.file_type !== "google-slides" && formatFileSize(file.file_size)} •{" "}
                        {new Date(file.created_at).toLocaleDateString()}
                        {file.file_type === "video" && file.duration && <> • {formatDuration(file.duration)}</>}
                      </p>

                      {file.folder_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Folder className="h-3 w-3" />
                          <span>{file.folder_name}</span>
                        </div>
                      )}

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

                      <Button variant="outline" size="sm" onClick={() => handleEditFile(file)}>
                        <Edit className="h-4 w-4" />
                      </Button>

                      {file.file_type !== "google-slides" && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.blob_url} download={file.original_filename}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}

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
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedFile.original_filename}</DialogTitle>
              <DialogDescription>
                {selectedFile.file_type === "document"
                  ? getDocumentTypeName(selectedFile.mime_type)
                  : selectedFile.file_type === "google-slides"
                    ? "Google Slides"
                    : selectedFile.file_type}{" "}
                {selectedFile.file_type !== "google-slides" && <>• {formatFileSize(selectedFile.file_size)}</>}
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
              ) : selectedFile.file_type === "google-slides" ? (
                <div className="w-full h-96 rounded-lg overflow-hidden">
                  <iframe
                    src={selectedFile.embed_url}
                    className="w-full h-full border-0"
                    allowFullScreen
                    title={selectedFile.original_filename}
                  />
                </div>
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

              {selectedFile.folder_name && (
                <div>
                  <Label className="text-sm font-medium">Folder</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{selectedFile.folder_name}</span>
                  </div>
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
                  <Label className="font-medium">
                    {selectedFile.file_type === "google-slides" ? "Source" : "File Type"}
                  </Label>
                  <p className="text-muted-foreground">
                    {selectedFile.file_type === "google-slides" ? "Google Slides" : selectedFile.mime_type}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit File Dialog */}
      {editFile && (
        <Dialog open={!!editFile} onOpenChange={() => setEditFile(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit File</DialogTitle>
              <DialogDescription>
                Update the {editFile.file_type === "google-slides" ? "link, " : ""}description and tags for "
                {editFile.original_filename}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {editFile.file_type === "google-slides" && (
                <div>
                  <Label htmlFor="edit-google-slides-url">Google Slides URL</Label>
                  <Textarea
                    id="edit-google-slides-url"
                    placeholder="https://docs.google.com/presentation/d/..."
                    value={editGoogleSlidesUrl}
                    onChange={(e) => setEditGoogleSlidesUrl(e.target.value)}
                    disabled={saving}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Update the Google Slides share link to change the presentation
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter a description for this file..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={saving}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-tags">Tags</Label>
                <Input
                  id="edit-tags"
                  placeholder="Enter tags separated by commas (e.g., logo, brand, marketing)"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  disabled={saving}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditFile(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
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
