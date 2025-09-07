import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDisplayDate } from "@/lib/constants";
import type { UpscSubject, Article } from "@shared/schema";

export default function SubjectFolder() {
  const [, params] = useRoute("/subject/:subjectId");
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const subjectId = params?.subjectId || "";

  const { data: subject, isLoading: loadingSubject } = useQuery<UpscSubject>({
    queryKey: ["/api/subjects", subjectId],
  });

  const { data: articles, isLoading: loadingArticles } = useQuery<Article[]>({
    queryKey: ["/api/subjects", subjectId, "articles"],
  });

  const { data: searchResults, isLoading: searching } = useQuery<Article[]>({
    queryKey: ["/api/search", searchQuery, subjectId],
    enabled: searchQuery.length > 2,
  });

  const handleBack = () => {
    setLocation("/");
  };

  const displayArticles = searchQuery.length > 2 ? searchResults : articles;

  // Group articles by date
  const articlesByDate = displayArticles?.reduce((acc, article) => {
    const date = article.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(article);
    return acc;
  }, {} as Record<string, Article[]>) || {};

  const sortedDates = Object.keys(articlesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="pb-20" data-testid="page-subject-folder">
      <Header 
        title={loadingSubject ? "Loading..." : subject?.name || "Subject"}
        onBack={handleBack}
      />

      <div className="p-4 bg-card border-b border-border">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground" data-testid="text-subject-description">
            Daily summaries organized by date
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            search
          </span>
          <Input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-articles"
          />
        </div>
      </div>

      <div className="p-4">
        {loadingArticles || loadingSubject ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="w-48 h-6 bg-muted rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-48 h-4 bg-muted rounded"></div>
                      <div className="w-12 h-6 bg-muted rounded-full ml-2"></div>
                    </div>
                    <div className="w-full h-3 bg-muted rounded mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="w-24 h-3 bg-muted rounded"></div>
                      <div className="w-16 h-8 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <span className="material-icons text-4xl text-muted-foreground mb-2">
                {searchQuery.length > 2 ? "search_off" : "article"}
              </span>
              <p className="text-muted-foreground" data-testid="text-no-articles">
                {searchQuery.length > 2 
                  ? `No articles found for "${searchQuery}"`
                  : "No articles available for this subject"}
              </p>
              {searchQuery.length <= 2 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Articles will appear here when newspapers are processed
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date} data-testid={`date-section-${date}`}>
                <h3 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <span className="material-icons text-primary">event</span>
                  <span data-testid={`text-date-${date}`}>{formatDisplayDate(date)}</span>
                </h3>
                <div className="space-y-2">
                  {articlesByDate[date].map((article) => (
                    <Card key={article.id} className="shadow-sm" data-testid={`card-article-${article.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-foreground line-clamp-2" data-testid={`text-article-title-${article.id}`}>
                            {article.title}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className="ml-2 whitespace-nowrap"
                            data-testid={`badge-article-type-${article.id}`}
                          >
                            PDF
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2" data-testid={`text-article-summary-${article.id}`}>
                          {article.summary}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground" data-testid={`text-article-meta-${article.id}`}>
                            {article.pageCount} pages • {article.readTime} min read
                          </span>
                          <Link href={`/pdf/${article.id}`}>
                            <Button 
                              size="sm" 
                              className="flex items-center space-x-1"
                              data-testid={`button-open-article-${article.id}`}
                            >
                              <span className="material-icons text-sm">open_in_new</span>
                              <span>Open</span>
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {searching && searchQuery.length > 2 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground" data-testid="text-searching">
              Searching...
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
