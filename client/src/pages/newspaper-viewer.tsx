import { useState, useRef, useEffect } from "react";
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
  
  // Enhanced viewer state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1); // Will be dynamic when we have multi-page support
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const viewerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const { data: newspaper, isLoading, error } = useQuery<Newspaper>({
    queryKey: ["/api/newspapers", newspaperId],
  });

  // Enhanced viewer functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handleFullscreen = () => {
    if (!isFullscreen && viewerRef.current) {
      viewerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Only consider horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const direction = deltaX > 0 ? 'right' : 'left';
      setSwipeDirection(direction);
      setShowSwipeIndicator(true);
    }
  };

  const handleTouchEnd = () => {
    if (swipeDirection) {
      if (swipeDirection === 'right' && currentPage > 1) {
        handlePreviousPage();
      } else if (swipeDirection === 'left' && currentPage < totalPages) {
        handleNextPage();
      }
    }
    
    setTouchStart(null);
    setSwipeDirection(null);
    setTimeout(() => setShowSwipeIndicator(false), 300);
  };

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isFullscreen) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isFullscreen, showControls]);

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
              onClick={handleFullscreen}
              className="p-2 rounded-full hover:bg-primary/10"
              data-testid="button-fullscreen"
            >
              <span className="material-icons">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
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

        {/* Enhanced Newspaper Viewer */}
        <div 
          ref={viewerRef}
          className={`newspaper-viewer ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-[70vh]'} relative`}
          data-testid="newspaper-viewer-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setShowControls(true)}
        >
          {viewMode === 'summary' ? (
            // Summary View
            <div className="h-full flex items-center justify-center p-4">
              <div className="summary-card w-full max-w-md fade-in">
                <div className="text-center mb-6">
                  <span className="material-icons text-4xl mb-4">summarize</span>
                  <h3 className="text-xl font-semibold mb-2">Daily Summary</h3>
                  <p className="text-sm opacity-90">
                    {newspaper.name} - {formatDisplayDate(newspaper.date)}
                  </p>
                </div>
                
                {newspaper.status === 'processed' ? (
                  <div className="space-y-4">
                    <div className="summary-highlight">
                      <h4 className="font-medium mb-2">Key Highlights</h4>
                      <p className="text-sm opacity-90">
                        Articles have been processed and categorized into UPSC subjects. 
                        Find detailed summaries in their respective subject folders.
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => setLocation('/')}
                        className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30"
                        data-testid="button-browse-subjects"
                      >
                        Browse Subjects
                      </Button>
                      <Button 
                        onClick={() => setLocation(`/newspaper/${newspaperId}`)}
                        variant="outline"
                        className="flex-1 bg-transparent border-white text-white hover:bg-white/10"
                        data-testid="button-view-full"
                      >
                        View Full Paper
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <span className="material-icons animate-spin">refresh</span>
                      <span className="text-sm font-medium">Processing...</span>
                    </div>
                    <p className="text-xs opacity-75">
                      Summary will be available once processing is complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Full Newspaper View
            <div className="h-full relative">
              {/* Newspaper Image/PDF Display */}
              <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                {newspaper.mimeType.includes('image') ? (
                  <img
                    ref={imageRef}
                    src={`/uploads/${newspaper.filePath.split('/').pop()}`}
                    alt={`${newspaper.name} - Page ${currentPage}`}
                    className="newspaper-page max-w-full max-h-full"
                    style={{ transform: `scale(${zoomLevel})` }}
                    data-testid="newspaper-image"
                  />
                ) : (
                  <div className="text-center">
                    <span className="material-icons text-6xl text-muted-foreground mb-4">picture_as_pdf</span>
                    <p className="text-lg font-medium text-foreground mb-4">PDF Document</p>
                    <Button 
                      onClick={() => window.open(`/uploads/${newspaper.filePath.split('/').pop()}`, '_blank')}
                      data-testid="button-open-pdf"
                    >
                      <span className="material-icons mr-2">open_in_new</span>
                      Open PDF
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Swipe Indicators */}
              <div className={`swipe-indicator left ${showSwipeIndicator && swipeDirection === 'right' ? 'show' : ''}`}>
                <span className="material-icons">chevron_left</span>
              </div>
              <div className={`swipe-indicator right ${showSwipeIndicator && swipeDirection === 'left' ? 'show' : ''}`}>
                <span className="material-icons">chevron_right</span>
              </div>
              
              {/* Page Navigation Controls */}
              {showControls && totalPages > 1 && (
                <div className="page-navigation fade-in">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="text-white hover:bg-white/20"
                    data-testid="button-previous-page"
                  >
                    <span className="material-icons">chevron_left</span>
                  </Button>
                  <span className="text-sm font-medium text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="text-white hover:bg-white/20"
                    data-testid="button-next-page"
                  >
                    <span className="material-icons">chevron_right</span>
                  </Button>
                </div>
              )}
              
              {/* Zoom Controls */}
              {showControls && newspaper.mimeType.includes('image') && (
                <div className="zoom-controls fade-in">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    className="text-white hover:bg-white/20"
                    data-testid="button-zoom-in"
                  >
                    <span className="material-icons">zoom_in</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleZoomReset}
                    className="text-white hover:bg-white/20"
                    data-testid="button-zoom-reset"
                  >
                    <span className="text-xs font-medium">{Math.round(zoomLevel * 100)}%</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="text-white hover:bg-white/20"
                    data-testid="button-zoom-out"
                  >
                    <span className="material-icons">zoom_out</span>
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Toggle Summary/Full View Button */}
          {showControls && (
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                onClick={() => setLocation(`/newspaper/${newspaperId}${viewMode === 'summary' ? '' : '?view=summary'}`)}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
                data-testid="button-toggle-view"
              >
                <span className="material-icons mr-1 text-sm">
                  {viewMode === 'summary' ? 'article' : 'summarize'}
                </span>
                {viewMode === 'summary' ? 'Full' : 'Summary'}
              </Button>
            </div>
          )}
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
