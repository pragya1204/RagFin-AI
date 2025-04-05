import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"; // Keep social icons

export default function Footer() {
  return (
    <footer className="bg-muted/60 text-muted-foreground py-12 border-t"> {/* Adjusted background/text colors */}
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">RagFin AI</h3>
          <p className="text-sm">AI-powered financial guidance at your fingertips.</p> {/* Updated tagline */}
        </div>
        <div>
          <h4 className="text-base font-semibold mb-4 text-foreground">Product</h4> {/* Adjusted heading size */}
          <ul className="space-y-2">
            <li>
              <Link href="#features" className="text-sm hover:text-foreground">
                Features
              </Link>
            </li>
             <li>
              <Link href="#how-it-works" className="text-sm hover:text-foreground">
                How it Works
              </Link>
            </li>
            <li>
              <Link href="#pricing" className="text-sm hover:text-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="#security" className="text-sm hover:text-foreground">
                Security
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-base font-semibold mb-4 text-foreground">Company</h4> {/* Adjusted heading size */}
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="text-sm hover:text-foreground"> {/* Example internal link */}
                About Us
              </Link>
            </li>
             <li>
              <Link href="/privacy" className="text-sm hover:text-foreground"> {/* Example internal link */}
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-sm hover:text-foreground"> {/* Example internal link */}
                Terms of Service
              </Link>
            </li>
             <li>
              <Link href="/contact" className="text-sm hover:text-foreground"> {/* Example internal link */}
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-base font-semibold mb-4 text-foreground">Connect</h4> {/* Adjusted heading size */}
          <div className="flex space-x-4">
            {/* Keep social links - update hrefs later */}
            <Link href="#" className="hover:text-foreground">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="#" className="hover:text-foreground">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="hover:text-foreground">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="hover:text-foreground">
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-8 pt-8 border-t border-border/40 text-center text-sm px-4 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} RagFin AI. All rights reserved.</p> {/* Dynamic year */}
      </div>
    </footer>
  );
}

