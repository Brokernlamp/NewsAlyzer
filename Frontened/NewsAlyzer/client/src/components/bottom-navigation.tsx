import { useLocation } from "wouter";
import { Link } from "wouter";

const navItems = [
  { id: "home", path: "/", icon: "home", label: "Home" },
  { id: "search", path: "/search", icon: "search", label: "Search" },
  { id: "bookmarks", path: "/bookmarks", icon: "bookmark", label: "Saved" },
  { id: "profile", path: "/profile", icon: "person", label: "Profile" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[414px] bg-card border-t border-border" data-testid="bottom-navigation">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.id} href={item.path}>
              <button 
                className={`nav-item flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  isActive ? "active" : "hover:bg-muted"
                }`}
                data-testid={`nav-${item.id}`}
              >
                <span className={`material-icons ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.icon}
                </span>
                <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
