import { cn } from "@/lib/utils";
import {
  Calendar,
  ArrowRight,
  CheckCircle2,
  Timer,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import React from "react";

interface ListItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconStyle: "update" | "filing" | "reminder";
  date: string;
  status: "pending" | "in-progress" | "completed";
  progress?: number;
}

interface List03Props {
  items?: ListItem[];
  className?: string;
}

const iconStyles = {
  update: "bg-[#2A2A35] text-white",
  filing: "bg-[#2A2A35] text-white",
  reminder: "bg-[#2A2A35] text-white",
};

const statusConfig = {
  pending: {
    icon: Timer,
    class: "text-amber-400",
    bg: "bg-amber-900/30",
  },
  "in-progress": {
    icon: AlertCircle,
    class: "text-blue-400",
    bg: "bg-blue-900/30",
  },
  completed: {
    icon: CheckCircle2,
    class: "text-emerald-400",
    bg: "bg-emerald-900/30",
  },
};

const ITEMS: ListItem[] = [
  {
    id: "1",
    title: "Federal Tax Filing",
    subtitle: "Prepare documents for your federal return",
    icon: CreditCard,
    iconStyle: "filing",
    date: "Due: Dec 31, 2024",
    status: "pending",
    progress: 40,
  },
  {
    id: "2",
    title: "State Tax Filing",
    subtitle: "Complete your state tax forms",
    icon: CreditCard,
    iconStyle: "filing",
    date: "Due: Nov 30, 2024",
    status: "in-progress",
    progress: 60,
  },
  {
    id: "3",
    title: "Tax Regime Review",
    subtitle: "Examine new tax rules and guidelines",
    icon: CreditCard,
    iconStyle: "update",
    date: "Review: Oct 15, 2024",
    status: "completed",
    progress: 100,
  },
];

export default function List03({ items = ITEMS, className }: List03Props) {
  return (
    <div className={cn("w-full overflow-x-auto scrollbar-none", className)}>
      <div className="flex gap-3 min-w-full p-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex flex-col",
              "w-[280px] shrink-0",
              "bg-[#1A1A2E]",
              "rounded-xl",
              "border border-[#2A2A35]",
              "hover:border-[#3F3F5A]",
              "transition-all duration-200",
              "shadow-sm backdrop-blur-xl"
            )}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-lg", iconStyles[item.iconStyle])}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                    statusConfig[item.status].bg,
                    statusConfig[item.status].class
                  )}
                >
                  {React.createElement(statusConfig[item.status].icon, { className: "w-3.5 h-3.5" })}
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-1">{item.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{item.subtitle}</p>
              </div>

              {typeof item.progress === "number" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{item.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-[#2A2A35] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6A5ACD] rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                <span>{item.date}</span>
              </div>
            </div>

            <div className="mt-auto border-t border-[#2A2A35]">
              <button
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "py-2.5 px-3",
                  "text-xs font-medium",
                  "text-gray-400",
                  "hover:text-white",
                  "hover:bg-[#3F3F5A]",
                  "transition-colors duration-200"
                )}
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


