import Link from "next/link";
import { Button } from "@/components/ui/button"; // Ensure this path is correct
import { Github } from "lucide-react"; // Keep if using the GitHub link, otherwise remove

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">

        {/* Logo / Branding */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* Optional: <YourLogoIcon className="h-6 w-6" /> */}
          <span className="font-bold">RagFin AI</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="#features" className="text-muted-foreground transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="#how-it-works" className="text-muted-foreground transition-colors hover:text-primary">
            How it Works
          </Link>
          <Link href="#pricing" className="text-muted-foreground transition-colors hover:text-primary">
            Pricing
          </Link>
          <Link href="#security" className="text-muted-foreground transition-colors hover:text-primary">
            Security
          </Link>
          {/* Add other links like /blog or /about if needed */}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">

          {/* Optional GitHub Link - Uncomment and update href if needed */}
          {/*
          <Link
            href="https://github.com/your-org/ragfinai" // <<< UPDATE THIS PLACEHOLDER
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="icon" aria-label="GitHub"> // Added aria-label
              <Github className="h-4 w-4" />
              // Screen reader text can be part of aria-label now
              // <span className="sr-only">GitHub</span>
            </Button>
          </Link>
          */}

          {/* Sign In Button */}
          <Button variant="ghost" size="sm">
            Sign In
          </Button>

          {/* Get Started Button with Link */}
          {/* Ensure this block is typed cleanly */}
          <Button size="sm" asChild>
            <Link href="#pricing">
              Get Started
            </Link>
          </Button>

        </div>
      </div>
    </header>
  );
}

