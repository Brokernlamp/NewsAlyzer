import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import FileUpload from "@/components/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { NEWSPAPER_NAMES, getCurrentDate, formatDisplayDate } from "@/lib/constants";
import type { Newspaper } from "@shared/schema";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newspaperName, setNewspaperName] = useState("");
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());

  const { data: newspapers, isLoading } = useQuery<Newspaper[]>({
    queryKey: ["/api/newspapers"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; name: string; date: string }) => {
      try {
        const tgForm = new FormData();
        tgForm.append('file', data.file);
        const tgRes = await fetch('/api/tg/upload', { method: 'POST', body: tgForm as any, credentials: 'include' });
        if (tgRes.ok) {
          const tgJson = await tgRes.json();
          const payload = {
            name: data.name,
            date: data.date,
            filePath: `tg:${tgJson.file_id}`,
            originalFileName: tgJson.original || data.file.name,
            fileSize: tgJson.size || data.file.size,
            mimeType: tgJson.mimeType || data.file.type,
            status: 'uploaded',
          };
          const response = await apiRequest("POST", "/api/newspapers/json", payload);
          return response.json();
        }
      } catch (_) {}

      const form = new FormData();
      form.append('file', data.file);
      form.append('name', data.name);
      form.append('date', data.date);
      const res = await fetch('/api/newspapers', { method: 'POST', body: form as any, credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Newspaper uploaded successfully",
      });
      setSelectedFile(null);
      setNewspaperName("");
      setSelectedDate(getCurrentDate());
      queryClient.invalidateQueries({ queryKey: ["/api/newspapers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload newspaper",
        variant: "destructive",
      });
    },
  });

  const processMutation = useMutation({
    mutationFn: async (newspaperId: string) => {
      const response = await apiRequest("PATCH", `/api/newspapers/${newspaperId}/status`, {
        status: "processing"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Processing started",
        description: "Newspaper is being processed and categorized",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/newspapers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to start processing",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile || !newspaperName) {
      toast({
        title: "Missing information",
        description: "Please select a file and newspaper name",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      name: newspaperName,
      date: selectedDate,
    });
  };

  const handleBack = () => {
    setLocation("/");
  };

  const recentUploads = newspapers?.slice(0, 10) || [];

  return (
    <div className="pb-20" data-testid="page-admin">
      <Header 
        title="Admin Panel" 
        onBack={handleBack}
      />

      <div className="p-4 space-y-6">
        {/* Upload Newspaper Section */}
        <Card data-testid="card-upload-newspaper">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="material-icons text-primary">upload_file</span>
              <span>Upload Newspaper</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newspaper-name" data-testid="label-newspaper-name">Newspaper Name</Label>
              <Select value={newspaperName} onValueChange={setNewspaperName}>
                <SelectTrigger data-testid="select-newspaper-name">
                  <SelectValue placeholder="Select newspaper" />
                </SelectTrigger>
                <SelectContent>
                  {NEWSPAPER_NAMES.map((name) => (
                    <SelectItem key={name} value={name} data-testid={`option-${name.replace(/\s+/g, '-').toLowerCase()}`}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date" data-testid="label-date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                data-testid="input-date"
              />
            </div>

            <div>
              <Label data-testid="label-upload-file">Upload File</Label>
              <FileUpload 
                onFileSelect={setSelectedFile}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={50}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-selected-file">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={uploadMutation.isPending || !selectedFile || !newspaperName}
              className="w-full"
              data-testid="button-upload-newspaper"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Newspaper"}
            </Button>
          </CardContent>
        </Card>

        {/* AI Processing Section */}
        <Card data-testid="card-ai-processing">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="material-icons text-accent">auto_awesome</span>
              <span>AI Processing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Automatically extract and categorize news into UPSC subjects
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="secondary"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={processMutation.isPending}
                data-testid="button-process-latest"
              >
                <span className="material-icons text-lg mr-2">psychology</span>
                {processMutation.isPending ? "Processing..." : "Process Latest"}
              </Button>
              <Button 
                variant="secondary" 
                data-testid="button-view-status"
              >
                <span className="material-icons text-lg mr-2">trending_up</span>
                View Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card data-testid="card-recent-uploads">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
                      <div>
                        <div className="w-32 h-4 bg-muted-foreground/20 rounded mb-1"></div>
                        <div className="w-20 h-3 bg-muted-foreground/20 rounded"></div>
                      </div>
                    </div>
                    <div className="w-20 h-6 bg-muted-foreground/20 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : recentUploads.length === 0 ? (
              <p className="text-muted-foreground text-center py-4" data-testid="text-no-uploads">
                No uploads yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentUploads.map((upload) => (
                  <div 
                    key={upload.id} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`upload-${upload.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="material-icons text-primary">newspaper</span>
                      <div>
                        <p className="font-medium text-sm text-foreground" data-testid={`text-upload-name-${upload.id}`}>
                          {upload.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-upload-date-${upload.id}`}>
                          {formatDisplayDate(upload.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`px-2 py-1 text-xs font-medium ${
                          upload.status === 'processed' 
                            ? 'bg-accent text-accent-foreground' 
                            : upload.status === 'processing'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                        data-testid={`badge-upload-status-${upload.id}`}
                      >
                        {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="p-1"
                        data-testid={`button-upload-menu-${upload.id}`}
                      >
                        <span className="material-icons text-sm">more_vert</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
