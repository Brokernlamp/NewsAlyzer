import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
}

export default function FileUpload({ 
  onFileSelect, 
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSize = 50,
  multiple = false 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = accept.split(',').map(type => {
      if (type.startsWith('.')) {
        // Convert extension to MIME type
        const ext = type.slice(1);
        switch (ext) {
          case 'pdf': return 'application/pdf';
          case 'jpg':
          case 'jpeg': return 'image/jpeg';
          case 'png': return 'image/png';
          default: return '';
        }
      }
      return type;
    });

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid file type",
        variant: "destructive",
      });
      return;
    }

    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className="hidden"
        data-testid="input-file-hidden"
      />
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        data-testid="dropzone-file-upload"
      >
        <span className="material-icons text-4xl text-muted-foreground mb-2">cloud_upload</span>
        <p className="text-sm text-muted-foreground" data-testid="text-upload-instructions">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-muted-foreground mt-1" data-testid="text-file-restrictions">
          PDF, JPG, PNG up to {maxSize}MB
        </p>
      </div>
    </div>
  );
}
