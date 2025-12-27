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
    <header className="sticky top-0 z-50 bg-[#0b2a4a] text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-[#1a4d7a]"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {onMenu && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-[#1a4d7a]"
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
            className="text-white hover:bg-[#1a4d7a] relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#c79b2d] rounded-full"></span>
          </Button>
        )}
      </div>
    </header>
  );
}
