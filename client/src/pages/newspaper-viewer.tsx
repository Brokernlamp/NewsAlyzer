import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, useSearch } from "wouter";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/constants";
import type { Newspaper } from "@shared/schema";

export default function NewspaperViewer() {
  const [, params] = useRoute("/newspaper/:newspaperId");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const newspaperId = params?.newspaperId || "";
  const viewMode = new URLSearchParams(search).get('view') || 'full';

  const { data: newspaper, isLoading, error } = useQuery<Newspaper>({
    queryKey: ["/api/newspapers", newspaperId],
  });

  const handleBack = () => {
    setLocation("/");
  };

  const handleShare = () => {
    if (navigator.share && newspaper) {
      navigator.share({
        title: `${newspaper.name} - ${formatDisplayDate(newspaper.date)}`,
        text: `Read ${newspaper.name} for ${formatDisplayDate(newspaper.date)}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleZoom = () => {
    // Implementation for zoom functionality
    console.log("Zoom functionality not implemented yet");
  };

  if (isLoading) {
    return (
      <div className="pb-20" data-testid="page-newspaper-viewer-loading">
        <Header title="Loading..." onBack={handleBack} />
        <div className="p-4">
          <div className="animate-pulse">
            <div className="w-full h-64 bg-muted rounded-lg mb-4"></div>
            <div className="w-3/4 h-6 bg-muted rounded mb-2"></div>
            <div className="w-1/2 h-4 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !newspaper) {
    return (
      <div className="pb-20" data-testid="page-newspaper-viewer-error">
        <Header title="Newspaper Not Found" onBack={handleBack} />
        <div className="p-4">
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <span className="material-icons text-4xl text-destructive mb-2">error</span>
              <p className="text-destructive font-medium" data-testid="text-error-message">
                Newspaper not found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                The newspaper you're looking for may have been removed or doesn't exist.
              </p>
              <Button 
                onClick={handleBack} 
                className="mt-4"
                data-testid="button-go-back-error"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20" data-testid="page-newspaper-viewer">
      <Header 
        title={newspaper.name}
        onBack={handleBack}
        actions={
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleZoom}
              className="p-2 rounded-full hover:bg-primary/10"
              data-testid="button-zoom"
            >
              <span className="material-icons">zoom_in</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-primary/10"
              data-testid="button-share-newspaper"
            >
              <span className="material-icons">share</span>
            </Button>
          </div>
        }
      />

      <div className="p-4">
        {/* Newspaper Info */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground" data-testid="text-newspaper-name">
                  {newspaper.name}
                </h2>
                <p className="text-sm text-muted-foreground" data-testid="text-newspaper-date">
                  {formatDisplayDate(newspaper.date)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={`${
                    newspaper.status === 'processed' 
                      ? 'bg-accent text-accent-foreground' 
                      : newspaper.status === 'processing'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                  data-testid="badge-newspaper-status"
                >
                  {newspaper.status.charAt(0).toUpperCase() + newspaper.status.slice(1)}
                </Badge>
                <Badge variant="outline" data-testid="badge-view-mode">
                  {viewMode === 'summary' ? 'Summary View' : 'Full View'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Newspaper Viewer */}
        <div className="h-[70vh] pdf-viewer rounded-lg flex items-center justify-center" data-testid="newspaper-viewer-container">
          <div className="text-center">
            <span className="material-icons text-6xl text-muted-foreground mb-4">newspaper</span>
            <p className="text-lg font-medium text-foreground mb-2" data-testid="text-viewer-title">
              {viewMode === 'summary' ? 'Newspaper Summary' : 'Full Newspaper'}
            </p>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-viewer-subtitle">
              {newspaper.name} - {formatDisplayDate(newspaper.date)}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.open(`/uploads/${newspaper.filePath}`, '_blank')}
                className="block w-full"
                data-testid="button-view-full-paper"
              >
                <span className="material-icons mr-2">open_in_new</span>
                View Full Paper (PDF)
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setLocation(`/newspaper/${newspaperId}?view=summary`)}
                className="block w-full"
                disabled={viewMode === 'summary'}
                data-testid="button-view-summary"
              >
                <span className="material-icons mr-2">summarize</span>
                View Summary Only
              </Button>
            </div>
            
            {viewMode === 'summary' && newspaper.status === 'processed' && (
              <div className="mt-6 p-4 bg-muted rounded-lg text-left">
                <h3 className="font-medium mb-2 text-foreground">Summary</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-newspaper-summary">
                  This newspaper has been processed and articles have been categorized into UPSC subjects. 
                  You can find the summarized articles in their respective subject folders on the home page.
                </p>
              </div>
            )}

            {newspaper.status === 'processing' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-yellow-700">
                  <span className="material-icons animate-spin">refresh</span>
                  <span className="text-sm font-medium" data-testid="text-processing-status">
                    Processing in progress...
                  </span>
                </div>
                <p className="text-xs text-yellow-600 mt-1 text-center">
                  The newspaper is being analyzed and categorized. This may take a few minutes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* File Details */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <h3 className="font-medium mb-3 text-foreground">File Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Original filename:</span>
                <p className="font-medium text-foreground" data-testid="text-original-filename">
                  {newspaper.originalFileName}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">File size:</span>
                <p className="font-medium text-foreground" data-testid="text-file-size">
                  {(newspaper.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">File type:</span>
                <p className="font-medium text-foreground" data-testid="text-file-type">
                  {newspaper.mimeType}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Upload date:</span>
                <p className="font-medium text-foreground" data-testid="text-upload-date">
                  {formatDisplayDate(newspaper.createdAt.toString().split('T')[0])}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
