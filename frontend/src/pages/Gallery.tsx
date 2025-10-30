import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Download, Share2, Play, Copy, CheckCircle2, Image as ImageIcon, Plus, Upload as UploadIcon, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface Photo {
  id: string;
  url: string;
  name: string;
}

const Gallery = () => {
  const navigate = useNavigate();
  const { albumId } = useParams();
  const [photos, setPhotos] = useState<Photo[]>([
    // Mock data - will be replaced with API calls
  ]);
  const [collections, setCollections] = useState<any[]>([
    // Collections for segregating photos (like Google Photos)
  ]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shareUrl = window.location.href;

  const togglePhoto = (id: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const handleDownload = async () => {
    if (selectedPhotos.size === 0) {
      toast.error("Please select at least one photo");
      return;
    }

    // TODO: Implement download logic
    toast.success(`Downloading ${selectedPhotos.size} ${selectedPhotos.size === 1 ? 'photo' : 'photos'}...`);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const startSlideshow = () => {
    navigate(`/slideshow/${albumId}`);
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // TODO: Implement add photos to existing album via API
      toast.success(`Adding ${newFiles.length} ${newFiles.length === 1 ? 'photo' : 'photos'} to album...`);
      console.log("Adding photos to album:", albumId, newFiles);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <ImageIcon className="h-6 w-6" />
              <span className="text-xl font-semibold">Album Name</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAddPhotos}
            />
          </div>

          {/* Tabs for All Photos and Collections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                All Photos
              </TabsTrigger>
              <TabsTrigger value="collections" className="gap-2">
                <Users className="h-4 w-4" />
                Collections
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Actions Bar */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} className="gap-2">
              <Checkbox checked={selectedPhotos.size === photos.length && photos.length > 0} />
              {selectedPhotos.size === photos.length && photos.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedPhotos.size > 0 && (
              <span className="flex items-center px-3 py-2 text-sm text-muted-foreground">
                {selectedPhotos.size} selected
              </span>
            )}

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={startSlideshow} className="gap-2">
                <Play className="h-4 w-4" />
                Slideshow
              </Button>
              <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-2">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download ({selectedPhotos.size})
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "all" && (
          <>
            {photos.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No photos in this album</h2>
                <p className="text-muted-foreground mb-4">Photos will appear here once uploaded</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Photos
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    selected={selectedPhotos.has(photo.id)}
                    onToggle={() => togglePhoto(photo.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "collections" && (
          <div className="space-y-6">
            {collections.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No collections yet</h2>
                <p className="text-muted-foreground mb-4">
                  Create collections to organize photos by people or groups
                </p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Collection
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {collections.map((collection) => (
                  <div key={collection.id}>
                    <h3 className="text-lg font-semibold mb-4">{collection.name}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {/* Collection photos will be rendered here */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const PhotoCard = ({ 
  photo, 
  selected, 
  onToggle 
}: { 
  photo: Photo; 
  selected: boolean; 
  onToggle: () => void;
}) => (
  <div className="relative group cursor-pointer" onClick={onToggle}>
    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
      <img
        src={photo.url}
        alt={photo.name}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
    </div>
    <div className="absolute top-2 left-2">
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="bg-background"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
    {selected && (
      <div className="absolute inset-0 bg-primary/20 rounded-lg border-2 border-primary" />
    )}
  </div>
);

export default Gallery;
