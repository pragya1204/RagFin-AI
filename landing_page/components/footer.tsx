import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react"; // Keep relevant social icons

export default function Footer() {
  return (
    <footer className="border-t bg-background"> {/* Ensure background matches theme */}
      <div className="container flex flex-col gap-8 py-8 md:flex-row md:py-12 px-4 sm:px-6 lg:px-8"> {/* Added padding */}
        <div className="flex-1 space-y-4">
          <h2 className="font-bold text-lg">RagFin AI</h2> {/* Slightly larger heading */}
          <p className="text-sm text-muted-foreground">
            Your AI partner for smarter tax & financial decisions. {/* Updated tagline */}
          </p>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3"> {/* Adjusted gap */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Product</h3> {/* Adjusted color */}
            <ul className="space-y-3 text-sm">
              {/* Link to page sections */}
              <li>
                <Link href="#features" className="text-muted-foreground transition-colors hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-muted-foreground transition-colors hover:text-primary">
                  How it Works
                </Link>
              </li>
               <li>
                <Link href="#pricing" className="text-muted-foreground transition-colors hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#security" className="text-muted-foreground transition-colors hover:text-primary">
                  Security
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Company</h3> {/* Adjusted color */}
            <ul className="space-y-3 text-sm">
               {/* Use actual page links */}
              <li>
                <Link href="/about" className="text-muted-foreground transition-colors hover:text-primary">
                  About Us
                </Link>
              </li>
               <li>
                <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
               <li>
                <Link href="/terms" className="text-muted-foreground transition-colors hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              {/* Add Blog, Contact etc. if applicable */}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Connect</h3> {/* Adjusted color */}
            <div className="flex space-x-4">
              {/* Update hrefs to actual RagFin AI social profiles */}
              <Link
                href="https://github.com/your-org/ragfinai" // Update placeholder
                target="_blank" rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                 href="https://twitter.com/ragfinai" // Update placeholder
                 target="_blank" rel="noreferrer"
                 className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                 href="https://linkedin.com/company/ragfinai" // Update placeholder
                 target="_blank" rel="noreferrer"
                 className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="container border-t py-6">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RagFin AI. All rights reserved. {/* Removed Inc. unless it's formal name */}
        </p>
      </div>
    </footer>
  );
}

