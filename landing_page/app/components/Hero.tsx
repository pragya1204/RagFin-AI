import { Button } from "@/components/ui/button"; // Assuming Button is from shadcn/ui

export default function Hero() {
  return (
    <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24"> {/* Adjust padding as needed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
          Simplify Your Taxes & Finances
          <br />
          <span className="text-primary">with AI-Powered Guidance</span> {/* Use primary color for emphasis */}
        </h1>
        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10"> {/* Adjusted max-width */}
          RagFin AI delivers personalized, real-time answers to your complex tax and financial questions using advanced AI, an intuitive chat interface, and a comprehensive dashboard.
        </p>
        <Button className="relative group px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"> {/* Adjusted styling */}
          <span className="relative z-10">Get Started for Free</span>
          {/* Optional: Keep glow effect if desired */}
          {/* <div className="absolute inset-0 bg-white/20 blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" /> */}
        </Button>
      </div>
    </div>
  );
}

