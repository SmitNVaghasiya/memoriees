import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FolderOpen, Image as ImageIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Album {
  id: string;
  name: string;
  imageCount: number;
  coverImage?: string;
  createdAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([
    // Mock data - will be replaced with API calls
  ]);

  const handleSignOut = () => {
    // TODO: Implement sign out
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            <span className="text-xl font-semibold">PhotoShare</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Albums</h1>
            <p className="text-muted-foreground">Create and manage your photo collections</p>
          </div>
          <Button onClick={() => navigate("/upload")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Album
          </Button>
        </div>

        {/* Albums Grid */}
        {albums.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No albums yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first album to start sharing photos
            </p>
            <Button onClick={() => navigate("/upload")} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Album
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} onClick={() => navigate(`/gallery/${album.id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const AlbumCard = ({ album, onClick }: { album: Album; onClick: () => void }) => (
  <Card className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden" onClick={onClick}>
    <div className="aspect-square bg-muted flex items-center justify-center">
      {album.coverImage ? (
        <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      )}
    </div>
    <div className="p-4">
      <h3 className="font-semibold mb-1 truncate">{album.name}</h3>
      <p className="text-sm text-muted-foreground">
        {album.imageCount} {album.imageCount === 1 ? 'photo' : 'photos'}
      </p>
    </div>
  </Card>
);

export default Dashboard;
