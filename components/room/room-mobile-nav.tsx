import { Pencil } from "lucide-react";
import { cn } from "@/lib/cn";

type Tab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge: number;
};

type RoomMobileNavProps = {
  tabs: Tab[];
  mobileActiveTab: string;
  onTabChange: (tabId: string) => void;
};

export function RoomMobileNav({
  tabs,
  mobileActiveTab,
  onTabChange,
}: RoomMobileNavProps) {
  const allTabs = [
    {
      id: "whiteboard",
      label: "Board",
      icon: <Pencil className="h-5 w-5" />,
      badge: 0,
    },
    ...tabs,
  ];

  return (
    <div className="flex lg:hidden shrink-0 border-t bg-card">
      {allTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
            mobileActiveTab === tab.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="relative">
            {tab.icon}
            {tab.badge > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
