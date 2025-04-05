import { Bot, BarChartHorizontalBig, ScanSearch, BellRing } from "lucide-react"; // Changed icons

const features = [
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: "AI-Powered Guidance",
    description: "Get personalized answers to your tax and finance questions 24/7 via our intelligent chat.",
  },
  {
    icon: <BarChartHorizontalBig className="h-8 w-8 text-primary" />, // Icon for dashboard/insights
    title: "Personalized Dashboard",
    description: "View critical tax notifications, track recent activities, and manage upcoming tasks in one place.",
  },
  {
    icon: <ScanSearch className="h-8 w-8 text-primary" />, // Icon for data scanning/integration
    title: "Automated Data Handling",
    description: "Securely connect bank accounts (via Plaid) or upload documents with OCR for effortless data entry.",
  },
  {
    icon: <BellRing className="h-8 w-8 text-primary" />, // Icon for notifications/reminders
    title: "Proactive Tax Management",
    description: "Stay ahead with timely alerts on regulation changes and reminders for important deadlines.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-muted/40"> {/* Adjusted background */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Features Designed for Financial Clarity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-card p-6 rounded-lg border shadow-sm"> {/* Use card styles */}
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-card-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p> {/* Use muted foreground */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

