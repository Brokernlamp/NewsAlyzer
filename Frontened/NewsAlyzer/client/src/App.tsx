import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import SubjectFolder from "@/pages/subject-folder";
import PdfViewer from "@/pages/pdf-viewer";
import NewspaperViewer from "@/pages/newspaper-viewer";
import Library from "@/pages/library";
import Settings from "@/pages/settings";
import Login from "@/pages/login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/subject/:subjectId" component={SubjectFolder} />
      <Route path="/pdf/:articleId" component={PdfViewer} />
      <Route path="/newspaper/:newspaperId" component={NewspaperViewer} />
      <Route path="/library" component={Library} />
      <Route path="/settings" component={Settings} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="mobile-container bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
