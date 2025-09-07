import { Link } from "wouter";

interface HeaderProps {
  showAdminButton?: boolean;
  title?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export default function Header({ 
  showAdminButton = false, 
  title = "UPSC News Analyzer",
  onBack,
  actions 
}: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-50 shadow-md" data-testid="header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack ? (
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-primary/80 transition-colors"
              data-testid="button-back"
            >
              <span className="material-icons">arrow_back</span>
            </button>
          ) : (
            <span className="material-icons text-2xl">article</span>
          )}
          <h1 className="text-lg font-semibold" data-testid="text-title">{title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          {actions}
          {showAdminButton && (
            <Link href="/admin">
              <button 
                className="p-2 rounded-full hover:bg-primary/80 transition-colors"
                data-testid="button-admin"
              >
                <span className="material-icons">admin_panel_settings</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
