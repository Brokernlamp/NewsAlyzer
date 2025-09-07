import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDisplayDate, getCurrentDate } from "@/lib/constants";
import type { Newspaper, UpscSubject } from "@shared/schema";

export default function Home() {
  const { data: newspapers, isLoading: loadingNewspapers } = useQuery<Newspaper[]>({
    queryKey: ["/api/newspapers"],
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery<UpscSubject[]>({
    queryKey: ["/api/subjects"],
  });

  // Filter today's newspapers
  const todaysNewspapers = newspapers?.filter(
    newspaper => newspaper.date === getCurrentDate()
  ) || [];

  return (
    <div className="pb-20" data-testid="page-home">
      <Header showAdminButton={true} />
      
      {/* Today's Newspaper Section */}
      <div className="p-4 bg-card border-b border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground" data-testid="text-todays-newspapers">
          Today's Newspaper
        </h2>
        
        {loadingNewspapers ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded"></div>
                    <div>
                      <div className="w-32 h-4 bg-muted rounded mb-1"></div>
                      <div className="w-24 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-muted rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="w-full h-12 bg-muted rounded-lg"></div>
                  <div className="w-full h-12 bg-muted rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : todaysNewspapers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <span className="material-icons text-4xl text-muted-foreground mb-2">newspaper</span>
              <p className="text-muted-foreground" data-testid="text-no-newspapers">
                No newspapers uploaded for today
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Check the admin panel to upload newspapers
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {todaysNewspapers.map((newspaper) => (
              <Card key={newspaper.id} className="shadow-sm" data-testid={`card-newspaper-${newspaper.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="material-icons text-primary text-2xl">newspaper</span>
                      <div>
                        <h3 className="font-medium text-foreground" data-testid={`text-newspaper-name-${newspaper.id}`}>
                          {newspaper.name}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-newspaper-date-${newspaper.id}`}>
                          {formatDisplayDate(newspaper.date)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-accent text-accent-foreground" data-testid={`badge-newspaper-status-${newspaper.id}`}>
                      {newspaper.status === 'processed' ? 'Processed' : 'New'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/newspaper/${newspaper.id}`}>
                      <Button 
                        className="w-full py-3 font-medium text-sm flex items-center justify-center space-x-2"
                        data-testid={`button-view-full-${newspaper.id}`}
                      >
                        <span className="material-icons text-lg">visibility</span>
                        <span>View Full</span>
                      </Button>
                    </Link>
                    <Link href={`/newspaper/${newspaper.id}?view=summary`}>
                      <Button 
                        variant="secondary"
                        className="w-full py-3 font-medium text-sm flex items-center justify-center space-x-2"
                        data-testid={`button-view-summary-${newspaper.id}`}
                      >
                        <span className="material-icons text-lg">summarize</span>
                        <span>Summary</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* UPSC Subjects Section */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4 text-foreground" data-testid="text-upsc-subjects">
          UPSC Subjects
        </h2>
        
        {loadingSubjects ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 shadow-sm animate-pulse">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="w-20 h-4 bg-muted rounded"></div>
                  <div className="w-16 h-3 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !subjects || subjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <span className="material-icons text-4xl text-muted-foreground mb-2">folder</span>
              <p className="text-muted-foreground" data-testid="text-no-subjects">
                No subjects available
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {subjects.map((subject) => (
              <Link key={subject.id} href={`/subject/${subject.id}`}>
                <Card 
                  className="shadow-sm hover:shadow-md transition-all cursor-pointer"
                  data-testid={`card-subject-${subject.slug}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="folder-icon w-12 h-12 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="material-icons text-white text-2xl">folder</span>
                      </div>
                      <h3 className="font-medium text-sm text-foreground" data-testid={`text-subject-name-${subject.id}`}>
                        {subject.name}
                      </h3>
                      <p className="text-xs text-muted-foreground" data-testid={`text-subject-count-${subject.id}`}>
                        {subject.articleCount} articles
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
