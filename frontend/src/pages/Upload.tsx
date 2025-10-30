import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload as UploadIcon, X, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const [albumName, setAlbumName] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleUpload = async () => {
    if (!albumName.trim()) {
      toast.error("Please enter an album name");
      return;
    }
    
    if (files.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }

    // TODO: Implement upload to backend/Google Drive
    console.log("Uploading album:", albumName, "with", files.length, "files");
    
    // Simulate upload
    toast.success("Album created successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            <span className="text-xl font-semibold">Create Album</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Album Name */}
          <div>
            <Label htmlFor="albumName">Album Name</Label>
            <Input
              id="albumName"
              placeholder="e.g., Summer Vacation 2024"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Upload Area */}
          <div>
            <Label>Photos</Label>
            <Card
              className={`mt-2 border-2 border-dashed transition-colors ${
                isDragging ? 'border-primary bg-accent' : 'border-border'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-12 text-center">
                <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Drop your photos here</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse from your device
                </p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Select Photos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </Card>
          </div>

          {/* Preview Grid */}
          {files.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>{files.length} {files.length === 1 ? 'photo' : 'photos'} selected</Label>
                <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpload} className="flex-1 gap-2">
              <UploadIcon className="h-4 w-4" />
              Create Album
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;
