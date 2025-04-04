import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";

interface TransactionItem {
  id: string;
  title: string;
  description?: string;
  amount?: string;
  date: string;
  type: "filing" | "payment" | "update";
}

interface List02Props {
  activities?: TransactionItem[];
  className?: string;
}

const ACTIVITIES: TransactionItem[] = [
  {
    id: "1",
    title: "Tax Filing Reminder",
    description: "Submit your federal tax return by Dec 31, 2024.",
    amount: "",
    date: "Nov 25, 2024",
    type: "filing",
  },
  {
    id: "2",
    title: "Payment Confirmation",
    description: "Federal tax payment of $1,200 completed.",
    amount: "$1,200",
    date: "Oct 05, 2024",
    type: "payment",
  },
  {
    id: "3",
    title: "Tax Regime Update",
    description: "New changes in tax slabs announced.",
    amount: "",
    date: "Sep 15, 2024",
    type: "update",
  },
  {
    id: "4",
    title: "State Filing Reminder",
    description: "Your state tax return is due by Nov 30, 2024.",
    amount: "",
    date: "Nov 01, 2024",
    type: "filing",
  },
];

export default function List02({ activities = ACTIVITIES, className }: List02Props) {
  return (
    <div
      className={cn(
        "w-full max-w-xl mx-auto",
        "bg-[#1A1A2E]",
        "border border-[#2A2A35]",
        "rounded-xl shadow-sm backdrop-blur-xl",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">
            Recent Tax Activities
            <span className="text-xs font-normal text-gray-400 ml-1">(4 items)</span>
          </h2>
          <span className="text-xs text-gray-400">This Month</span>
        </div>
        <div className="space-y-1">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "group flex items-center gap-3 p-2 rounded-lg hover:bg-[#3F3F5A] transition-all duration-200"
              )}
            >
              <div className={cn("p-2 rounded-lg bg-[#2A2A35] border border-[#3F3F5A]")}>
                {activity.type === "filing" && <Wallet className="w-4 h-4 text-blue-400" />}
                {activity.type === "payment" && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                {activity.type === "update" && <ArrowDownLeft className="w-4 h-4 text-amber-400" />}
              </div>
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-medium text-white">{activity.title}</h3>
                  <p className="text-[11px] text-gray-400">{activity.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-white">{activity.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-2 border-t border-[#2A2A35]">
        <button
          type="button"
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-gradient-to-r from-[#6A5ACD] to-[#8A7BFF] text-white hover:from-[#8A7BFF] hover:to-[#9A8BFF] shadow-sm hover:shadow transition-all duration-200"
          )}
        >
          <span>View All Tax Activities</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

