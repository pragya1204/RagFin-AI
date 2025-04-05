import { Button } from "@/components/ui/button";
import Link from "next/link"; // Import Link for navigation
// import { ArrowRight } from "lucide-react"; // Optional icon

const CHAT_INTERFACE_URL = "http://localhost:3000";
export default function Hero() {
  return (
    <section className="container flex min-h-[calc(100vh-4rem)] max-w-screen-2xl flex-col items-center justify-center space-y-8 py-24 text-center md:py-32"> {/* Adjusted height calc slightly if needed */}
      <div className="space-y-4">
        <h1 className="bg-gradient-to-br from-foreground from-30% via-foreground/90 to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
        RagFin AI - Your Financial Copilot
        </h1>
        <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Get personalized, real-time answers to complex tax and financial questions. RagFin AI makes managing your money simple, secure, and stress-free.
        </p>
      </div>
      <div className="flex gap-4">
        <Button size="lg" asChild>
        <a href={CHAT_INTERFACE_URL}> {/* <-- Standard anchor tag */}
              Get Started for Free
            </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="#features"> {/* Link to features section */}
            Learn More
          </Link>
        </Button>
      </div>
    </section>
  );
}

