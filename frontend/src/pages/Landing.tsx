import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Share2, Download, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            <span className="text-xl font-semibold">PhotoShare</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Share photos without limits
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Upload unlimited photos to your Google Drive. Share with anyone. 
            Let them choose what to download. Simple, fast, original quality.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Upload className="h-6 w-6" />}
            title="Upload Unlimited"
            description="No 30-image limit. Upload your entire collection in one go."
          />
          <FeatureCard
            icon={<Share2 className="h-6 w-6" />}
            title="Share Easily"
            description="Generate a link. Share with anyone. They see everything instantly."
          />
          <FeatureCard
            icon={<Download className="h-6 w-6" />}
            title="Selective Download"
            description="Recipients choose which photos they want. Download one or all."
          />
          <FeatureCard
            icon={<ImageIcon className="h-6 w-6" />}
            title="Original Quality"
            description="Stored in your Google Drive. Full resolution. No compression."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <Step number="1" title="Connect Google Drive" description="Sign in and connect your Google account. Your photos will be stored in your own Drive." />
          <Step number="2" title="Create & Upload" description="Create an album and upload all your photos at once. No limits." />
          <Step number="3" title="Share the Link" description="Generate a shareable link. Send it to anyone via WhatsApp, email, or text." />
          <Step number="4" title="They Choose" description="Recipients browse all photos, select what they want, and download. Or view as a slideshow." />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to simplify photo sharing?</h2>
          <p className="text-muted-foreground mb-8">Start sharing unlimited photos today. Free to get started.</p>
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 PhotoShare. Built to make sharing photos simple.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground mb-4">
      {icon}
    </div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const Step = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
      {number}
    </div>
    <div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Landing;
