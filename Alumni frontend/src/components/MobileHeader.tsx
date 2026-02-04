import { ArrowLeft, Bell, Menu } from "lucide-react";
import { Button } from "./ui/button";

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
  showNotifications?: boolean;
}

export function MobileHeader({ title, onBack, onMenu, showNotifications = true }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-sidebar-accent"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {onMenu && (
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-sidebar-accent"
              onClick={onMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg">{title}</h1>
        </div>
        {showNotifications && (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-sidebar-accent relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
          </Button>
        )}
      </div>
    </header>
  );
}
