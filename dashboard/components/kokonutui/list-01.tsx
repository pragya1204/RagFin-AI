import { cn } from "@/lib/utils";
import { Plus, SendHorizontal, ArrowDownLeft, ArrowRight } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: "update" | "deadline" | "reminder";
}

interface List01Props {
  notifications?: NotificationItem[];
  className?: string;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "New Federal Tax Update",
    description: "Revised tax slabs for FY2025 announced.",
    date: "Oct 10, 2024",
    type: "update",
  },
  {
    id: "2",
    title: "Federal Filing Deadline",
    description: "File your tax return by Dec 31, 2024.",
    date: "Dec 31, 2024",
    type: "deadline",
  },
  {
    id: "3",
    title: "Deduction Reminder",
    description: "Maximize your deductions before year-end.",
    date: "Nov 15, 2024",
    type: "reminder",
  },
  {
    id: "4",
    title: "State Tax Alert",
    description: "New guidelines released for state taxes.",
    date: "Oct 15, 2024",
    type: "update",
  },
  {
    id: "5",
    title: "Amendment Opportunity",
    description: "Review if an amendment can benefit you.",
    date: "Nov 05, 2024",
    type: "reminder",
  },
];

export default function List01({ notifications = NOTIFICATIONS, className }: List01Props) {
  return (
    <div
      className={cn(
        "w-full max-w-xl mx-auto",
        "bg-[#1A1A2E]",
        "border border-[#2A2A35]",
        "rounded-xl shadow-sm backdrop-blur-xl",
        className,
      )}
    >
      {/* Header Section */}
      <div className="p-4 border-b border-[#2A2A35]">
        <p className="text-xs text-gray-400">Tax Notifications</p>
        <h1 className="text-2xl font-semibold text-white">Latest Updates</h1>
      </div>

      {/* Notifications List */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-white">Notifications</h2>
        </div>
        <div className="space-y-1">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "group flex items-center justify-between",
                "p-2 rounded-lg",
                "hover:bg-[#3F3F5A]",
                "transition-all duration-200"
              )}
            >
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-white">{notification.title}</h3>
                {notification.description && (
                  <p className="text-[11px] text-gray-400">{notification.description}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-white">{notification.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with Buttons */}
      <div className="p-2 border-t border-[#2A2A35]">
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-[#6A5ACD] text-white hover:bg-[#8A7BFF] shadow-sm hover:shadow transition-all duration-200"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-[#6A5ACD] text-white hover:bg-[#8A7BFF] shadow-sm hover:shadow transition-all duration-200"
            )}
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>Mark Read</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-[#6A5ACD] text-white hover:bg-[#8A7BFF] shadow-sm hover:shadow transition-all duration-200"
            )}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Remind</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-[#6A5ACD] text-white hover:bg-[#8A7BFF] shadow-sm hover:shadow transition-all duration-200"
            )}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>More</span>
          </button>
        </div>
      </div>
    </div>
  );
}

