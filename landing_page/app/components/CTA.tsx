import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="py-20 bg-primary text-primary-foreground"> {/* Use primary colors */}
      <div className="container mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-6">Ready to Simplify Your Financial Life?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-foreground/90"> {/* Adjusted text color */}
          Let RagFin AI handle the complexity of taxes and financial planning with personalized, AI-driven insights. Get started today.
        </p>
        <Button size="lg" variant="secondary"> {/* Secondary variant often contrasts well on primary bg */}
          Start Your Free Trial
        </Button>
      </div>
    </section>
  );
}
