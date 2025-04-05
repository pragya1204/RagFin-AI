import { Brain, LayoutDashboard, DatabaseZap, BellRing } from "lucide-react"; // Updated icons

const features = [
  {
    name: "Real-Time AI Financial Chat",
    description: "Ask complex tax & finance questions. Our advanced RAG AI analyzes your situation and uploaded documents in real-time for personalized, accurate answers 24/7.",
    icon: Brain, // Kept original icon
  },
  {
    name: "Unified Financial Hub",
    description: "Monitor tax deadlines, review financial activities, and see relevant notifications—all consolidated in your personal dashboard overview.",
    icon: LayoutDashboard, // Kept original icon
  },
  {
    name: "Intelligent Document Analysis",
    description: "Securely upload receipts, tax forms, and statements. Our AI extracts and analyzes key data using OCR, tailoring guidance specifically to your documents.",
    icon: DatabaseZap, // Kept original icon (can represent data processing/power)
  },
  {
    name: "Proactive & Personalized Alerts",
    description: "Stay ahead effortlessly. Receive timely reminders for tax deadlines and notifications about regulation changes relevant to your analyzed financial situation.",
    icon: BellRing, // Kept original icon
  },
];

export default function Features() {
  return (
    <section id="features" className="container space-y-16 py-24 md:py-32"> {/* Added ID */}
      <div className="mx-auto max-w-[58rem] text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
          Features Designed for Financial Peace of Mind
        </h2>
        <p className="mt-4 text-muted-foreground sm:text-lg">
          Explore how RagFin AI uses advanced AI and intuitive tools to take the stress out of tax and financial management.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.name} className="relative overflow-hidden rounded-lg border bg-card p-8 shadow-sm"> {/* Use bg-card */}
            <div className="flex items-center gap-4 mb-2"> {/* Added margin-bottom */}
              <feature.icon className="h-8 w-8 text-primary" /> {/* Added text-primary */}
              <h3 className="font-semibold text-lg">{feature.name}</h3> {/* Adjusted font weight/size */}
            </div>
            <p className="mt-2 text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
