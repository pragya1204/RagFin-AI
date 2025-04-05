import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="border-t bg-muted/40"> {/* Added subtle background */}
      <div className="container flex flex-col items-center gap-4 py-24 text-center md:py-32 px-4"> {/* Added padding-x */}
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
          Ready to Take Control of Your Finances?
        </h2>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Stop guessing and start getting clear, AI-powered answers for your taxes and financial planning. Simplify your life with RagFin AI.
        </p>
        <Button size="lg" className="mt-4" asChild>
          <Link href="#pricing">
            Get Started for Free
          </Link>
        </Button>
      </div>
    </section>
  );
}

