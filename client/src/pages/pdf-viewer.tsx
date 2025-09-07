import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Article } from "@shared/schema";

export default function PdfViewer() {
  const [, params] = useRoute("/pdf/:articleId");
  const [, setLocation] = useLocation();
  const articleId = params?.articleId || "";

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ["/api/articles", articleId],
  });

  const handleBack = () => {
    if (article?.subjectId) {
      setLocation(`/subject/${article.subjectId}`);
    } else {
      setLocation("/");
    }
  };

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-20" data-testid="page-pdf-viewer-loading">
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

  if (error || !article) {
    return (
      <div className="pb-20" data-testid="page-pdf-viewer-error">
        <Header title="Article Not Found" onBack={handleBack} />
        <div className="p-4">
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <span className="material-icons text-4xl text-destructive mb-2">error</span>
              <p className="text-destructive font-medium" data-testid="text-error-message">
                Article not found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                The article you're looking for may have been removed or doesn't exist.
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
    <div className="pb-20" data-testid="page-pdf-viewer">
      <Header 
        title={article.title}
        onBack={handleBack}
        actions={
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-primary/10"
            data-testid="button-share-article"
          >
            <span className="material-icons">share</span>
          </Button>
        }
      />

      <div className="p-4">
        {/* Article Info */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <h2 className="font-semibold text-foreground" data-testid="text-article-title">
                {article.title}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span data-testid="text-article-pages">{article.pageCount} pages</span>
                <span data-testid="text-article-read-time">{article.readTime} min read</span>
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-article-summary">
                {article.summary}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PDF Viewer Placeholder */}
        <div className="h-[70vh] pdf-viewer rounded-lg flex items-center justify-center" data-testid="pdf-viewer-container">
          <div className="text-center">
            <span className="material-icons text-6xl text-muted-foreground mb-4">picture_as_pdf</span>
            <p className="text-lg font-medium text-foreground mb-2" data-testid="text-pdf-title">
              PDF Document
            </p>
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-pdf-subtitle">
              {article.title}
            </p>
            {article.pdfPath ? (
              <Button 
                onClick={() => window.open(article.pdfPath.startsWith('tg:')
                  ? `/api/tg/file/${article.pdfPath.slice(3)}`
                  : `/uploads/${article.pdfPath}`, '_blank')}
                data-testid="button-open-pdf"
              >
                <span className="material-icons mr-2">open_in_new</span>
                Open PDF
              </Button>
            ) : (
              <div className="space-y-2">
                <Button disabled data-testid="button-pdf-not-available">
                  PDF Not Available
                </Button>
                <p className="text-xs text-muted-foreground">
                  PDF is being generated or not yet available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        {article.content && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <h3 className="font-medium mb-3 text-foreground">Article Content</h3>
              <div 
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: article.content }}
                data-testid="text-article-content"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
