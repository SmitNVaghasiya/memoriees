import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

interface Photo {
  id: string;
  url: string;
  name: string;
}

const Slideshow = () => {
  const navigate = useNavigate();
  const { albumId } = useParams();
  const [photos, setPhotos] = useState<Photo[]>([
    // Mock data - will be replaced with API calls
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (isPlaying && photos.length > 0) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isPlaying, photos.length]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setShowControls(true);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setShowControls(true);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const handleClose = () => {
    navigate(`/gallery/${albumId}`);
  };

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No photos to display</p>
          <Button onClick={handleClose}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Current Photo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={photos[currentIndex]?.url}
          alt={photos[currentIndex]?.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">
              {currentIndex + 1} / {photos.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute inset-y-0 left-0 flex items-center p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="text-white hover:bg-white/20 h-12 w-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>

        <div className="absolute inset-y-0 right-0 flex items-center p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="text-white hover:bg-white/20 h-12 w-12"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slideshow;
